import type { QuestionCache } from '@/lib/schemas/question-cache.schema';
import type { Question } from '@/lib/schemas/question.schema';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

/**
 * Liste de toutes les difficultés possibles pour une question standard.
 * Fix bug #2 : le code Dart utilisait [1, 2, 3] au lieu de [1..10] comme prévu par le modèle métier.
 */
export const ALL_DIFFICULTIES: readonly number[] = Array.from(
  { length: GAME_CONSTANTS.maxDifficulty - GAME_CONSTANTS.minDifficulty + 1 },
  (_, i) => GAME_CONSTANTS.minDifficulty + i,
);

/** Difficultés déjà vues pour une question donnée. */
export function getSeenDifficulties(cache: QuestionCache, questionId: string): number[] {
  return cache.seenQuestions[questionId] ?? [];
}

/**
 * Retourne les difficultés encore disponibles (non vues) pour une question standard.
 * Fix bug #2 : base sur la plage 1-10 au lieu de 1-3.
 */
export function getAvailableDifficulties(cache: QuestionCache, questionId: string): number[] {
  const seen = getSeenDifficulties(cache, questionId);
  return ALL_DIFFICULTIES.filter((d) => !seen.includes(d));
}

/** A-t-on vu une question à une difficulté précise ? */
export function hasSeenAtDifficulty(
  cache: QuestionCache,
  questionId: string,
  difficulty: number,
): boolean {
  return getSeenDifficulties(cache, questionId).includes(difficulty);
}

/**
 * Une question standard est épuisée quand toutes ses difficultés ont été jouées.
 * Fix bug #2 : auparavant, une question était marquée "épuisée" dès qu'UNE difficulté était vue,
 * ce qui bloquait les 9 autres difficultés disponibles.
 */
export function isQuestionExhausted(cache: QuestionCache, questionId: string): boolean {
  return getAvailableDifficulties(cache, questionId).length === 0;
}

/**
 * Filtre une liste de questions pour ne garder que celles qui ont encore au moins
 * une difficulté disponible pour ce joueur.
 *
 * Pour les questions non-standard (debuter, final, intrepide), on utilise `usedQuestionIds`
 * du game state côté appelant car ces types n'ont pas de notion de "difficulté".
 */
export function filterAvailableQuestions(
  cache: QuestionCache,
  questions: Question[],
): Question[] {
  return questions.filter((q) => {
    if (q.kind === 'standard') {
      return !isQuestionExhausted(cache, q.id);
    }
    // Pour les autres types : la notion d'épuisement se gère via usedQuestionIds
    // (gestion côté GameState, pas côté cache joueur).
    return true;
  });
}

/**
 * Enregistre qu'un joueur a vu une question à une difficulté donnée.
 * Pour les questions non-standard, ne fait rien (pas de concept de difficulté).
 */
export function markQuestionSeen(
  cache: QuestionCache,
  questionId: string,
  difficulty: number,
): QuestionCache {
  const current = cache.seenQuestions[questionId] ?? [];
  if (current.includes(difficulty)) return cache;
  return {
    ...cache,
    seenQuestions: {
      ...cache.seenQuestions,
      [questionId]: [...current, difficulty],
    },
    lastUpdated: new Date(),
  };
}

/** Reset le cache pour une liste spécifique de questionIds. */
export function resetQuestionsInCache(
  cache: QuestionCache,
  questionIds: string[],
): QuestionCache {
  const next = { ...cache.seenQuestions };
  for (const id of questionIds) {
    delete next[id];
  }
  return { ...cache, seenQuestions: next, lastUpdated: new Date() };
}

/** Reset complet du cache. */
export function resetAllCache(cache: QuestionCache): QuestionCache {
  return { ...cache, seenQuestions: {}, lastUpdated: new Date() };
}

/**
 * Sélectionne une difficulté valide parmi celles encore disponibles pour une question standard.
 * Retourne `null` si aucune n'est disponible.
 */
export function pickAvailableDifficulty(
  cache: QuestionCache,
  questionId: string,
  preferred?: number,
): number | null {
  const available = getAvailableDifficulties(cache, questionId);
  if (available.length === 0) return null;
  if (preferred !== undefined && available.includes(preferred)) return preferred;
  return available[Math.floor(Math.random() * available.length)] ?? null;
}
