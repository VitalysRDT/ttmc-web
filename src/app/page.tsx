'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStatus } from '@/lib/hooks/useAuth';

export default function SplashPage() {
  const router = useRouter();
  const status = useAuthStatus();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    } else if (status === 'unauthenticated') {
      router.replace('/auth');
    }
  }, [status, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 30px 10px rgba(255,215,0,0.3)',
              '0 0 60px 20px rgba(255,215,0,0.5)',
              '0 0 30px 10px rgba(255,215,0,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="size-32 rounded-full bg-[var(--color-primary)] flex items-center justify-center border-4 border-white"
        >
          <span className="text-5xl font-black text-black">T²</span>
        </motion.div>
        <h1 className="text-5xl font-black tracking-[0.3em] text-white">TTMC</h1>
        <p className="text-sm tracking-[0.5em] text-[var(--color-primary)]">LE GRAND QUIZ</p>
      </motion.div>
    </main>
  );
}
