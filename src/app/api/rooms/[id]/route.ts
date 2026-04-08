import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { getRoomById } from '@/lib/api/room-repo';

/** GET /api/rooms/[id] — retourne l'état complet de la room (avec cache Redis). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { id } = await context.params;
  const room = await getRoomById(id);
  if (!room) {
    return NextResponse.json({ room: null }, { status: 404 });
  }
  return NextResponse.json({ room });
}
