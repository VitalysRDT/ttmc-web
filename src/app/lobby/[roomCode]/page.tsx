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

  // Auto-join si on arrive sur ce code sans être dans la room
  useEffect(() => {
    if (!room || !player) return;
    const isInRoom = room.players.some((p) => p.id === player.id);
    if (!isInRoom && room.status === 'waiting') {
      joinRoomByCode(roomCode).catch((err) => {
        setActionError(err instanceof Error ? err.message : 'Erreur rejoint');
      });
    }
  }, [room, player, roomCode]);

  // Redirect vers le game screen dès que la partie démarre
  useEffect(() => {
    if (room?.status === 'playing') {
      router.replace(`/game/${room.id}`);
    }
  }, [room, router]);

  // Redirect vers /auth si non auth
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
        <div className="size-12 animate-spin rounded-full border-4 border-white/20 border-t-[var(--color-primary)]" />
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400">{error ?? 'Salle introuvable'}</p>
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
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg flex flex-col items-center gap-8"
      >
        <RoomCodeDisplay roomCode={room.roomCode} />

        <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <PlayerList
            players={room.players}
            hostId={room.hostId}
            maxPlayers={room.maxPlayers}
          />
        </div>

        {actionError && (
          <p className="text-red-400 text-sm text-center">{actionError}</p>
        )}

        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            variant={currentPlayerInRoom?.isReady ? 'secondary' : 'primary'}
            onClick={handleToggleReady}
          >
            {currentPlayerInRoom?.isReady ? 'PAS PRÊT' : 'JE SUIS PRÊT'}
          </Button>

          {isHost && (
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!canStart}
              loading={actionLoading}
            >
              {canStart ? 'DÉMARRER LA PARTIE' : 'EN ATTENTE DES JOUEURS'}
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={handleLeave}>
            Quitter
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
