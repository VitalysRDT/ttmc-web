import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  varchar,
} from 'drizzle-orm/pg-core';
import type { GameState } from '@/lib/schemas/game-state.schema';
import type { Question } from '@/lib/schemas/question.schema';

/**
 * Table `players`
 *
 * Un joueur est identifié par un UUID généré à la première connexion et stocké
 * dans un cookie HTTP-only signé. Le pseudo peut être modifié.
 */
export const players = pgTable('players', {
  id: text('id').primaryKey(),
  pseudo: text('pseudo').notNull(),
  authProvider: text('auth_provider').notNull().default('anonymous'),
  email: text('email'),
  photoUrl: text('photo_url'),
  totalGames: integer('total_games').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
  totalAnswers: integer('total_answers').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastActivity: timestamp('last_activity', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Table `game_rooms`
 *
 * Une room de jeu. Le `gameState` est stocké en JSONB : c'est l'état complet du
 * jeu (phase, tours, scores, positions, etc.) sérialisé en JSON. Les joueurs et
 * leurs statuts sont stockés séparément dans `room_players` pour faciliter les
 * mises à jour ciblées.
 */
export const gameRooms = pgTable(
  'game_rooms',
  {
    id: text('id').primaryKey(),
    roomCode: varchar('room_code', { length: 4 }).notNull(),
    hostId: text('host_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['waiting', 'ready', 'playing', 'paused', 'finished'],
    })
      .notNull()
      .default('waiting'),
    gameMode: text('game_mode', { enum: ['individual', 'team'] })
      .notNull()
      .default('individual'),
    maxPlayers: integer('max_players').notNull().default(4),
    minPlayers: integer('min_players').notNull().default(2),
    winningScore: integer('winning_score').notNull().default(50),
    useTimer: boolean('use_timer').notNull().default(true),
    defaultTimeLimit: integer('default_time_limit').notNull().default(30),
    settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
    gameState: jsonb('game_state').$type<GameState | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    roomCodeIdx: index('room_code_idx').on(t.roomCode, t.status),
    updatedAtIdx: index('rooms_updated_at_idx').on(t.updatedAt),
  }),
);

/**
 * Table `room_players` (many-to-many avec métadonnées)
 *
 * Lie les joueurs à leurs rooms avec leur état (prêt, score, position, team).
 * Supprimer la ligne = quitter la room.
 */
export const roomPlayers = pgTable(
  'room_players',
  {
    roomId: text('room_id')
      .notNull()
      .references(() => gameRooms.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    pseudo: text('pseudo').notNull(),
    isHost: boolean('is_host').notNull().default(false),
    isReady: boolean('is_ready').notNull().default(false),
    position: integer('position').notNull().default(0),
    score: integer('score').notNull().default(0),
    teamId: text('team_id'),
    correctAnswers: integer('correct_answers').notNull().default(0),
    totalAnswers: integer('total_answers').notNull().default(0),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roomId, t.playerId] }),
    playerRoomIdx: index('room_players_player_idx').on(t.playerId),
  }),
);

/**
 * Table `questions`
 *
 * Stockage des 700+ questions TTMC. Le champ `data` contient la question
 * complète sérialisée (discriminated union standard/debuter/final/intrepide).
 * La validation côté application est faite avec `QuestionSchema`.
 */
export const questions = pgTable(
  'questions',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['standard', 'debuter', 'final', 'intrepide'] }).notNull(),
    category: text('category').notNull(),
    theme: text('theme').notNull(),
    data: jsonb('data').$type<Question>().notNull(),
  },
  (t) => ({
    categoryIdx: index('questions_category_idx').on(t.category),
    kindIdx: index('questions_kind_idx').on(t.kind),
  }),
);

/**
 * Table `question_caches`
 *
 * Cache des questions vues par un joueur, stocké en JSONB:
 * `{ [questionId]: [difficulty1, difficulty2, ...] }`.
 *
 * Fix bug #2 : la logique correcte traite les difficultés 1-10 (vs 1-3 bugué côté Flutter).
 * Voir `src/lib/game/question-cache.ts`.
 */
export const questionCaches = pgTable('question_caches', {
  playerId: text('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  seenQuestions: jsonb('seen_questions')
    .$type<Record<string, number[]>>()
    .notNull()
    .default({}),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
});

export type DbPlayer = typeof players.$inferSelect;
export type DbPlayerInsert = typeof players.$inferInsert;
export type DbGameRoom = typeof gameRooms.$inferSelect;
export type DbGameRoomInsert = typeof gameRooms.$inferInsert;
export type DbRoomPlayer = typeof roomPlayers.$inferSelect;
export type DbQuestion = typeof questions.$inferSelect;
export type DbQuestionInsert = typeof questions.$inferInsert;
export type DbQuestionCache = typeof questionCaches.$inferSelect;
