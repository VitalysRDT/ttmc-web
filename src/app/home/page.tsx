'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CreateRoomButton } from '@/components/home/CreateRoomButton';
import { JoinRoomDialog } from '@/components/home/JoinRoomDialog';
import { useAuthStatus, useCurrentPlayer } from '@/lib/hooks/useAuth';
import { signOutAction } from '@/lib/api/client-actions';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function HomePage() {
  const router = useRouter();
  const status = useAuthStatus();
  const player = useCurrentPlayer();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const handleSignOut = async () => {
    await signOutAction();
    setUnauthenticated();
    router.replace('/auth');
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth');
    }
  }, [status, router]);

  if (status !== 'authenticated' || !player) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="size-12 animate-spin rounded-full border-4 border-white/20 border-t-[var(--color-primary)]" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center gap-10"
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 30px 10px rgba(255,215,0,0.3)',
                '0 0 60px 20px rgba(255,215,0,0.5)',
                '0 0 30px 10px rgba(255,215,0,0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="size-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center border-4 border-white mb-2"
          >
            <span className="text-3xl font-black text-black">T²</span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-[0.3em] text-white">TTMC</h1>
          <p className="text-sm text-[var(--color-primary)]">
            Salut, <span className="font-bold">{player.pseudo}</span>
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <CreateRoomButton />
          <JoinRoomDialog />
        </div>

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Se déconnecter
        </Button>
      </motion.div>
    </main>
  );
}
