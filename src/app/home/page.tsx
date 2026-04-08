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
        <div className="size-14 animate-spin rounded-full border-4 border-white/10 border-t-[var(--color-primary)]" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md flex flex-col items-center gap-12"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 40px 10px rgba(255,215,0,0.3)',
                '0 0 80px 20px rgba(255,215,0,0.5)',
                '0 0 40px 10px rgba(255,215,0,0.3)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="size-28 rounded-full flex items-center justify-center border-[3px] border-white/80"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffe666, #c9a700)',
            }}
          >
            <span
              className="text-4xl font-black text-black"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
            >
              T²
            </span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-[0.35em] text-white text-glow">TTMC</h1>
          <div className="glass-card rounded-full px-5 py-1.5">
            <p className="text-xs text-[var(--color-primary)]">
              Salut, <span className="font-black">{player.pseudo}</span>
            </p>
          </div>
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
