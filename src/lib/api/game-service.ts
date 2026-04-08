/**
 * Service de logique de jeu côté serveur.
 * Orchestration DB + logique pure (`game-logic.ts`) + gestion des questions.
 *
 * Tous les bugs gameplay identifiés dans l'analyse Flutter sont corrigés ici :
 *  - Bug #1 : phase timing piloté par `phaseStartedAt` / `phaseTransitionAt` serveur
 *  - Bug #2 : cache questions 1-10 correct (voir question-cache.ts)
 *  - Bug #3 : transition Débuter via `phaseTransitionAt` server timestamp
 *  - Bug #4 : timer via /api/time (pas de DateTime.now() client dans la logique)
 *  - Bug #5 : parser Intrepide par lettre (voir normalize-intrepide.ts)
 */

import { getRoomById, updateRoomGameState, updatePlayerPositionScore } from './room-repo';
import { getQuestionsByCategory, getQuestionCache, saveQuestionCache } from './question-repo';
import { incrementPlayerStats } from './player-repo';
import { SQUARE_CATEGORIES } from '@/lib/game/board-positions';
import {
  movePlayer,
  nextPlayer,
  hasPlayerReachedEnd,
} from '@/lib/game/game-logic';
import {
  isQuestionExhausted,
  markQuestionSeen,
  pickAvailableDifficulty,
} from '@/lib/game/question-cache';
import type {
  GameState,
  GameTurn,
} from '@/lib/schemas/game-state.schema';
import type {
  Question,
  StandardQuestion,
  DebuterQuestion,
} from '@/lib/schemas/question.schema';
import type { QuestionCategory } from '@/lib/schemas/enums';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

export class GameError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

/** Charge une room ou lance une erreur 404. */
async function loadRoomOrThrow(roomId: string) {
  const room = await getRoomById(roomId);
  if (!room) throw new GameError('Salle introuvable', 404);
  return room;
}

/** Tire une question aléatoire pour la catégorie, en tenant compte du cache. */
async function drawQuestion(
  playerId: string,
  category: QuestionCategory,
): Promise<{ question: Question; difficulty: number }> {
  const allQuestions = await getQuestionsByCategory(category);
  if (allQuestions.length === 0) {
    throw new GameError(`Aucune question disponible pour ${category}`, 500);
  }

  if (category === 'debuter' || category === 'final' || category === 'intrepide') {
    const pick = allQuestions[Math.floor(Math.random() * allQuestions.length)]!;
    return { question: pick, difficulty: 0 };
  }

  const cache = await getQuestionCache(playerId);
  const standardQuestions = allQuestions.filter(
    (q): q is StandardQuestion => q.kind === 'standard',
  );
  const available = standardQuestions.filter((q) => !isQuestionExhausted(cache, q.id));
  const pool = available.length > 0 ? available : standardQuestions;
  const picked = pool[Math.floor(Math.random() * pool.length)]!;
  const difficulty =
    pickAvailableDifficulty(cache, picked.id) ?? GAME_CONSTANTS.minDifficulty;
  return { question: picked, difficulty };
}

/** Démarre la partie : charge une question Débuter et passe en phase debuter_question. */
export async function startGame(roomId: string, hostId: string): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  if (room.hostId !== hostId) throw new GameError('Seul l\'hôte peut démarrer la partie', 403);
  if (room.players.length < room.minPlayers) {
    throw new GameError('Pas assez de joueurs', 400);
  }
  if (!room.players.every((p) => p.isReady)) {
    throw new GameError('Tous les joueurs doivent être prêts', 400);
  }

  const debuterDraw = await drawQuestion(hostId, 'debuter');
  const debuterQuestion = debuterDraw.question as DebuterQuestion;

  const firstPlayerId = room.players[0]!.id;
  const debuterTurn: GameTurn = {
    playerId: firstPlayerId,
    question: debuterQuestion,
    selectedDifficulty: 0,
    givenAnswer: null,
    isCorrect: false,
    timeSpent: 0,
    startedAt: new Date(),
    completedAt: null,
  };

  const playerScores: Record<string, number> = {};
  const playerPositions: Record<string, number> = {};
  for (const p of room.players) {
    playerScores[p.id] = 0;
    playerPositions[p.id] = 0;
  }

  const initialState: GameState = {
    currentPlayerId: firstPlayerId,
    currentRound: 1,
    currentPhase: 'debuter_question',
    turnHistory: [],
    currentTurn: debuterTurn,
    usedQuestionIds: [debuterQuestion.id],
    playerScores,
    playerPositions,
    winnerId: null,
    isFinalQuestion: false,
    phaseStartedAt: new Date(),
    phaseTransitionAt: null,
    remainingTime: 0,
    debuterAnswers: {},
    firstCorrectDebuterId: null,
  };
  await updateRoomGameState(roomId, initialState, 'playing');
}

/**
 * Désigne le joueur qui commence la partie en phase Débuter.
 *
 * Les questions Débuter sont des instructions de sélection (ex: "le joueur le plus jeune commence")
 * et non des questions avec une bonne réponse. N'importe quel joueur peut cliquer sur le joueur
 * désigné, le premier clic gagne et lance la partie immédiatement.
 */
export async function selectStartingPlayer(
  roomId: string,
  callerId: string,
  selectedPlayerId: string,
): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state) throw new GameError('État manquant');
  if (state.currentPhase !== 'debuter_question') throw new GameError('Phase incorrecte');
  if (state.firstCorrectDebuterId) {
    // Déjà désigné → idempotent, on ne fait rien
    return;
  }
  const callerInRoom = room.players.some((p) => p.id === callerId);
  if (!callerInRoom) throw new GameError('Vous ne faites pas partie de la salle', 403);
  const selectedInRoom = room.players.some((p) => p.id === selectedPlayerId);
  if (!selectedInRoom) throw new GameError('Joueur sélectionné inconnu', 400);

  const updated: GameState = {
    ...state,
    firstCorrectDebuterId: selectedPlayerId,
    currentPlayerId: selectedPlayerId,
    currentPhase: 'waiting_to_start',
    currentTurn: null,
    phaseStartedAt: new Date(),
    phaseTransitionAt: null,
  };
  await updateRoomGameState(roomId, updated);
}

/** Démarre un nouveau tour pour le joueur courant. */
export async function startTurn(roomId: string, playerId: string): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state) throw new GameError('État manquant');
  if (state.currentPlayerId !== playerId) throw new GameError('Ce n\'est pas votre tour');
  if (state.currentPhase !== 'waiting_to_start') throw new GameError('Phase incorrecte');

  const position = state.playerPositions[playerId] ?? 0;
  const category = SQUARE_CATEGORIES[position] ?? 'improbable';
  const { question } = await drawQuestion(playerId, category);

  const newTurn: GameTurn = {
    playerId,
    question,
    selectedDifficulty: 0,
    givenAnswer: null,
    isCorrect: false,
    timeSpent: 0,
    startedAt: new Date(),
    completedAt: null,
  };

  // Fix bug #1 : buffer +600ms pour absorber la latence polling côté client.
  // Pour selecting_difficulty, pas besoin de buffer (pas de countdown).
  // Pour reading_question direct (questions non-standard), on ajoute le buffer.
  const isDirectReading = question.kind !== 'standard';
  const updated: GameState = {
    ...state,
    currentPhase: isDirectReading ? 'reading_question' : 'selecting_difficulty',
    currentTurn: newTurn,
    phaseStartedAt: new Date(Date.now() + (isDirectReading ? 600 : 0)),
    phaseTransitionAt: null,
    usedQuestionIds: [...state.usedQuestionIds, question.id],
  };
  await updateRoomGameState(roomId, updated);
}

/** Passe à `reading_question` après avoir choisi une difficulté. */
export async function selectDifficulty(
  roomId: string,
  playerId: string,
  difficulty: number,
): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state || !state.currentTurn) throw new GameError('Aucun tour en cours');
  if (state.currentPlayerId !== playerId) throw new GameError('Ce n\'est pas votre tour');
  if (state.currentPhase !== 'selecting_difficulty') throw new GameError('Phase incorrecte');
  if (state.currentTurn.question.kind !== 'standard') {
    throw new GameError('Pas de difficulté pour ce type de question');
  }
  const available = Object.keys(state.currentTurn.question.questions)
    .map((k) => Number(k))
    .filter((d) => !Number.isNaN(d));
  if (!available.includes(difficulty)) {
    throw new GameError('Difficulté non disponible');
  }
  const updatedTurn: GameTurn = {
    ...state.currentTurn,
    selectedDifficulty: difficulty,
    startedAt: new Date(),
  };
  // Fix bug #1 : buffer +600ms sur phaseStartedAt pour absorber la latence polling
  // (jusqu'à 1s) côté client. Tous les joueurs voient alors un countdown complet
  // même si leur premier fetch arrive jusqu'à 600ms après le POST serveur.
  const updated: GameState = {
    ...state,
    currentPhase: 'reading_question',
    currentTurn: updatedTurn,
    phaseStartedAt: new Date(Date.now() + 600),
  };
  await updateRoomGameState(roomId, updated);
}

/**
 * Transition reading_question → answering après le countdown de 5s.
 *
 * Fix bug #1 :
 *  - `phaseStartedAt` est posé avec un buffer +600ms dans `selectDifficulty`, donc
 *    `elapsed` peut être négatif pendant le buffer (tout le monde attend).
 *  - Le guard refuse strictement tout appel qui arrive avant `readCountdownSeconds * 1000
 *    - 300ms` pour tolérer les clock skews mineurs, en levant une GameError 409 (au lieu
 *    du return silencieux de la v1 qui masquait les bugs côté client).
 */
export async function revealAnswer(roomId: string, playerId: string): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state) return;
  if (state.currentPlayerId !== playerId) return;
  if (state.currentPhase !== 'reading_question') return;
  if (state.phaseStartedAt) {
    const elapsed = Date.now() - state.phaseStartedAt.getTime();
    const minElapsed = GAME_CONSTANTS.readCountdownSeconds * 1000 - 300;
    if (elapsed < minElapsed) {
      throw new GameError('Countdown non écoulé', 409);
    }
  }
  const updated: GameState = {
    ...state,
    currentPhase: 'answering',
    phaseStartedAt: new Date(),
  };
  await updateRoomGameState(roomId, updated);
}

/** Soumet une réponse OUI/NON (système d'honneur). */
export async function submitAnswer(
  roomId: string,
  playerId: string,
  isCorrect: boolean,
): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state || !state.currentTurn) throw new GameError('Aucun tour en cours');
  if (state.currentPlayerId !== playerId) throw new GameError('Ce n\'est pas votre tour');
  if (
    state.currentPhase !== 'answering' &&
    state.currentPhase !== 'reading_question'
  ) {
    throw new GameError('Phase incorrecte');
  }
  const turn = state.currentTurn;
  const spaces = turn.question.kind === 'standard' ? turn.selectedDifficulty : 0;

  const updatedTurn: GameTurn = {
    ...turn,
    givenAnswer: isCorrect ? '✓' : '✗',
    isCorrect,
    completedAt: new Date(),
    timeSpent: turn.startedAt
      ? Math.max(0, Math.round((Date.now() - turn.startedAt.getTime()) / 1000))
      : 0,
  };

  let updated: GameState = {
    ...state,
    currentTurn: updatedTurn,
    currentPhase: 'revealing_answer',
  };

  if (isCorrect && spaces > 0) {
    updated = movePlayer(updated, playerId, spaces);
    if (hasPlayerReachedEnd(updated, playerId)) {
      if (!updated.isFinalQuestion) {
        updated = { ...updated, isFinalQuestion: true };
      } else {
        updated = { ...updated, winnerId: playerId };
      }
    }
  }
  updated = { ...updated, turnHistory: [...state.turnHistory, updatedTurn] };

  // Marque la question dans le cache de TOUS les joueurs (si standard)
  if (turn.question.kind === 'standard' && spaces > 0) {
    await Promise.all(
      room.players.map(async (p) => {
        const cache = await getQuestionCache(p.id);
        const updatedCache = markQuestionSeen(cache, turn.question.id, spaces);
        await saveQuestionCache(updatedCache);
      }),
    );
  }

  // Persiste la position et le score dans room_players
  const newPos = updated.playerPositions[playerId] ?? 0;
  const newScore = updated.playerScores[playerId] ?? 0;
  await updatePlayerPositionScore(roomId, playerId, newPos, newScore);

  // Update game state + statut finished si winner
  await updateRoomGameState(
    roomId,
    updated,
    updated.winnerId ? 'finished' : undefined,
  );

  // Stats joueurs en fin de partie
  if (updated.winnerId) {
    await Promise.all(
      room.players.map((p) =>
        incrementPlayerStats(p.id, {
          games: 1,
          wins: p.id === updated.winnerId ? 1 : 0,
        }),
      ),
    );
  }
}

/** Passe au joueur suivant. */
export async function nextTurn(roomId: string, playerId: string): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state) throw new GameError('État manquant');
  // Seul l'hôte peut déclencher le next turn pour éviter les conflits
  if (room.hostId !== playerId && state.currentPlayerId !== playerId) {
    throw new GameError('Non autorisé', 403);
  }
  if (
    state.currentPhase !== 'revealing_answer' &&
    state.currentPhase !== 'turn_complete'
  ) {
    return;
  }
  const order = room.players.map((p) => p.id);
  const updated: GameState = nextPlayer(
    { ...state, currentRound: state.currentRound + 1 },
    order,
  );
  await updateRoomGameState(roomId, updated);
}
