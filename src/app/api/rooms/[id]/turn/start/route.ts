import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { startTurn, GameError } from '@/lib/api/game-service';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { id } = await context.params;
  try {
    await startTurn(id, playerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GameError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
