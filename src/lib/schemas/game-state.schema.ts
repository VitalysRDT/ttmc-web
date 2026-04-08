import { z } from 'zod';
import { TurnPhaseEnum } from './enums';
import { QuestionSchema } from './question.schema';

export const GameTurnSchema = z.object({
  playerId: z.string(),
  question: QuestionSchema,
  /** Difficulté sélectionnée (1-10) pour les questions standard. 0 pour les autres types. */
  selectedDifficulty: z.number().int().min(0).max(10),
  givenAnswer: z.string().nullable().optional(),
  isCorrect: z.boolean().default(false),
  /** Temps passé en secondes. */
  timeSpent: z.number().int().default(0),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});
export type GameTurn = z.infer<typeof GameTurnSchema>;

export const GameStateSchema = z.object({
  currentPlayerId: z.string(),
  currentRound: z.number().int().min(0),
  currentPhase: TurnPhaseEnum,
  turnHistory: z.array(GameTurnSchema).default([]),
  currentTurn: GameTurnSchema.nullable().default(null),
  usedQuestionIds: z.array(z.string()).default([]),
  playerScores: z.record(z.string(), z.number()).default({}),
  playerPositions: z.record(z.string(), z.number().int().min(0).max(51)).default({}),
  winnerId: z.string().nullable().default(null),
  isFinalQuestion: z.boolean().default(false),
  phaseStartedAt: z.coerce.date().nullable().default(null),
  /** Timestamp serveur de la transition planifiée (utilisé pour la phase Débuter, fix bug #3). */
  phaseTransitionAt: z.coerce.date().nullable().default(null),
  remainingTime: z.number().int().default(0),
  debuterAnswers: z.record(z.string(), z.string()).default({}),
  firstCorrectDebuterId: z.string().nullable().default(null),
});
export type GameState = z.infer<typeof GameStateSchema>;
