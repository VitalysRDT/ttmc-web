import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionPlayerId } from '@/lib/auth/session';
import { getPlayer } from '@/lib/api/player-repo';
import { addPlayerToRoom, getRoomByCode } from '@/lib/api/room-repo';
import { invalidateRoomCache } from '@/lib/redis/client';

const BodySchema = z.object({
  roomCode: z.string().regex(/^\d{4}$/),
});

/** POST /api/rooms/join — rejoint une room par code. */
export async function POST(request: Request) {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Code invalide (4 chiffres)' }, { status: 400 });
  }

  const player = await getPlayer(playerId);
  if (!player) {
    return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 });
  }

  const room = await getRoomByCode(parsed.data.roomCode);
  if (!room) {
    return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
  }
  if (room.status !== 'waiting') {
    // Déjà dans la room ? Retourner OK (permet de rejoindre une partie en cours)
    const isAlreadyIn = room.players.some((p) => p.id === playerId);
    if (!isAlreadyIn) {
      return NextResponse.json({ error: 'La partie a déjà commencé' }, { status: 403 });
    }
    return NextResponse.json({ roomId: room.id });
  }
  if (room.players.length >= room.maxPlayers) {
    return NextResponse.json({ error: 'Salle pleine' }, { status: 403 });
  }
  const isAlreadyIn = room.players.some((p) => p.id === playerId);
  if (!isAlreadyIn) {
    await addPlayerToRoom(room.id, { id: player.id, pseudo: player.pseudo });
    await invalidateRoomCache(room.id, room.roomCode);
  }
  return NextResponse.json({ roomId: room.id });
}
