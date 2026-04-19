'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuthStatus, useCurrentPlayer } from '@/lib/hooks/useAuth';
import {
  signOutAction,
  createRoom,
  joinRoomByCode,
} from '@/lib/api/client-actions';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function HomePage() {
  const router = useRouter();
  const status = useAuthStatus();
  const player = useCurrentPlayer();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOutAction();
    setUnauthenticated();
    router.replace('/auth');
  };

  const handleCreate = async () => {
    setCreateError(null);
    setCreateLoading(true);
    try {
      const room = await createRoom();
      router.push(`/lobby/${room.roomCode}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création');
      setCreateLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoinError(null);
    if (!/^\d{4}$/.test(code)) {
      setJoinError('Le code doit contenir 4 chiffres.');
      return;
    }
    setJoinLoading(true);
    try {
      await joinRoomByCode(code);
      router.push(`/lobby/${code}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Erreur jointure');
      setJoinLoading(false);
    }
  };

  if (status !== 'authenticated' || !player) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-[var(--color-rule)] border-t-[var(--color-ink)]" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-6 py-12 md:px-20 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-[1100px]"
      >
        {/* Header */}
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="kicker">§ 02 · Créer · Rejoindre</div>
            <h1
              className="font-serif italic"
              style={{
                margin: '12px 0 0',
                fontWeight: 500,
                fontSize: 'clamp(56px, 8vw, 88px)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
              }}
            >
              Ce soir, <span style={{ color: 'var(--color-accent)' }}>on joue</span>.
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="kicker">Connecté·e</div>
            <div
              className="font-serif italic"
              style={{ fontSize: 28, fontWeight: 500, marginTop: 4 }}
            >
              {player.pseudo}
            </div>
            <button
              onClick={handleSignOut}
              className="font-mono"
              style={{
                marginTop: 6,
                fontSize: 10,
                letterSpacing: '0.14em',
                color: 'var(--color-ink-3)',
                textTransform: 'uppercase',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ↩ Se déconnecter
            </button>
          </div>
        </div>

        <hr className="rule-thick" style={{ marginTop: 28, marginBottom: 48 }} />

        <div className="grid gap-10 md:grid-cols-[1fr_1px_1fr]">
          {/* CREATE */}
          <div className="paper-card p-9">
            <div className="kicker">Option A</div>
            <h3
              className="font-serif italic"
              style={{
                fontSize: 40,
                margin: '10px 0 20px',
                fontWeight: 500,
              }}
            >
              J&apos;ouvre un salon
            </h3>
            <p
              style={{
                color: 'var(--color-ink-2)',
                lineHeight: 1.55,
                fontSize: 15.5,
              }}
            >
              Tu crées la salle. Tes amis te rejoignent avec un code à 4 chiffres.
              Tu lances la partie quand tu veux.
            </p>
            <ul
              className="font-mono"
              style={{
                fontSize: 12,
                color: 'var(--color-ink-3)',
                letterSpacing: '0.08em',
                listStyle: 'none',
                padding: 0,
                margin: '22px 0',
                lineHeight: 1.9,
              }}
            >
              <li>— 2 à 6 joueurs</li>
              <li>— questions de 10 niveaux</li>
              <li>— partie en ≈ 20 minutes</li>
            </ul>
            <Button variant="accent" size="lg" onClick={handleCreate} loading={createLoading}>
              Créer un salon →
            </Button>
            {createError && (
              <div
                className="font-mono"
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: 'oklch(0.55 0.2 25)',
                  textTransform: 'uppercase',
                }}
              >
                {createError}
              </div>
            )}
          </div>

          <div
            style={{
              background: 'var(--color-rule)',
              width: 1,
            }}
            className="hidden md:block"
          />

          {/* JOIN */}
          <div className="p-9">
            <div className="kicker">Option B</div>
            <h3
              className="font-serif italic"
              style={{
                fontSize: 40,
                margin: '10px 0 20px',
                fontWeight: 500,
              }}
            >
              Je rejoins
            </h3>
            <p
              style={{
                color: 'var(--color-ink-2)',
                lineHeight: 1.55,
                fontSize: 15.5,
              }}
            >
              Quelqu&apos;un t&apos;a filé un code à 4 chiffres. Entre-le ici et tu es dans la place.
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  value={code[i] ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(-1);
                    const next = (code.slice(0, i) + v + code.slice(i + 1)).slice(0, 4);
                    setCode(next);
                    if (v && i < 3) {
                      const inp = (e.target.parentNode as HTMLElement | null)
                        ?.children[i + 1] as HTMLInputElement | undefined;
                      inp?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !code[i] && i > 0) {
                      const inp = (e.currentTarget.parentNode as HTMLElement | null)
                        ?.children[i - 1] as HTMLInputElement | undefined;
                      inp?.focus();
                    }
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  className="font-serif"
                  style={{
                    width: 64,
                    height: 80,
                    textAlign: 'center',
                    fontSize: 52,
                    fontWeight: 500,
                    border: '1.5px solid var(--color-ink)',
                    background: 'var(--color-paper)',
                    color: 'var(--color-ink)',
                    outline: 'none',
                    fontVariantNumeric: 'tabular-nums',
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              style={{ marginTop: 28 }}
              disabled={code.length < 4}
              onClick={handleJoin}
              loading={joinLoading}
            >
              Rejoindre le salon →
            </Button>

            {joinError && (
              <div
                className="font-mono"
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: 'oklch(0.55 0.2 25)',
                  textTransform: 'uppercase',
                }}
              >
                {joinError}
              </div>
            )}
          </div>
        </div>

        <div
          className="font-mono"
          style={{
            marginTop: 60,
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--color-ink-3)',
            fontSize: 11,
            letterSpacing: '0.16em',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>PROTOTYPE ÉDITORIAL · TU MISES COMBIEN ?</span>
          <span>↘ TRANSPOSITION DE « LE GRAND QUIZ »</span>
        </div>
      </motion.div>
    </main>
  );
}
