import { z } from 'zod';

/** Catégories de questions. */
export const QuestionCategoryEnum = z.enum([
  'debuter',
  'improbable',
  'plaisir',
  'mature',
  'scolaire',
  'intrepide',
  'final',
  'bonus',
  'malus',
  'challenge',
]);
export type QuestionCategory = z.infer<typeof QuestionCategoryEnum>;

/** Phases d'un tour de jeu. */
export const TurnPhaseEnum = z.enum([
  'debuter_question',
  'waiting_to_start',
  'selecting_difficulty',
  'reading_question',
  'answering',
  'revealing_answer',
  'turn_complete',
]);
export type TurnPhase = z.infer<typeof TurnPhaseEnum>;

/** Statut d'une salle. */
export const GameStatusEnum = z.enum([
  'waiting',
  'ready',
  'playing',
  'paused',
  'finished',
]);
export type GameStatus = z.infer<typeof GameStatusEnum>;

/** Modes de jeu. */
export const GameModeEnum = z.enum(['individual', 'team']);
export type GameMode = z.infer<typeof GameModeEnum>;

/** Providers d'auth. */
export const AuthProviderEnum = z.enum(['anonymous', 'email', 'google']);
export type AuthProvider = z.infer<typeof AuthProviderEnum>;

/** Constantes de gameplay. */
export const GAME_CONSTANTS = {
  /** Total de cases sur le plateau (0 à 50 inclus). */
  totalSquares: 51,
  /** Position qui déclenche la victoire. */
  winningPosition: 50,
  /** Difficulté minimale pour une question standard. */
  minDifficulty: 1,
  /** Difficulté maximale pour une question standard. */
  maxDifficulty: 10,
  /** Durée par défaut d'une question en secondes. */
  defaultTimeLimit: 30,
  /** Durée du countdown avant affichage de la réponse (en secondes). */
  readCountdownSeconds: 5,
  /** Durée d'attente entre une réponse Débuter correcte et la transition de phase. */
  debuterTransitionDelayMs: 3000,
} as const;
