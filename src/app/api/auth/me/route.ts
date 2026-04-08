import { NextResponse } from 'next/server';
import { getSessionPlayerId } from '@/lib/auth/session';
import { getPlayer } from '@/lib/api/player-repo';

export async function GET() {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ player: null });
  }
  const player = await getPlayer(playerId);
  return NextResponse.json({ player });
}
