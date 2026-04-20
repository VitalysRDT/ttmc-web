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

/**
 * Tire une question aléatoire pour la catégorie.
 *
 * Exclusions appliquées :
 * - `usedQuestionIds` (cartes déjà tirées dans la partie courante) : évite
 *   qu'une même carte Intrépide/Final/Débuter revienne deux fois dans une
 *   partie. Essentiel pour Intrépide (seulement 8 cartes).
 * - Cache joueur (pour standard) : évite qu'un joueur retombe sur la même
 *   question à la même difficulté d'une partie à l'autre.
 *
 * Si la pool devient vide après filtrage, fallback sur la liste complète
 * pour ne pas crasher en fin de paquet.
 */
async function drawQuestion(
  playerId: string,
  category: QuestionCategory,
  usedQuestionIds: readonly string[] = [],
): Promise<{ question: Question; difficulty: number }> {
  const allQuestions = await getQuestionsByCategory(category);
  if (allQuestions.length === 0) {
    throw new GameError(`Aucune question disponible pour ${category}`, 500);
  }
  const used = new Set(usedQuestionIds);

  if (category === 'debuter' || category === 'final' || category === 'intrepide') {
    const unused = allQuestions.filter((q) => !used.has(q.id));
    const pool = unused.length > 0 ? unused : allQuestions;
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    return { question: pick, difficulty: 0 };
  }

  const cache = await getQuestionCache(playerId);
  const standardQuestions = allQuestions.filter(
    (q): q is StandardQuestion => q.kind === 'standard',
  );
  const unusedThisGame = standardQuestions.filter((q) => !used.has(q.id));
  const available = unusedThisGame.filter((q) => !isQuestionExhausted(cache, q.id));
  const pool =
    available.length > 0
      ? available
      : unusedThisGame.length > 0
        ? unusedThisGame
        : standardQuestions;
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

  const debuterDraw = await drawQuestion(hostId, 'debuter', []);
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
    pendingModifier: null,
    currentTurnSkipCount: 0,
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

/**
 * Phase `modifier_category_select` : le joueur actif choisit la catégorie
 * imposée par la carte Intrépide modifier. NIB autorise les 4 catégories
 * standard ; AMBITION impose mature/improbable.
 *
 * Tire une question standard dans la catégorie choisie puis :
 *  - NIB     : pré-sélectionne difficulté 1, passe en reading_question.
 *  - AMBITION : passe en selecting_difficulty avec bornes 4-10.
 */
export async function selectModifierCategory(
  roomId: string,
  playerId: string,
  category: QuestionCategory,
): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state) throw new GameError('État manquant');
  if (state.currentPlayerId !== playerId) throw new GameError('Ce n\'est pas votre tour');
  if (state.currentPhase !== 'modifier_category_select') {
    throw new GameError('Phase incorrecte');
  }
  const pending = state.pendingModifier;
  if (!pending) throw new GameError('Aucun modifier en cours');

  const allowedForNib: QuestionCategory[] = [
    'improbable',
    'mature',
    'plaisir',
    'scolaire',
  ];
  const allowedForAmbition: QuestionCategory[] = ['mature', 'improbable'];
  const allowed = pending.kind === 'nib' ? allowedForNib : allowedForAmbition;
  if (!allowed.includes(category)) {
    throw new GameError('Catégorie non autorisée par la règle en cours', 400);
  }

  const { question } = await drawQuestion(playerId, category, state.usedQuestionIds);
  if (question.kind !== 'standard') {
    throw new GameError('Question tirée non-standard inattendue', 500);
  }

  const selectedDifficulty = pending.kind === 'nib' ? 1 : 0;
  const newTurn: GameTurn = {
    playerId,
    question,
    selectedDifficulty,
    givenAnswer: null,
    isCorrect: false,
    timeSpent: 0,
    startedAt: new Date(),
    completedAt: null,
  };

  const updated: GameState = {
    ...state,
    currentTurn: newTurn,
    currentPhase: pending.kind === 'nib' ? 'reading_question' : 'selecting_difficulty',
    phaseStartedAt: new Date(),
    phaseTransitionAt: null,
    usedQuestionIds: [...state.usedQuestionIds, question.id],
    pendingModifier: {
      ...pending,
      category,
    },
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
  const { question } = await drawQuestion(playerId, category, state.usedQuestionIds);

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

  const updated: GameState = {
    ...state,
    currentPhase: question.kind === 'standard' ? 'selecting_difficulty' : 'reading_question',
    currentTurn: newTurn,
    phaseStartedAt: new Date(),
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
  // Si un modifier Intrépide est actif (AMBITION), la difficulté doit
  // respecter ses bornes. Enforcement serveur contre les clients malveillants.
  if (state.pendingModifier) {
    const { minDifficulty, maxDifficulty } = state.pendingModifier;
    if (difficulty < minDifficulty || difficulty > maxDifficulty) {
      throw new GameError(
        `Difficulté hors bornes (${minDifficulty}-${maxDifficulty}) imposée par la carte.`,
        400,
      );
    }
  }
  const updatedTurn: GameTurn = {
    ...state.currentTurn,
    selectedDifficulty: difficulty,
    startedAt: new Date(),
  };
  const updated: GameState = {
    ...state,
    currentPhase: 'reading_question',
    currentTurn: updatedTurn,
    phaseStartedAt: new Date(),
  };
  await updateRoomGameState(roomId, updated);
}

/**
 * Transition reading_question → answering.
 *
 * Déclenchée manuellement par le joueur actif quand il clique "Voir la réponse"
 * après avoir lu la question et réfléchi. Pas de timer automatique : le joueur
 * contrôle son rythme (flow TTMC original = "lit la question → réfléchit → dit
 * sa réponse → retourne la carte pour voir la vraie réponse").
 */
export async function revealAnswer(roomId: string, playerId: string): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state) return;
  if (state.currentPlayerId !== playerId) return;
  if (state.currentPhase !== 'reading_question') return;
  const updated: GameState = {
    ...state,
    currentPhase: 'answering',
    phaseStartedAt: new Date(),
  };
  await updateRoomGameState(roomId, updated);
}

/**
 * Retourne le kind de modifier (`nib` | `ambition`) d'après la carte Intrépide
 * courante, ou null si ce n'est pas une carte modifier connue.
 */
function detectModifierKind(turn: GameTurn): 'nib' | 'ambition' | null {
  if (turn.question.kind !== 'intrepide') return null;
  if (turn.question.variant !== 'modifier') return null;
  const t = turn.question.type.toLowerCase();
  if (t === 'nib') return 'nib';
  if (t === 'ambition') return 'ambition';
  return null;
}

/** Soumet une réponse OUI/NON (système d'honneur). */
export async function submitAnswer(
  roomId: string,
  playerId: string,
  payload: { isCorrect: boolean } | { subItemAnswers: Record<string, boolean> },
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

  // Détection d'une carte Intrépide modifier (NIB / AMBITION) qui déclenche
  // un mini-tour contraint au lieu du flow standard.
  const modifierKind = detectModifierKind(turn);
  if (modifierKind && state.pendingModifier === null) {
    // Le joueur valide la carte modifier → on ouvre le picker de catégorie.
    const pending: NonNullable<GameState['pendingModifier']> =
      modifierKind === 'nib'
        ? { kind: 'nib', category: null, minDifficulty: 1, maxDifficulty: 1 }
        : { kind: 'ambition', category: null, minDifficulty: 4, maxDifficulty: 10 };

    const appliedTurn: GameTurn = {
      ...turn,
      givenAnswer: 'Règle appliquée',
      isCorrect: true,
      completedAt: new Date(),
      timeSpent: turn.startedAt
        ? Math.max(0, Math.round((Date.now() - turn.startedAt.getTime()) / 1000))
        : 0,
    };

    const updatedModifier: GameState = {
      ...state,
      currentTurn: null,
      currentPhase: 'modifier_category_select',
      phaseStartedAt: new Date(),
      phaseTransitionAt: null,
      pendingModifier: pending,
      turnHistory: [...state.turnHistory, appliedTurn],
    };
    await updateRoomGameState(roomId, updatedModifier);
    return;
  }

  // Calcul du scoring selon le type de carte
  let spaces: number;
  let isCorrect: boolean;
  let givenAnswer: string;
  let subItemAnswers: Record<string, boolean> | undefined;

  if (turn.question.kind === 'intrepide') {
    if (!('subItemAnswers' in payload)) {
      throw new GameError('Réponses par lettre manquantes pour une carte Intrépide', 400);
    }
    subItemAnswers = payload.subItemAnswers;
    const total = Object.keys(subItemAnswers).length;
    const values = Object.values(subItemAnswers);
    const correctCount = values.filter(Boolean).length;
    const wrongCount = total - correctCount;
    // Scoring Intrépide quiz : net = bonnes − mauvaises. Plusieurs cartes
    // spécifient « +1 par bonne / −1 par mauvaise » (ex. 73 BIENVENUE
    // MESSAGERIE) ; on applique ça uniformément. movePlayer clampe à 0 donc
    // un joueur à la case 0 ne peut pas descendre plus bas mais les autres
    // reculent bien du solde négatif. Les variants modifier/action n'ont pas
    // de sous-items (total = 0) → spaces = 0 conservé.
    spaces = correctCount - wrongCount;
    isCorrect = correctCount > 0;
    givenAnswer = `${correctCount}/${total}`;
  } else {
    if (!('isCorrect' in payload)) {
      throw new GameError('Réponse isCorrect manquante', 400);
    }
    isCorrect = payload.isCorrect;
    spaces = turn.question.kind === 'standard' ? turn.selectedDifficulty : 0;
    givenAnswer = isCorrect ? '✓' : '✗';
  }

  const updatedTurn: GameTurn = {
    ...turn,
    givenAnswer,
    isCorrect,
    subItemAnswers,
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

  // Question finale : le joueur est sur la case 50 et tente la victoire.
  // - Trouvé   → winnerId = playerId, partie terminée.
  // - Raté     → reste sur la case 50, aucune pénalité. Il retentera une
  //              question finale à son prochain tour (tour par tour).
  if (turn.question.kind === 'final') {
    if (isCorrect) {
      updated = { ...updated, winnerId: playerId, isFinalQuestion: true };
    }
    // Raté : rien à faire, pas de mouvement, pas de recul.
  } else if (state.pendingModifier) {
    // Scoring spécial : question tirée via un modifier (NIB / AMBITION).
    // - AMBITION raté : recule de `selectedDifficulty` cases.
    // - NIB raté     : le joueur perd la partie → winnerId attribué au joueur
    //                 le plus avancé restant (ordre initial à égalité).
    // Bonne réponse : comportement standard (+N cases, clampé à la case 50).
    const pending = state.pendingModifier;
    if (!isCorrect && turn.question.kind === 'standard') {
      if (pending.kind === 'ambition') {
        updated = movePlayer(updated, playerId, -turn.selectedDifficulty);
      } else {
        // NIB : « tu perds la partie »
        const candidates = room.players.filter((p) => p.id !== playerId);
        const byPos = [...candidates].sort((a, b) => {
          const pa = updated.playerPositions[a.id] ?? 0;
          const pb = updated.playerPositions[b.id] ?? 0;
          if (pa !== pb) return pb - pa;
          return room.players.indexOf(a) - room.players.indexOf(b);
        });
        const fallbackWinner = byPos[0]?.id ?? null;
        if (fallbackWinner) {
          updated = { ...updated, winnerId: fallbackWinner, isFinalQuestion: true };
        }
      }
    } else if (isCorrect && spaces > 0) {
      updated = movePlayer(updated, playerId, spaces);
    }
    // pendingModifier reste set durant revealing_answer pour que l'UI
    // affiche « -N CASES (recul) » ou « 💀 » selon le kind. Il sera nettoyé
    // par `nextTurn`.
  } else if (isCorrect && spaces > 0) {
    // Flow standard : avance du nombre de cases mérité. Si on atteint ou
    // dépasse la case 50, movePlayer clampe à 50 — le joueur jouera une
    // question finale à son prochain tour.
    updated = movePlayer(updated, playerId, spaces);
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

/**
 * Re-tire une nouvelle carte pour le joueur courant pendant `reading_question`.
 *
 * Cas d'usage : certaines cartes Intrépide ne sont pas réalisables dans un
 * contexte donné (référence trop pointue, sous-question impossible à évaluer,
 * etc.). Le joueur actif peut alors demander un nouveau tirage de la même
 * catégorie. Fonctionne aussi pour les cartes Final/Debuter. Pour une
 * Standard, on remet la phase à `selecting_difficulty` puisque la difficulté
 * n'est pas encore validée.
 */
export async function skipCurrentCard(roomId: string, playerId: string): Promise<void> {
  const room = await loadRoomOrThrow(roomId);
  const state = room.gameState;
  if (!state || !state.currentTurn) throw new GameError('Aucun tour en cours');
  if (state.currentPlayerId !== playerId) throw new GameError('Ce n\'est pas votre tour');
  if (
    state.currentPhase !== 'reading_question' &&
    state.currentPhase !== 'selecting_difficulty'
  ) {
    throw new GameError('Changement de carte non autorisé à cette phase', 400);
  }
  if ((state.currentTurnSkipCount ?? 0) >= 1) {
    throw new GameError(
      'Tu as déjà changé de carte ce tour. Joue celle-ci.',
      400,
    );
  }
  const position = state.playerPositions[playerId] ?? 0;
  const category = SQUARE_CATEGORIES[position] ?? 'improbable';

  // Exclure la carte actuelle + toutes celles déjà vues dans la partie.
  const excludedIds = Array.from(
    new Set([...state.usedQuestionIds, state.currentTurn.question.id]),
  );
  const replacement = await drawQuestion(playerId, category, excludedIds);

  const newTurn: GameTurn = {
    playerId,
    question: replacement.question,
    selectedDifficulty: 0,
    givenAnswer: null,
    isCorrect: false,
    timeSpent: 0,
    startedAt: new Date(),
    completedAt: null,
  };

  const nextPhase = replacement.question.kind === 'standard'
    ? 'selecting_difficulty'
    : 'reading_question';

  const updated: GameState = {
    ...state,
    currentPhase: nextPhase,
    currentTurn: newTurn,
    phaseStartedAt: new Date(),
    phaseTransitionAt: null,
    usedQuestionIds: [...state.usedQuestionIds, replacement.question.id],
    currentTurnSkipCount: (state.currentTurnSkipCount ?? 0) + 1,
  };
  await updateRoomGameState(roomId, updated);
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
    {
      ...state,
      currentRound: state.currentRound + 1,
      pendingModifier: null,
      currentTurnSkipCount: 0,
    },
    order,
  );
  await updateRoomGameState(roomId, updated);
}
