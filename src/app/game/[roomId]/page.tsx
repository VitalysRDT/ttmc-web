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

  const currentPlayerId = room.gameState.currentPlayerId;

  return (
    <main className="min-h-dvh p-4 md:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* HUD top */}
        <div className="flex w-full items-center justify-between gap-4">
          <div className="text-xs tracking-[0.2em] text-white/50">
            TOUR {room.gameState.currentRound}
          </div>
          <div className="flex gap-4 md:gap-6">
            {room.players.map((p) => {
              const pos = room.gameState!.playerPositions[p.id] ?? 0;
              const isActive = p.id === currentPlayerId;
              return (
                <div
                  key={p.id}
                  className={`text-center rounded-xl px-3 py-1 transition-colors ${
                    isActive ? 'bg-[var(--color-primary)]/20' : ''
                  }`}
                >
                  <div
                    className={`text-xs ${
                      isActive ? 'text-[var(--color-primary)]' : 'text-white/50'
                    }`}
                  >
                    {p.pseudo}
                  </div>
                  <div className="text-lg font-black text-[var(--color-primary)]">
                    CASE {pos}/50
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenu principal : phase + plateau côte à côte sur desktop, empilés sur mobile */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col items-center">
            <PhaseRenderer room={room} currentPlayer={player} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs tracking-[0.2em] text-white/50">PLATEAU</div>
            <GameBoard
              players={room.players}
              playerPositions={room.gameState.playerPositions}
              currentPlayerId={room.gameState.currentPlayerId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
