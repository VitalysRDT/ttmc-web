import { z } from 'zod';
import { GameStatusEnum, GameModeEnum, GAME_CONSTANTS } from './enums';
import { PlayerSchema } from './player.schema';
import { GameStateSchema } from './game-state.schema';

export const GameRoomSchema = z.object({
  id: z.string(),
  roomCode: z.string().regex(/^\d{4}$/),
  hostId: z.string(),
  status: GameStatusEnum,
  gameMode: GameModeEnum,
  players: z.array(PlayerSchema).default([]),
  teams: z.record(z.string(), z.array(z.string())).default({}),
  gameState: GameStateSchema.nullable().default(null),
  maxPlayers: z.number().int().min(2).max(8).default(4),
  minPlayers: z.number().int().min(2).default(2),
  winningScore: z.number().int().default(GAME_CONSTANTS.winningPosition),
  useTimer: z.boolean().default(true),
  defaultTimeLimit: z.number().int().positive().default(GAME_CONSTANTS.defaultTimeLimit),
  settings: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.coerce.date().nullable().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  finishedAt: z.coerce.date().nullable().optional(),
});
export type GameRoom = z.infer<typeof GameRoomSchema>;
