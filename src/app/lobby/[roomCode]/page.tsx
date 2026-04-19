'use client';

import { useEffect, useMemo, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { PlayerList } from '@/components/lobby/PlayerList';
import { RoomCodeDisplay } from '@/components/lobby/RoomCodeDisplay';
import { useCurrentPlayer, useAuthStatus } from '@/lib/hooks/useAuth';
import { useRoomByCodeStream } from '@/lib/hooks/useRoomStream';
import {
  toggleReady,
  leaveRoom,
  startGame,
  joinRoomByCode,
} from '@/lib/api/client-actions';
import { canStartGame } from '@/lib/game/game-logic';

interface Props {
  params: Promise<{ roomCode: string }>;
}

export default function LobbyPage({ params }: Props) {
  const { roomCode } = use(params);
  const router = useRouter();
  const player = useCurrentPlayer();
  const authStatus = useAuthStatus();
  const { room, loading, error } = useRoomByCodeStream(roomCode);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!room || !player) return;
    const isInRoom = room.players.some((p) => p.id === player.id);
    if (!isInRoom && room.status === 'waiting') {
      joinRoomByCode(roomCode).catch((err) => {
        setActionError(err instanceof Error ? err.message : 'Erreur rejoint');
      });
    }
  }, [room, player, roomCode]);

  useEffect(() => {
    if (room?.status === 'playing') {
      router.replace(`/game/${room.id}`);
    }
  }, [room, router]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/auth');
    }
  }, [authStatus, router]);

  const currentPlayerInRoom = useMemo(
    () => room?.players.find((p) => p.id === player?.id),
    [room, player],
  );
  const isHost = player?.id === room?.hostId;
  const canStart = room
    ? canStartGame({
        players: room.players,
        minPlayers: room.minPlayers,
        status: room.status,
      })
    : false;

  if (loading || authStatus === 'loading') {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-[var(--color-rule)] border-t-[var(--color-ink)]" />
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[oklch(0.55_0.2_25)]">
          {error ?? 'Salle introuvable'}
        </p>
        <Button onClick={() => router.push('/home')}>Retour</Button>
      </main>
    );
  }

  const handleToggleReady = async () => {
    if (!player || !room) return;
    setActionError(null);
    try {
      await toggleReady(room.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleStart = async () => {
    if (!player || !room) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await startGame(room.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur démarrage');
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!player || !room) return;
    try {
      await leaveRoom(room.id);
      router.push('/home');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <main className="min-h-dvh px-6 py-12 md:px-20 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-[1100px] grid gap-14 md:grid-cols-[1.2fr_1fr]"
      >
        <div>
          <div className="kicker">§ 03 · Salle d&apos;attente</div>
          <h1
            className="font-serif italic"
            style={{
              fontSize: 'clamp(56px, 8vw, 92px)',
              lineHeight: 0.9,
              margin: '12px 0 24px',
              fontWeight: 500,
              letterSpacing: '-0.02em',
            }}
          >
            Le salon est{' '}
            <span style={{ color: 'var(--color-accent)' }}>ouvert</span>.
          </h1>
          <p
            style={{
              color: 'var(--color-ink-2)',
              fontSize: 17,
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            Partage le code. Quand tout le monde est prêt — carré noir sur le nom —
            tu démarres. Personne ne peut rejoindre après le premier tour.
          </p>

          <div style={{ marginTop: 36 }}>
            <RoomCodeDisplay roomCode={room.roomCode} />
          </div>

          <div
            style={{
              marginTop: 40,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant={currentPlayerInRoom?.isReady ? 'secondary' : 'primary'}
              size="lg"
              onClick={handleToggleReady}
            >
              {currentPlayerInRoom?.isReady ? 'Pas prêt' : 'Je suis prêt·e'}
            </Button>
            {isHost && (
              <Button
                variant="accent"
                size="lg"
                onClick={handleStart}
                disabled={!canStart}
                loading={actionLoading}
              >
                Lancer la partie →
              </Button>
            )}
            <Button variant="ghost" size="lg" onClick={handleLeave}>
              Quitter
            </Button>
          </div>

          {!canStart && (
            <p
              className="font-mono"
              style={{
                marginTop: 14,
                fontSize: 11,
                color: 'var(--color-ink-3)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              On attend que tout le monde soit prêt.
            </p>
          )}

          {actionError && (
            <p
              className="font-mono"
              style={{
                marginTop: 10,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: 'oklch(0.55 0.2 25)',
                textTransform: 'uppercase',
              }}
            >
              {actionError}
            </p>
          )}
        </div>

        <div>
          <PlayerList
            players={room.players}
            hostId={room.hostId}
            maxPlayers={room.maxPlayers}
            currentPlayerId={player?.id}
            onToggleReady={handleToggleReady}
          />
        </div>
      </motion.div>
    </main>
  );
}
