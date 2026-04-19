import { z } from 'zod';
import { TurnPhaseEnum, QuestionCategoryEnum } from './enums';
import { QuestionSchema } from './question.schema';

/**
 * État d'un modifier Intrépide en cours (NIB ou AMBITION).
 *
 * Posé quand le joueur valide la carte modifier, persiste jusqu'à la fin du
 * mini-tour (réponse + avancée/recul). Permet au client de savoir quelles
 * catégories proposer, et au serveur d'appliquer le scoring spécial :
 *  - NIB raté     → `winnerId` attribué au joueur le plus avancé restant.
 *  - AMBITION raté → recul de `selectedDifficulty` cases.
 */
export const PendingModifierSchema = z.object({
  kind: z.enum(['nib', 'ambition']),
  /** Catégorie choisie par le joueur actif (null tant que non choisie). */
  category: QuestionCategoryEnum.nullable().default(null),
  /** Min autorisé (1 pour NIB, 4 pour AMBITION). */
  minDifficulty: z.number().int().min(1).max(10),
  /** Max autorisé (1 pour NIB, 10 pour AMBITION). */
  maxDifficulty: z.number().int().min(1).max(10),
});
export type PendingModifier = z.infer<typeof PendingModifierSchema>;

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
  /**
   * Pour les cartes Intrépide uniquement : map lettre → bonne réponse (true) ou ratée (false).
   * Permet de calculer `spaces = correctCount` côté serveur et d'afficher le récap au révélé.
   */
  subItemAnswers: z.record(z.string(), z.boolean()).optional(),
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
  /**
   * Modifier Intrépide en cours. Null quand aucun modifier n'est actif.
   * Set par `submitAnswer` sur une carte `intrepide.variant === 'modifier'`.
   * Reset par `submitAnswer` à la fin du mini-tour.
   */
  pendingModifier: PendingModifierSchema.nullable().default(null),
});
export type GameState = z.infer<typeof GameStateSchema>;
