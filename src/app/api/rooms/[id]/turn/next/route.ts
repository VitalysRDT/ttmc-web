import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { nextTurn, GameError } from '@/lib/api/game-service';
import { getRoomById } from '@/lib/api/room-repo';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { id } = await context.params;
  try {
    await nextTurn(id, playerId);
    const room = await getRoomById(id);
    return NextResponse.json({ ok: true, room });
  } catch (err) {
    if (err instanceof GameError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
