import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionPlayerId } from '@/lib/auth/session';
import { selectModifierCategory, GameError } from '@/lib/api/game-service';
import { getRoomById } from '@/lib/api/room-repo';
import { QuestionCategoryEnum } from '@/lib/schemas/enums';

const Body = z.object({
  category: QuestionCategoryEnum,
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await getSessionPlayerId();
  if (!playerId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }
  try {
    await selectModifierCategory(id, playerId, parsed.data.category);
    const room = await getRoomById(id);
    return NextResponse.json({ ok: true, room });
  } catch (err) {
    if (err instanceof GameError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
