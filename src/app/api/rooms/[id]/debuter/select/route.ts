import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionPlayerId } from '@/lib/auth/session';
import { selectStartingPlayer, GameError } from '@/lib/api/game-service';

const Body = z.object({ playerId: z.string().min(1) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }
  const { id } = await context.params;
  try {
    await selectStartingPlayer(id, playerId, parsed.data.playerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GameError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
