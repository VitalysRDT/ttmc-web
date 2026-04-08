import { describe, it, expect } from 'vitest';
import type { QuestionCache } from '@/lib/schemas/question-cache.schema';
import type { Question } from '@/lib/schemas/question.schema';
import {
  ALL_DIFFICULTIES,
  getAvailableDifficulties,
  isQuestionExhausted,
  markQuestionSeen,
  filterAvailableQuestions,
  pickAvailableDifficulty,
} from './question-cache';

function makeCache(seenQuestions: Record<string, number[]> = {}): QuestionCache {
  return { playerId: 'p1', seenQuestions, lastUpdated: null };
}

function makeStandardQuestion(id: string): Question {
  return {
    kind: 'standard',
    id,
    category: 'improbable',
    theme: 'Test',
    questions: { '1': 'q1', '5': 'q5', '10': 'q10' },
    answers: { '1': 'a1', '5': 'a5', '10': 'a10' },
    timeLimit: 30,
  };
}

describe('question-cache', () => {
  describe('ALL_DIFFICULTIES', () => {
    it('contient bien 1 à 10 (fix bug #2 : pas 1-3)', () => {
      expect(ALL_DIFFICULTIES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('getAvailableDifficulties', () => {
    it('retourne toutes les difficultés si rien n\'est vu', () => {
      const cache = makeCache();
      expect(getAvailableDifficulties(cache, 'q1')).toEqual(ALL_DIFFICULTIES);
    });

    it('exclut les difficultés déjà vues', () => {
      const cache = makeCache({ q1: [3, 7] });
      expect(getAvailableDifficulties(cache, 'q1')).toEqual([1, 2, 4, 5, 6, 8, 9, 10]);
    });
  });

  describe('isQuestionExhausted — REGRESSION bug #2', () => {
    it('ne considère PAS la question épuisée après 1 difficulté vue', () => {
      const cache = makeCache({ q1: [5] });
      expect(isQuestionExhausted(cache, 'q1')).toBe(false);
    });

    it('ne considère PAS la question épuisée après 9 difficultés vues', () => {
      const cache = makeCache({ q1: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
      expect(isQuestionExhausted(cache, 'q1')).toBe(false);
    });

    it('considère la question épuisée quand toutes les 10 difficultés sont vues', () => {
      const cache = makeCache({ q1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
      expect(isQuestionExhausted(cache, 'q1')).toBe(true);
    });
  });

  describe('markQuestionSeen', () => {
    it('ajoute une nouvelle difficulté', () => {
      const cache = makeCache();
      const next = markQuestionSeen(cache, 'q1', 5);
      expect(next.seenQuestions['q1']).toEqual([5]);
    });

    it('ne duplique pas une difficulté déjà vue', () => {
      const cache = makeCache({ q1: [5] });
      const next = markQuestionSeen(cache, 'q1', 5);
      expect(next.seenQuestions['q1']).toEqual([5]);
    });

    it('conserve les autres difficultés en ajoutant', () => {
      const cache = makeCache({ q1: [5] });
      const next = markQuestionSeen(cache, 'q1', 7);
      expect(next.seenQuestions['q1']).toEqual([5, 7]);
    });
  });

  describe('filterAvailableQuestions', () => {
    it('garde une question standard partiellement vue', () => {
      const cache = makeCache({ q1: [5] });
      const questions = [makeStandardQuestion('q1'), makeStandardQuestion('q2')];
      const filtered = filterAvailableQuestions(cache, questions);
      expect(filtered).toHaveLength(2);
    });

    it('filtre une question standard totalement vue', () => {
      const cache = makeCache({
        q1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      });
      const questions = [makeStandardQuestion('q1'), makeStandardQuestion('q2')];
      const filtered = filterAvailableQuestions(cache, questions);
      expect(filtered.map((q) => q.id)).toEqual(['q2']);
    });
  });

  describe('pickAvailableDifficulty', () => {
    it('retourne la difficulté préférée si disponible', () => {
      const cache = makeCache();
      expect(pickAvailableDifficulty(cache, 'q1', 5)).toBe(5);
    });

    it('retourne une difficulté aléatoire si préférée déjà vue', () => {
      const cache = makeCache({ q1: [5] });
      const result = pickAvailableDifficulty(cache, 'q1', 5);
      expect(result).not.toBe(5);
      expect(result).not.toBeNull();
    });

    it('retourne null si tout est vu', () => {
      const cache = makeCache({ q1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
      expect(pickAvailableDifficulty(cache, 'q1')).toBeNull();
    });
  });
});
