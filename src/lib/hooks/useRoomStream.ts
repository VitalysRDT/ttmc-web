'use client';

import { useQuery } from '@tanstack/react-query';
import { GameRoomSchema, type GameRoom } from '@/lib/schemas/game-room.schema';

/**
 * Hook de polling temps réel pour une room, via /api/rooms/[id].
 * Remplace le `onSnapshot` Firestore.
 *
 * Le polling est à 1000ms. Pour un jeu turn-based, c'est amplement suffisant et
 * ça marche partout (dev, Vercel, prévisualisation) sans WebSocket ni SSE.
 */

interface StreamState {
  room: GameRoom | null;
  loading: boolean;
  error: string | null;
}

function parseRoom(raw: unknown): GameRoom | null {
  if (!raw) return null;
  try {
    return GameRoomSchema.parse(raw);
  } catch {
    return null;
  }
}

export function useRoomStream(roomId: string | null | undefined): StreamState {
  const query = useQuery<GameRoom | null>({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const res = await fetch(`/api/rooms/${roomId}`, { cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Impossible de charger la salle');
      const data = await res.json();
      return parseRoom(data.room);
    },
    enabled: !!roomId,
    refetchInterval: 1000,
    staleTime: 500,
    retry: 1,
  });

  return {
    room: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}

export function useRoomByCodeStream(roomCode: string | null | undefined): StreamState {
  const query = useQuery<GameRoom | null>({
    queryKey: ['room-by-code', roomCode],
    queryFn: async () => {
      if (!roomCode) return null;
      const res = await fetch(`/api/rooms/by-code/${roomCode}`, { cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Impossible de charger la salle');
      const data = await res.json();
      return parseRoom(data.room);
    },
    enabled: !!roomCode,
    refetchInterval: 1000,
    staleTime: 500,
    retry: 1,
  });

  return {
    room: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
