/**
 * Actions client-side : wrappers fetch vers les Route Handlers.
 * Utilisées dans les composants et mutations TanStack Query.
 */

import type { Player } from '@/lib/schemas/player.schema';
import type { GameRoom } from '@/lib/schemas/game-room.schema';

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
    throw new Error(data.error ?? `Erreur (${res.status})`);
  }
  return data as T;
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
  return data.room;
}

export async function joinRoomByCode(roomCode: string): Promise<string> {
  const res = await post('/api/rooms/join', { roomCode });
  const data = await parseJsonOrThrow<{ roomId: string }>(res);
  return data.roomId;
}

export async function toggleReady(roomId: string): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/ready`);
  await parseJsonOrThrow(res);
}

export async function leaveRoom(roomId: string): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/leave`);
  await parseJsonOrThrow(res);
}

export async function startGame(roomId: string): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/start`);
  await parseJsonOrThrow(res);
}

// --- Game actions ---

export async function startTurn(roomId: string): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/turn/start`);
  await parseJsonOrThrow(res);
}

export async function selectDifficulty(roomId: string, difficulty: number): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/turn/difficulty`, { difficulty });
  await parseJsonOrThrow(res);
}

export async function revealAnswerAction(roomId: string): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/turn/reveal`);
  await parseJsonOrThrow(res);
}

export async function submitAnswer(roomId: string, isCorrect: boolean): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/turn/answer`, { isCorrect });
  await parseJsonOrThrow(res);
}

export async function nextTurnAction(roomId: string): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/turn/next`);
  await parseJsonOrThrow(res);
}

export async function submitDebuterAnswer(roomId: string, isCorrect: boolean): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/debuter/answer`, { isCorrect });
  await parseJsonOrThrow(res);
}

export async function commitDebuterTransition(roomId: string): Promise<void> {
  const res = await post(`/api/rooms/${roomId}/debuter/commit`);
  await parseJsonOrThrow(res);
}
