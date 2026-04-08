'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { PhaseRenderer } from '@/components/game/PhaseRenderer';
import { GameBoard } from '@/components/game/GameBoard';
import { useCurrentPlayer, useAuthStatus } from '@/lib/hooks/useAuth';
import { useRoomStream } from '@/lib/hooks/useRoomStream';

interface Props {
  params: Promise<{ roomId: string }>;
}

const PLAYER_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#C7F464', '#B39BC8', '#F5A25D'];

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
        <div className="size-14 animate-spin rounded-full border-4 border-white/10 border-t-[var(--color-primary)]" />
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
    <main className="min-h-dvh p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* HUD top */}
        <div className="flex w-full items-center justify-between gap-4 flex-wrap">
          <div className="glass-card rounded-full px-5 py-2 text-xs tracking-[0.25em] text-white/60 uppercase">
            Tour {room.gameState.currentRound}
          </div>
          <div className="flex gap-3">
            {room.players.map((p, idx) => {
              const pos = room.gameState!.playerPositions[p.id] ?? 0;
              const isActive = p.id === currentPlayerId;
              const color = PLAYER_COLORS[idx % PLAYER_COLORS.length]!;
              return (
                <motion.div
                  key={p.id}
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                  className={`glass-card relative flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-all ${
                    isActive ? 'border-[var(--color-primary)]/50' : ''
                  }`}
                  style={
                    isActive
                      ? {
                          boxShadow: `0 0 30px ${color}55, 0 8px 24px rgba(0,0,0,0.4)`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="size-3 rounded-full border border-white/30"
                    style={{
                      backgroundColor: color,
                      boxShadow: isActive ? `0 0 10px ${color}` : undefined,
                    }}
                  />
                  <div>
                    <div
                      className={`text-[10px] tracking-[0.2em] uppercase ${
                        isActive ? 'text-[var(--color-primary)]' : 'text-white/50'
                      }`}
                    >
                      {p.pseudo}
                    </div>
                    <div className="text-base font-black text-white leading-tight">
                      <span className="text-[var(--color-primary)]">{pos}</span>
                      <span className="text-white/30 text-xs">/50</span>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 text-[10px]"
                    >
                      🎯
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Phase + Plateau */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col items-center justify-start min-h-[400px]">
            <PhaseRenderer room={room} currentPlayer={player} />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Plateau</div>
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
