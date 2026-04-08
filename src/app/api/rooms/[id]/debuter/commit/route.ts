import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { commitDebuterTransition } from '@/lib/api/game-service';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { id } = await context.params;
  await commitDebuterTransition(id);
  return NextResponse.json({ ok: true });
}
