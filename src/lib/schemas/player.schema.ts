import { z } from 'zod';
import { AuthProviderEnum } from './enums';

export const PlayerSchema = z.object({
  id: z.string(),
  pseudo: z.string().min(1),
  email: z.string().email().nullable().optional(),
  photoURL: z.string().url().nullable().optional(),
  authProvider: AuthProviderEnum.default('anonymous'),
  score: z.number().int().default(0),
  position: z.number().int().min(0).max(51).default(0),
  isHost: z.boolean().default(false),
  isReady: z.boolean().default(false),
  teamId: z.string().nullable().optional(),
  correctAnswers: z.number().int().default(0),
  totalAnswers: z.number().int().default(0),
  joinedAt: z.coerce.date().nullable().optional(),
  lastActivity: z.coerce.date().nullable().optional(),
});
export type Player = z.infer<typeof PlayerSchema>;

/** Calcule le taux de réussite en pourcentage. */
export function playerSuccessRate(player: Pick<Player, 'correctAnswers' | 'totalAnswers'>): number {
  return player.totalAnswers > 0 ? (player.correctAnswers / player.totalAnswers) * 100 : 0;
}
