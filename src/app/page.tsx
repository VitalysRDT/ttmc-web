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
    <main className="flex min-h-dvh items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="kicker">§ 00 · Préambule</div>
        <h1
          className="font-serif italic"
          style={{
            margin: 0,
            fontSize: 'clamp(56px, 10vw, 120px)',
            lineHeight: 0.9,
            fontWeight: 500,
            letterSpacing: '-0.03em',
          }}
        >
          Tu mises{' '}
          <span style={{ color: 'var(--color-accent)' }}>combien</span> ?
        </h1>
        <p
          className="font-mono"
          style={{
            fontSize: 12,
            letterSpacing: '0.3em',
            color: 'var(--color-ink-3)',
            textTransform: 'uppercase',
          }}
        >
          · Le grand quiz ·
        </p>
      </motion.div>
    </main>
  );
}
