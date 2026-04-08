import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionPlayerId } from '@/lib/auth/session';
import { selectDifficulty, GameError } from '@/lib/api/game-service';
import { getRoomById } from '@/lib/api/room-repo';

const Body = z.object({ difficulty: z.number().int().min(1).max(10) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Difficulté invalide (1-10)' }, { status: 400 });
  }
  const { id } = await context.params;
  try {
    await selectDifficulty(id, playerId, parsed.data.difficulty);
    const room = await getRoomById(id);
    return NextResponse.json({ ok: true, room });
  } catch (err) {
    if (err instanceof GameError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
