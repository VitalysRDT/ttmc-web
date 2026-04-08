import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  gameRooms,
  roomPlayers,
  type DbGameRoom,
  type DbRoomPlayer,
} from '@/lib/db/schema';
import { GameRoomSchema, type GameRoom } from '@/lib/schemas/game-room.schema';
import type { Player } from '@/lib/schemas/player.schema';
import { redis, CACHE_KEYS, CACHE_TTL, invalidateRoomCache } from '@/lib/redis/client';

/** Assemble un GameRoom à partir des lignes DB. */
function assembleRoom(room: DbGameRoom, rps: DbRoomPlayer[]): GameRoom {
  const players: Player[] = rps.map((rp) => ({
    id: rp.playerId,
    pseudo: rp.pseudo,
    email: null,
    photoURL: null,
    authProvider: 'anonymous',
    score: rp.score,
    position: rp.position,
    isHost: rp.isHost,
    isReady: rp.isReady,
    teamId: rp.teamId,
    correctAnswers: rp.correctAnswers,
    totalAnswers: rp.totalAnswers,
    joinedAt: rp.joinedAt,
    lastActivity: rp.joinedAt,
  }));

  return GameRoomSchema.parse({
    id: room.id,
    roomCode: room.roomCode,
    hostId: room.hostId,
    status: room.status,
    gameMode: room.gameMode,
    players,
    teams: {},
    gameState: room.gameState,
    maxPlayers: room.maxPlayers,
    minPlayers: room.minPlayers,
    winningScore: room.winningScore,
    useTimer: room.useTimer,
    defaultTimeLimit: room.defaultTimeLimit,
    settings: room.settings,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
  });
}

/** Charge une room par ID avec ses joueurs. Avec cache Upstash Redis. */
export async function getRoomById(id: string): Promise<GameRoom | null> {
  // Cache hit ?
  try {
    const cached = await redis.get<GameRoom>(CACHE_KEYS.room(id));
    if (cached) return GameRoomSchema.parse(cached);
  } catch {
    // Ignore cache errors
  }

  const [roomRow] = await db.select().from(gameRooms).where(eq(gameRooms.id, id)).limit(1);
  if (!roomRow) return null;
  const rps = await db
    .select()
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, id));
  const room = assembleRoom(roomRow, rps);

  // Cache write (best effort)
  try {
    await redis.set(CACHE_KEYS.room(id), room, { ex: CACHE_TTL.room });
  } catch {
    // Ignore
  }

  return room;
}

/** Charge une room par son code (la plus récente en waiting). */
export async function getRoomByCode(code: string): Promise<GameRoom | null> {
  const [roomRow] = await db
    .select()
    .from(gameRooms)
    .where(and(eq(gameRooms.roomCode, code), eq(gameRooms.status, 'waiting')))
    .orderBy(desc(gameRooms.createdAt))
    .limit(1);
  if (!roomRow) {
    // Fallback: chercher n'importe quel statut (pour reprendre une partie en cours)
    const [anyRoom] = await db
      .select()
      .from(gameRooms)
      .where(eq(gameRooms.roomCode, code))
      .orderBy(desc(gameRooms.createdAt))
      .limit(1);
    if (!anyRoom) return null;
    return getRoomById(anyRoom.id);
  }
  return getRoomById(roomRow.id);
}

/** Crée une nouvelle room. */
export async function createRoomRow(params: {
  id: string;
  roomCode: string;
  host: { id: string; pseudo: string };
  maxPlayers?: number;
  gameMode?: 'individual' | 'team';
  useTimer?: boolean;
}): Promise<GameRoom> {
  const now = new Date();
  const [roomRow] = await db
    .insert(gameRooms)
    .values({
      id: params.id,
      roomCode: params.roomCode,
      hostId: params.host.id,
      status: 'waiting',
      gameMode: params.gameMode ?? 'individual',
      maxPlayers: params.maxPlayers ?? 4,
      useTimer: params.useTimer ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!roomRow) throw new Error('Room creation failed');

  await db.insert(roomPlayers).values({
    roomId: params.id,
    playerId: params.host.id,
    pseudo: params.host.pseudo,
    isHost: true,
    isReady: false,
    joinedAt: now,
  });

  const rps = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, params.id));
  return assembleRoom(roomRow, rps);
}

/** Ajoute un joueur à une room. */
export async function addPlayerToRoom(
  roomId: string,
  player: { id: string; pseudo: string },
): Promise<void> {
  const now = new Date();
  await db
    .insert(roomPlayers)
    .values({
      roomId,
      playerId: player.id,
      pseudo: player.pseudo,
      isHost: false,
      isReady: false,
      joinedAt: now,
    })
    .onConflictDoNothing();
  await db
    .update(gameRooms)
    .set({ updatedAt: now })
    .where(eq(gameRooms.id, roomId));
}

/** Retire un joueur d'une room. Transfère l'hôte si nécessaire. Supprime la room si vide. */
export async function removePlayerFromRoom(roomId: string, playerId: string): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;
  await db
    .delete(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.playerId, playerId)));
  const remaining = await db
    .select()
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, roomId));
  if (remaining.length === 0) {
    await db.delete(gameRooms).where(eq(gameRooms.id, roomId));
  } else if (room.hostId === playerId) {
    const newHost = remaining[0]!;
    await db
      .update(roomPlayers)
      .set({ isHost: true })
      .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.playerId, newHost.playerId)));
    await db
      .update(gameRooms)
      .set({ hostId: newHost.playerId, updatedAt: new Date() })
      .where(eq(gameRooms.id, roomId));
  }
  await invalidateRoomCache(roomId, room.roomCode);
}

/** Toggle le statut ready d'un joueur. */
export async function togglePlayerReady(roomId: string, playerId: string): Promise<void> {
  const [rp] = await db
    .select()
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.playerId, playerId)))
    .limit(1);
  if (!rp) throw new Error('Joueur introuvable dans la salle');
  await db
    .update(roomPlayers)
    .set({ isReady: !rp.isReady })
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.playerId, playerId)));
  await db
    .update(gameRooms)
    .set({ updatedAt: new Date() })
    .where(eq(gameRooms.id, roomId));
  const room = await getRoomById(roomId);
  if (room) await invalidateRoomCache(roomId, room.roomCode);
}

/** Met à jour le gameState d'une room. */
export async function updateRoomGameState(
  roomId: string,
  gameState: GameRoom['gameState'],
  status?: GameRoom['status'],
): Promise<void> {
  await db
    .update(gameRooms)
    .set({
      gameState,
      ...(status ? { status } : {}),
      ...(status === 'playing' ? { startedAt: new Date() } : {}),
      ...(status === 'finished' ? { finishedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(gameRooms.id, roomId));
  const room = await getRoomById(roomId);
  if (room) await invalidateRoomCache(roomId, room.roomCode);
}

/** Met à jour la position et le score d'un joueur dans room_players. */
export async function updatePlayerPositionScore(
  roomId: string,
  playerId: string,
  position: number,
  score: number,
): Promise<void> {
  await db
    .update(roomPlayers)
    .set({ position, score })
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.playerId, playerId)));
}

/** Vérifie si un code de salle est déjà utilisé par une room en waiting. */
export async function roomCodeExists(code: string): Promise<boolean> {
  const [row] = await db
    .select({ id: gameRooms.id })
    .from(gameRooms)
    .where(and(eq(gameRooms.roomCode, code), eq(gameRooms.status, 'waiting')))
    .limit(1);
  return !!row;
}
