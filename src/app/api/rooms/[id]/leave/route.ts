import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { removePlayerFromRoom } from '@/lib/api/room-repo';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { id } = await context.params;
  await removePlayerFromRoom(id, playerId);
  return NextResponse.json({ ok: true });
}
