import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSessionPlayerId } from '@/lib/auth/session';
import { getPlayer } from '@/lib/api/player-repo';
import { createRoomRow, roomCodeExists } from '@/lib/api/room-repo';
import { generateRoomCode } from '@/lib/utils/generate-room-code';

/** POST /api/rooms — crée une nouvelle room. */
export async function POST() {
  const playerId = await getSessionPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const player = await getPlayer(playerId);
  if (!player) {
    return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 });
  }

  // Génère un code 4 chiffres unique (max 10 tentatives)
  let code = '';
  for (let i = 0; i < 10; i++) {
    const candidate = generateRoomCode();
    if (!(await roomCodeExists(candidate))) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return NextResponse.json(
      { error: 'Impossible de générer un code unique, réessaie.' },
      { status: 500 },
    );
  }

  const roomId = nanoid();
  const room = await createRoomRow({
    id: roomId,
    roomCode: code,
    host: { id: player.id, pseudo: player.pseudo },
  });
  return NextResponse.json({ room });
}
