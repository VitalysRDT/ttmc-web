import { z } from 'zod';

/**
 * Cache des questions vues par un joueur.
 * `seenQuestions[questionId]` contient la liste des difficultés déjà jouées pour cette question.
 *
 * IMPORTANT (fix bug #2) : la plage de difficultés est bien 1-10 (pas 1-3 comme dans le code Dart
 * cassé). Une question n'est éliminée du pool que lorsque toutes ses difficultés disponibles ont
 * été vues (voir `question-cache.ts`).
 */
export const QuestionCacheSchema = z.object({
  playerId: z.string(),
  seenQuestions: z.record(z.string(), z.array(z.number().int().min(1).max(10))).default({}),
  lastUpdated: z.coerce.date().nullable().optional(),
});
export type QuestionCache = z.infer<typeof QuestionCacheSchema>;
