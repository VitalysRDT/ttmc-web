'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PhaseRenderer } from '@/components/game/PhaseRenderer';
import { GameBoard } from '@/components/game/GameBoard';
import { useCurrentPlayer, useAuthStatus } from '@/lib/hooks/useAuth';
import { useRoomStream } from '@/lib/hooks/useRoomStream';

interface Props {
  params: Promise<{ roomId: string }>;
}

export default function GamePage({ params }: Props) {
  const { roomId } = use(params);
  const router = useRouter();
  const player = useCurrentPlayer();
  const authStatus = useAuthStatus();
  const { room, loading, error } = useRoomStream(roomId);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/auth');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (room?.status === 'finished') {
      router.replace(`/scores/${roomId}`);
    }
  }, [room?.status, roomId, router]);

  if (loading || authStatus === 'loading') {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="size-12 animate-spin rounded-full border-4 border-white/20 border-t-[var(--color-primary)]" />
      </main>
    );
  }

  if (error || !room || !player) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400">{error ?? 'Partie introuvable'}</p>
        <Button onClick={() => router.push('/home')}>Retour</Button>
      </main>
    );
  }

  if (!room.gameState) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-white/60">Préparation de la partie…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
        {/* HUD top */}
        <div className="flex w-full items-center justify-between">
          <div className="text-xs tracking-[0.2em] text-white/50">
            TOUR {room.gameState.currentRound}
          </div>
          <div className="flex gap-4">
            {room.players.map((p) => (
              <div key={p.id} className="text-center">
                <div className="text-xs text-white/50">{p.pseudo}</div>
                <div className="text-lg font-black text-[var(--color-primary)]">
                  {room.gameState!.playerPositions[p.id] ?? 0}/50
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase content */}
        <PhaseRenderer room={room} currentPlayer={player} />

        {/* Plateau compact */}
        <details className="w-full mt-4">
          <summary className="cursor-pointer text-sm text-white/60 text-center">
            Afficher le plateau
          </summary>
          <div className="mt-4 flex justify-center">
            <GameBoard
              players={room.players}
              playerPositions={room.gameState.playerPositions}
              currentPlayerId={room.gameState.currentPlayerId}
            />
          </div>
        </details>
      </div>
    </main>
  );
}
