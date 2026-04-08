import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getSessionPlayerId,
  setSessionCookie,
  generatePlayerId,
} from '@/lib/auth/session';
import { createPlayer, getPlayer, updatePlayerPseudo } from '@/lib/api/player-repo';

const BodySchema = z.object({
  pseudo: z.string().trim().min(2).max(30),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Pseudo invalide (2-30 caractères)' },
      { status: 400 },
    );
  }
  const { pseudo } = parsed.data;

  // Si déjà connecté, mettre à jour le pseudo et retourner
  const existingId = await getSessionPlayerId();
  if (existingId) {
    const existing = await getPlayer(existingId);
    if (existing) {
      if (existing.pseudo !== pseudo) {
        await updatePlayerPseudo(existingId, pseudo);
      }
      return NextResponse.json({ player: { ...existing, pseudo } });
    }
  }

  // Créer un nouveau joueur
  const id = generatePlayerId();
  const player = await createPlayer(id, pseudo, { authProvider: 'anonymous' });
  await setSessionCookie(id);
  return NextResponse.json({ player });
}
