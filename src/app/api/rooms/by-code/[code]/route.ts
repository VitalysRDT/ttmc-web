import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { getRoomByCode } from '@/lib/api/room-repo';

/** GET /api/rooms/by-code/[code] — retourne l'id d'une room par son code. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { code } = await context.params;
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
  }
  const room = await getRoomByCode(code);
  if (!room) {
    return NextResponse.json({ room: null }, { status: 404 });
  }
  return NextResponse.json({ room });
}
