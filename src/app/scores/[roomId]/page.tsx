'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useRoomStream } from '@/lib/hooks/useRoomStream';
import { useAuthStatus } from '@/lib/hooks/useAuth';

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

const PODIUM_HEIGHTS = [220, 320, 160]; // 2e, 1er, 3e
const PODIUM_LABELS = ['2e', '1er', '3e'];

export default function ScoresPage({ params }: Props) {
  const { roomId } = use(params);
  const router = useRouter();
  const { room, loading, error } = useRoomStream(roomId);
  const authStatus = useAuthStatus();

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/auth');
  }, [authStatus, router]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-[var(--color-rule)] border-t-[var(--color-ink)]" />
      </main>
    );
  }

  if (error || !room || !room.gameState) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[oklch(0.55_0.2_25)]">
          {error ?? 'Partie introuvable'}
        </p>
        <Button onClick={() => router.push('/home')}>Retour à l&apos;accueil</Button>
      </main>
    );
  }

  const positions = room.gameState.playerPositions;
  const winnerId = room.gameState.winnerId;

  const ranked = [...room.players]
    .map((p, idx) => ({
      ...p,
      pos: positions[p.id] ?? 0,
      pawn: PAWN_COLORS[idx % PAWN_COLORS.length]!,
    }))
    .sort((a, b) => b.pos - a.pos);

  const winner = ranked[0]!;
  const podium = [ranked[1], ranked[0], ranked[2]]; // 2e, 1er, 3e

  return (
    <main className="min-h-dvh px-6 py-12 md:px-20 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-[1100px]"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 18,
          }}
        >
          <div>
            <div className="kicker">§ 09 · Épilogue</div>
            <h1
              className="font-serif italic"
              style={{
                margin: '10px 0 8px',
                fontSize: 'clamp(60px, 9vw, 96px)',
                lineHeight: 0.9,
                fontWeight: 500,
                letterSpacing: '-0.03em',
              }}
            >
              Fin de <span style={{ color: 'var(--color-accent)' }}>partie</span>.
            </h1>
            <p
              style={{
                color: 'var(--color-ink-2)',
                fontSize: 18,
                lineHeight: 1.5,
                maxWidth: 520,
              }}
            >
              {winner.pseudo} franchit la case {winner.pos}. Les autres ont bien
              joué mais pas mieux. On rejoue&nbsp;?
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="kicker">Partie #{room.roomCode}</div>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: 'var(--color-ink-3)',
                letterSpacing: '0.14em',
                marginTop: 6,
                textTransform: 'uppercase',
              }}
            >
              {room.players.length} JOUEURS
            </div>
          </div>
        </div>

        <hr className="rule-thick" style={{ margin: '36px 0 40px' }} />

        {/* PODIUM */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 24,
            alignItems: 'end',
            minHeight: 340,
          }}
        >
          {podium.map((p, col) => {
            if (!p) return <div key={col} style={{ gridColumn: 'span 4' }} />;
            const h = PODIUM_HEIGHTS[col]!;
            const rankLabel = PODIUM_LABELS[col];
            const isWinner = p.id === winnerId || col === 1;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: col * 0.1 }}
                style={{
                  gridColumn: 'span 4',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: p.pawn,
                    border: '2px solid var(--color-ink)',
                    marginBottom: 16,
                    boxShadow: isWinner ? '0 0 0 8px var(--color-accent-soft)' : 'none',
                  }}
                />
                <div
                  className="font-serif italic"
                  style={{
                    fontSize: 32,
                    fontWeight: 500,
                    color: 'var(--color-ink)',
                  }}
                >
                  {p.pseudo}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    color: 'var(--color-ink-3)',
                    textTransform: 'uppercase',
                    marginTop: 4,
                  }}
                >
                  Case {String(p.pos).padStart(2, '0')}/50
                </div>
                <div
                  style={{
                    marginTop: 14,
                    width: '100%',
                    height: h,
                    background: isWinner
                      ? 'var(--color-ink)'
                      : 'var(--color-paper)',
                    color: isWinner
                      ? 'var(--color-paper)'
                      : 'var(--color-ink)',
                    border: '1.5px solid var(--color-ink)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: isWinner
                      ? '6px 6px 0 var(--color-accent)'
                      : '4px 4px 0 var(--color-ink)',
                  }}
                >
                  <div
                    className="font-serif italic"
                    style={{
                      fontSize: isWinner ? 130 : 84,
                      lineHeight: 0.85,
                      fontWeight: 500,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {rankLabel}
                  </div>
                  {isWinner && (
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.2em',
                        fontWeight: 700,
                      }}
                    >
                      ★ VAINQUEUR ★
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {ranked.length > 3 && (
          <div style={{ marginTop: 60 }}>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Le reste du peloton
            </div>
            <hr className="rule-thick" />
            {ranked.slice(3).map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 4px',
                  borderBottom: '1px solid var(--color-rule)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--color-ink-4)',
                      width: 30,
                      letterSpacing: '0.12em',
                    }}
                  >
                    {String(i + 4).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      background: p.pawn,
                      borderRadius: '50%',
                      border: '1.5px solid var(--color-ink)',
                    }}
                  />
                  <span
                    className="font-serif italic"
                    style={{ fontSize: 22, fontWeight: 500 }}
                  >
                    {p.pseudo}
                  </span>
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--color-ink-3)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Case {String(p.pos).padStart(2, '0')}/50
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 56,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="accent" size="lg" onClick={() => router.push('/home')}>
            On rejoue →
          </Button>
          <Button variant="ghost" size="lg" onClick={() => router.push('/home')}>
            Quitter le salon
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
