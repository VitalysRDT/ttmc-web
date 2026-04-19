/**
 * Actions client-side : wrappers fetch vers les Route Handlers.
 *
 * Chaque mutation de jeu retourne le nouveau `GameRoom` hydraté par le serveur
 * (ou `null` pour les actions qui peuvent détruire la room, ex. leave).
 * Cela permet au hook `useGameActions` de mettre à jour le cache TanStack Query
 * immédiatement via `setQueryData`, éliminant la latence du polling (~1s).
 */

import type { Player } from '@/lib/schemas/player.schema';
import { GameRoomSchema, type GameRoom } from '@/lib/schemas/game-room.schema';
import type { QuestionCategory } from '@/lib/schemas/enums';

async function post(url: string, body?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Partial<{ error: string }> & T;
  if (!res.ok) {
    throw new HttpError(data.error ?? `Erreur (${res.status})`, res.status);
  }
  return data as T;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/**
 * Parse `{ ok, room }` du body. Retourne le GameRoom validé ou null.
 */
async function parseRoomResponse(res: Response): Promise<GameRoom | null> {
  const data = await parseJsonOrThrow<{ ok: boolean; room: unknown }>(res);
  if (!data.room) return null;
  try {
    return GameRoomSchema.parse(data.room);
  } catch {
    return null;
  }
}

// --- Auth ---

export async function signInAnonymouslyWithPseudo(pseudo: string): Promise<Player> {
  const res = await post('/api/auth/anonymous', { pseudo });
  const data = await parseJsonOrThrow<{ player: Player }>(res);
  return data.player;
}

export async function signOutAction(): Promise<void> {
  await post('/api/auth/signout');
}

// --- Rooms ---

export async function createRoom(): Promise<GameRoom> {
  const res = await post('/api/rooms');
  const data = await parseJsonOrThrow<{ room: GameRoom }>(res);
  return GameRoomSchema.parse(data.room);
}

export async function joinRoomByCode(roomCode: string): Promise<string> {
  const res = await post('/api/rooms/join', { roomCode });
  const data = await parseJsonOrThrow<{ roomId: string }>(res);
  return data.roomId;
}

export async function toggleReady(roomId: string): Promise<GameRoom | null> {
  return parseRoomResponse(await post(`/api/rooms/${roomId}/ready`));
}

export async function leaveRoom(roomId: string): Promise<GameRoom | null> {
  return parseRoomResponse(await post(`/api/rooms/${roomId}/leave`));
}

export async function startGame(roomId: string): Promise<GameRoom | null> {
  return parseRoomResponse(await post(`/api/rooms/${roomId}/start`));
}

// --- Game actions ---

export async function startTurn(roomId: string): Promise<GameRoom | null> {
  return parseRoomResponse(await post(`/api/rooms/${roomId}/turn/start`));
}

export async function selectDifficulty(
  roomId: string,
  difficulty: number,
): Promise<GameRoom | null> {
  return parseRoomResponse(
    await post(`/api/rooms/${roomId}/turn/difficulty`, { difficulty }),
  );
}

export async function revealAnswerAction(roomId: string): Promise<GameRoom | null> {
  return parseRoomResponse(await post(`/api/rooms/${roomId}/turn/reveal`));
}

export async function submitAnswer(
  roomId: string,
  isCorrect: boolean,
): Promise<GameRoom | null> {
  return parseRoomResponse(
    await post(`/api/rooms/${roomId}/turn/answer`, { isCorrect }),
  );
}

export async function submitIntrepideAnswer(
  roomId: string,
  subItemAnswers: Record<string, boolean>,
): Promise<GameRoom | null> {
  return parseRoomResponse(
    await post(`/api/rooms/${roomId}/turn/answer`, { subItemAnswers }),
  );
}

export async function nextTurnAction(roomId: string): Promise<GameRoom | null> {
  return parseRoomResponse(await post(`/api/rooms/${roomId}/turn/next`));
}

export async function skipCardAction(roomId: string): Promise<GameRoom | null> {
  return parseRoomResponse(await post(`/api/rooms/${roomId}/turn/skip`));
}

export async function selectModifierCategoryAction(
  roomId: string,
  category: QuestionCategory,
): Promise<GameRoom | null> {
  return parseRoomResponse(
    await post(`/api/rooms/${roomId}/modifier/category`, { category }),
  );
}

export async function selectStartingPlayer(
  roomId: string,
  playerId: string,
): Promise<GameRoom | null> {
  return parseRoomResponse(
    await post(`/api/rooms/${roomId}/debuter/select`, { playerId }),
  );
}
