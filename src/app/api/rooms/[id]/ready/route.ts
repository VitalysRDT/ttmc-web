import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { togglePlayerReady, getRoomById } from '@/lib/api/room-repo';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { id } = await context.params;
  const room = await getRoomById(id);
  if (!room) {
    return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
  }
  await togglePlayerReady(id, playerId);
  return NextResponse.json({ ok: true });
}
