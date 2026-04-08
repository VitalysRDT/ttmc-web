import { z } from 'zod';
import { type QuestionCategory, GAME_CONSTANTS } from './enums';

/**
 * Question standard avec 10 niveaux de difficulté (improbable, mature, plaisir, scolaire).
 * Les clés des maps `questions` et `answers` sont les difficultés 1-10 stockées comme strings
 * (obligatoire pour Firestore qui n'accepte pas de clés numériques).
 */
export const StandardQuestionSchema = z.object({
  kind: z.literal('standard'),
  id: z.string(),
  category: z.enum(['improbable', 'mature', 'plaisir', 'scolaire']),
  theme: z.string(),
  questions: z.record(z.string(), z.string()),
  answers: z.record(z.string(), z.string()),
  alternateAnswers: z.record(z.string(), z.array(z.string())).optional(),
  answerRanges: z
    .record(
      z.string(),
      z.object({
        min: z.number(),
        max: z.number(),
        unit: z.string().optional(),
      }),
    )
    .optional(),
  hints: z.record(z.string(), z.string()).optional(),
  timeLimit: z.number().int().positive().default(GAME_CONSTANTS.defaultTimeLimit),
  sourceHash: z.string().optional(),
});
export type StandardQuestion = z.infer<typeof StandardQuestionSchema>;

/** Question Débuter (1 seul niveau), utilisée pour déterminer qui commence. */
export const DebuterQuestionSchema = z.object({
  kind: z.literal('debuter'),
  id: z.string(),
  category: z.literal('debuter'),
  numero: z.number().int().positive(),
  textePrincipal: z.string(),
  texteSecondaire: z.string(),
  timeLimit: z.number().int().positive().default(GAME_CONSTANTS.defaultTimeLimit),
  sourceHash: z.string().optional(),
});
export type DebuterQuestion = z.infer<typeof DebuterQuestionSchema>;

/** Question Finale (QCM avec options et explication). */
export const FinalQuestionSchema = z.object({
  kind: z.literal('final'),
  id: z.string(),
  category: z.literal('final'),
  theme: z.string(),
  question: z.string(),
  options: z.array(z.string()).optional(),
  reponse: z.string(),
  explication: z.string().optional(),
  timeLimit: z.number().int().positive().default(GAME_CONSTANTS.defaultTimeLimit),
  sourceHash: z.string().optional(),
});
export type FinalQuestion = z.infer<typeof FinalQuestionSchema>;

/** Sous-question d'une carte Intrépide (lettre → question/réponse). */
export const IntrepideSubQuestionSchema = z.object({
  letter: z.string(),
  question: z.string(),
  answer: z.string(),
});
export type IntrepideSubQuestion = z.infer<typeof IntrepideSubQuestionSchema>;

/** Question Intrépide (nombre variable de sous-questions indexées par lettre). */
export const IntrepideQuestionSchema = z.object({
  kind: z.literal('intrepide'),
  id: z.string(),
  category: z.literal('intrepide'),
  theme: z.string(),
  type: z.string(),
  instruction: z.string().optional(),
  subQuestions: z.array(IntrepideSubQuestionSchema),
  timeLimit: z.number().int().positive().default(GAME_CONSTANTS.defaultTimeLimit),
  sourceHash: z.string().optional(),
});
export type IntrepideQuestion = z.infer<typeof IntrepideQuestionSchema>;

/** Union discriminée de tous les types de questions. */
export const QuestionSchema = z.discriminatedUnion('kind', [
  StandardQuestionSchema,
  DebuterQuestionSchema,
  FinalQuestionSchema,
  IntrepideQuestionSchema,
]);
export type Question = z.infer<typeof QuestionSchema>;

export const QUESTION_KIND_BY_CATEGORY: Record<QuestionCategory, Question['kind']> = {
  debuter: 'debuter',
  improbable: 'standard',
  plaisir: 'standard',
  mature: 'standard',
  scolaire: 'standard',
  intrepide: 'intrepide',
  final: 'final',
  bonus: 'standard',
  malus: 'standard',
  challenge: 'standard',
};
