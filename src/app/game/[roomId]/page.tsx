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

const PAWN_COLORS = [
  'var(--color-ink)',
  'var(--color-accent)',
  'var(--color-cat-scolaire)',
  'var(--color-cat-mature)',
  'var(--color-cat-improbable)',
  'var(--color-cat-final)',
];

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
        <div className="size-10 animate-spin rounded-full border-2 border-[var(--color-rule)] border-t-[var(--color-ink)]" />
      </main>
    );
  }

  if (error || !room || !player) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[oklch(0.55_0.2_25)]">
          {error ?? 'Partie introuvable'}
        </p>
        <Button onClick={() => router.push('/home')}>Retour</Button>
      </main>
    );
  }

  if (!room.gameState) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p
          className="font-serif italic"
          style={{ color: 'var(--color-ink-3)', fontSize: 22 }}
        >
          Préparation de la partie…
        </p>
      </main>
    );
  }

  const currentPlayerId = room.gameState.currentPlayerId;

  return (
    <main className="min-h-dvh px-6 py-8 md:px-12 md:py-10 lg:px-16">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8">
        {/* Chrome header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottom: '1px solid var(--color-ink)',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <span
              className="font-serif italic"
              style={{
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              Tu mises{' '}
              <b
                style={{
                  fontStyle: 'normal',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                }}
              >
                combien
              </b>{' '}
              ?
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color: 'var(--color-ink-3)',
                textTransform: 'uppercase',
              }}
            >
              · Tour {room.gameState.currentRound}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {room.players.map((p, idx) => {
              const pos = room.gameState!.playerPositions[p.id] ?? 0;
              const isActive = p.id === currentPlayerId;
              const color = PAWN_COLORS[idx % PAWN_COLORS.length];
              return (
                <motion.div
                  key={p.id}
                  animate={isActive ? { scale: 1.04 } : { scale: 1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: `1px solid ${
                      isActive ? 'var(--color-accent)' : 'var(--color-rule)'
                    }`,
                    background: isActive
                      ? 'var(--color-accent-soft)'
                      : 'transparent',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: color,
                      border: '1.5px solid var(--color-ink)',
                    }}
                  />
                  <span
                    className="font-serif italic"
                    style={{ fontSize: 15, fontWeight: 500 }}
                  >
                    {p.pseudo}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--color-ink-3)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {String(pos).padStart(2, '0')}/50
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Phase + plateau */}
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(380px,460px)]">
          <div className="flex w-full flex-col items-start min-h-[420px]">
            <PhaseRenderer room={room} currentPlayer={player} />
          </div>

          <div className="flex flex-col items-center gap-3">
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
