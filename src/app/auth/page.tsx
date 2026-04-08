'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signInAnonymouslyWithPseudo } from '@/lib/api/client-actions';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function AuthPage() {
  const router = useRouter();
  const status = useAuthStatus();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    }
  }, [status, router]);

  const handleAnonymous = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = pseudo.trim();
    if (trimmed.length < 2) {
      setError('Entrez un pseudo d\'au moins 2 caractères');
      return;
    }
    setLoading(true);
    try {
      const player = await signInAnonymouslyWithPseudo(trimmed);
      setAuthenticated(player.id, player);
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md flex flex-col items-center gap-12"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-5">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 40px 10px rgba(255,215,0,0.35)',
                '0 0 80px 20px rgba(255,215,0,0.55)',
                '0 0 40px 10px rgba(255,215,0,0.35)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="relative size-32 rounded-full flex items-center justify-center border-[3px] border-white/80"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffe666, #c9a700)',
            }}
          >
            <span className="text-5xl font-black text-black" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>T²</span>
            <div className="absolute inset-0 rounded-full border border-white/20" />
          </motion.div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-5xl font-black tracking-[0.35em] text-white text-glow">TTMC</h1>
            <p className="text-[10px] tracking-[0.6em] text-[var(--color-primary)] font-semibold">
              LE GRAND QUIZ
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card-strong w-full rounded-3xl p-8">
          <h2 className="text-center text-[10px] tracking-[0.3em] text-[var(--color-primary)] font-bold mb-6 uppercase">
            Qui va jouer ?
          </h2>

          <form onSubmit={handleAnonymous} className="flex flex-col gap-5">
            <Input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value.toUpperCase())}
              placeholder="TON PSEUDO"
              maxLength={20}
              autoFocus
              disabled={loading}
              error={error}
            />
            <Button type="submit" size="lg" loading={loading}>
              Entrer sur le plateau
            </Button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
