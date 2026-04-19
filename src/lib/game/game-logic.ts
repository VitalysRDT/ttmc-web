import type { GameState } from '@/lib/schemas/game-state.schema';
import type { Player } from '@/lib/schemas/player.schema';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

/** Retourne le score d'un joueur (0 s'il n'a pas encore de score). */
export function getPlayerScore(state: GameState, playerId: string): number {
  return state.playerScores[playerId] ?? 0;
}

/** Retourne la position d'un joueur sur le plateau (0 par défaut). */
export function getPlayerPosition(state: GameState, playerId: string): number {
  return state.playerPositions[playerId] ?? 0;
}

/** Un joueur a-t-il atteint la case finale ? */
export function hasPlayerReachedEnd(state: GameState, playerId: string): boolean {
  return getPlayerPosition(state, playerId) >= GAME_CONSTANTS.winningPosition;
}

/** La partie est-elle terminée ? */
export function isGameOver(state: GameState): boolean {
  return state.winnerId !== null;
}

/**
 * Déplace un joueur de `spaces` cases. Clampe entre 0 et la case finale
 * (`winningPosition = 50`). Si le mouvement dépasse la fin, le joueur reste
 * sur la case 50 et doit répondre à une question finale pour gagner. Le
 * score cumule la valeur brute de la question (pas clampée) pour refléter
 * la difficulté totale résolue sur la partie.
 */
export function movePlayer(state: GameState, playerId: string, spaces: number): GameState {
  const currentPosition = getPlayerPosition(state, playerId);
  const newPosition = Math.max(
    0,
    Math.min(GAME_CONSTANTS.winningPosition, currentPosition + spaces),
  );
  const currentScore = getPlayerScore(state, playerId);
  return {
    ...state,
    playerPositions: { ...state.playerPositions, [playerId]: newPosition },
    playerScores: { ...state.playerScores, [playerId]: currentScore + spaces },
  };
}

/**
 * Passe au joueur suivant dans l'ordre de jeu. Reset la phase à `waiting_to_start`
 * et efface le tour courant.
 */
export function nextPlayer(state: GameState, playerOrder: string[]): GameState {
  if (playerOrder.length === 0) return state;
  const currentIndex = playerOrder.indexOf(state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % playerOrder.length;
  const nextPlayerId = playerOrder[nextIndex] ?? playerOrder[0]!;
  return {
    ...state,
    currentPlayerId: nextPlayerId,
    currentPhase: 'waiting_to_start',
    currentTurn: null,
    phaseStartedAt: new Date(),
    phaseTransitionAt: null,
  };
}

/** Peut-on démarrer la partie ? (assez de joueurs, tous prêts, statut waiting). */
export function canStartGame(room: {
  players: Player[];
  minPlayers: number;
  status: string;
}): boolean {
  return (
    room.players.length >= room.minPlayers &&
    room.status === 'waiting' &&
    room.players.every((p) => p.isReady)
  );
}

/** Un joueur est-il l'hôte de la salle ? */
export function isHost(room: { hostId: string }, playerId: string): boolean {
  return room.hostId === playerId;
}
