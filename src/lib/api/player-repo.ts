import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { players, type DbPlayer } from '@/lib/db/schema';
import type { Player } from '@/lib/schemas/player.schema';

/** Map DB → domain */
export function dbPlayerToDomain(row: DbPlayer): Player {
  return {
    id: row.id,
    pseudo: row.pseudo,
    email: row.email,
    photoURL: row.photoUrl,
    authProvider: (row.authProvider as Player['authProvider']) ?? 'anonymous',
    score: 0,
    position: 0,
    isHost: false,
    isReady: false,
    teamId: null,
    correctAnswers: row.correctAnswers,
    totalAnswers: row.totalAnswers,
    joinedAt: row.createdAt,
    lastActivity: row.lastActivity,
  };
}

/** Crée un nouveau joueur dans la DB. */
export async function createPlayer(
  id: string,
  pseudo: string,
  opts: { email?: string; photoUrl?: string; authProvider?: string } = {},
): Promise<Player> {
  const now = new Date();
  const [row] = await db
    .insert(players)
    .values({
      id,
      pseudo,
      email: opts.email ?? null,
      photoUrl: opts.photoUrl ?? null,
      authProvider: opts.authProvider ?? 'anonymous',
      createdAt: now,
      lastActivity: now,
    })
    .returning();
  if (!row) throw new Error('Player creation failed');
  return dbPlayerToDomain(row);
}

/** Récupère un joueur par ID. */
export async function getPlayer(id: string): Promise<Player | null> {
  const [row] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return row ? dbPlayerToDomain(row) : null;
}

/** Met à jour le pseudo d'un joueur. */
export async function updatePlayerPseudo(id: string, pseudo: string): Promise<void> {
  await db
    .update(players)
    .set({ pseudo, lastActivity: new Date() })
    .where(eq(players.id, id));
}

/** Touche `lastActivity`. */
export async function touchPlayer(id: string): Promise<void> {
  await db.update(players).set({ lastActivity: new Date() }).where(eq(players.id, id));
}

/** Incrémente atomiquement les stats d'un joueur. */
export async function incrementPlayerStats(
  id: string,
  delta: { games?: number; wins?: number; correctAnswers?: number; totalAnswers?: number },
): Promise<void> {
  await db
    .update(players)
    .set({
      totalGames: sql`${players.totalGames} + ${delta.games ?? 0}`,
      wins: sql`${players.wins} + ${delta.wins ?? 0}`,
      correctAnswers: sql`${players.correctAnswers} + ${delta.correctAnswers ?? 0}`,
      totalAnswers: sql`${players.totalAnswers} + ${delta.totalAnswers ?? 0}`,
      lastActivity: new Date(),
    })
    .where(eq(players.id, id));
}
