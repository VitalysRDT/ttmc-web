import { describe, it, expect } from 'vitest';
import type { GameState } from '@/lib/schemas/game-state.schema';
import {
  movePlayer,
  nextPlayer,
  getPlayerPosition,
  getPlayerScore,
  hasPlayerReachedEnd,
  isGameOver,
} from './game-logic';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    currentPlayerId: 'p1',
    currentRound: 0,
    currentPhase: 'waiting_to_start',
    turnHistory: [],
    currentTurn: null,
    usedQuestionIds: [],
    playerScores: {},
    playerPositions: {},
    winnerId: null,
    isFinalQuestion: false,
    phaseStartedAt: null,
    phaseTransitionAt: null,
    remainingTime: 0,
    debuterAnswers: {},
    firstCorrectDebuterId: null,
    ...overrides,
  };
}

describe('game-logic', () => {
  describe('movePlayer', () => {
    it('avance un joueur du nombre de cases demandé', () => {
      const state = makeState({ playerPositions: { p1: 10 }, playerScores: { p1: 10 } });
      const next = movePlayer(state, 'p1', 5);
      expect(getPlayerPosition(next, 'p1')).toBe(15);
      expect(getPlayerScore(next, 'p1')).toBe(15);
    });

    it('initialise la position à 0 si le joueur est nouveau', () => {
      const state = makeState();
      const next = movePlayer(state, 'p1', 3);
      expect(getPlayerPosition(next, 'p1')).toBe(3);
      expect(getPlayerScore(next, 'p1')).toBe(3);
    });

    it('clampe à 51 et ne dépasse pas', () => {
      const state = makeState({ playerPositions: { p1: 49 } });
      const next = movePlayer(state, 'p1', 10);
      expect(getPlayerPosition(next, 'p1')).toBe(51);
    });

    it('ne descend pas en dessous de 0', () => {
      const state = makeState({ playerPositions: { p1: 2 } });
      const next = movePlayer(state, 'p1', -10);
      expect(getPlayerPosition(next, 'p1')).toBe(0);
    });
  });

  describe('nextPlayer', () => {
    it('passe au joueur suivant dans l\'ordre', () => {
      const state = makeState({ currentPlayerId: 'p1' });
      const next = nextPlayer(state, ['p1', 'p2']);
      expect(next.currentPlayerId).toBe('p2');
      expect(next.currentPhase).toBe('waiting_to_start');
      expect(next.currentTurn).toBeNull();
    });

    it('boucle au premier joueur après le dernier', () => {
      const state = makeState({ currentPlayerId: 'p2' });
      const next = nextPlayer(state, ['p1', 'p2']);
      expect(next.currentPlayerId).toBe('p1');
    });

    it('ne plante pas avec une liste vide', () => {
      const state = makeState();
      const next = nextPlayer(state, []);
      expect(next).toEqual(state);
    });
  });

  describe('hasPlayerReachedEnd', () => {
    it('retourne true à la case 50', () => {
      const state = makeState({ playerPositions: { p1: 50 } });
      expect(hasPlayerReachedEnd(state, 'p1')).toBe(true);
    });

    it('retourne false avant la case 50', () => {
      const state = makeState({ playerPositions: { p1: 49 } });
      expect(hasPlayerReachedEnd(state, 'p1')).toBe(false);
    });
  });

  describe('isGameOver', () => {
    it('retourne false sans gagnant', () => {
      expect(isGameOver(makeState())).toBe(false);
    });
    it('retourne true avec un winnerId', () => {
      expect(isGameOver(makeState({ winnerId: 'p1' }))).toBe(true);
    });
  });
});
