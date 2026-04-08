'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRoomStream } from '@/lib/hooks/useRoomStream';
import { useAuthStatus } from '@/lib/hooks/useAuth';

interface Props {
  params: Promise<{ roomId: string }>;
}

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
        <div className="size-12 animate-spin rounded-full border-4 border-white/20 border-t-[var(--color-primary)]" />
      </main>
    );
  }

  if (error || !room || !room.gameState) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400">{error ?? 'Partie introuvable'}</p>
        <Button onClick={() => router.push('/home')}>Retour à l'accueil</Button>
      </main>
    );
  }

  const ranked = [...room.players].sort(
    (a, b) =>
      (room.gameState!.playerPositions[b.id] ?? 0) -
      (room.gameState!.playerPositions[a.id] ?? 0),
  );
  const winnerId = room.gameState.winnerId;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg flex flex-col items-center gap-8"
      >
        <div className="flex flex-col items-center gap-3">
          <Trophy size={72} className="text-[var(--color-primary)]" />
          <h1 className="text-4xl font-black tracking-[0.2em] text-white">
            FIN DE PARTIE
          </h1>
        </div>

        <div className="w-full flex flex-col gap-3">
          {ranked.map((p, i) => {
            const position = room.gameState!.playerPositions[p.id] ?? 0;
            const isWinner = p.id === winnerId;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-4 rounded-2xl border p-4 ${
                  isWinner
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white">
                  {i === 0 ? <Medal size={28} className="text-[var(--color-primary)]" /> : i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.pseudo}</span>
                    {isWinner && (
                      <span className="text-xs text-[var(--color-primary)] font-bold">
                        GAGNANT
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/60">{position} cases</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Button size="lg" onClick={() => router.push('/home')}>
          NOUVELLE PARTIE
        </Button>
      </motion.div>
    </main>
  );
}
