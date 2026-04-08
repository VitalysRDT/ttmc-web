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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center gap-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 30px 10px rgba(255,215,0,0.3)',
                '0 0 60px 20px rgba(255,215,0,0.5)',
                '0 0 30px 10px rgba(255,215,0,0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="size-28 rounded-full bg-[var(--color-primary)] flex items-center justify-center border-4 border-white"
          >
            <span className="text-4xl font-black text-black">T²</span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-[0.3em] text-white">TTMC</h1>
          <p className="text-xs tracking-[0.5em] text-[var(--color-primary)]">
            LE GRAND QUIZ
          </p>
        </div>

        {/* Card */}
        <div className="w-full rounded-3xl border border-[var(--color-primary)]/30 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-center text-sm tracking-[0.2em] text-[var(--color-primary)] mb-6">
            QUI VA JOUER ?
          </h2>

          <form onSubmit={handleAnonymous} className="flex flex-col gap-4">
            <Input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value.toUpperCase())}
              placeholder="ENTREZ VOTRE NOM"
              maxLength={20}
              autoFocus
              disabled={loading}
              error={error}
            />
            <Button type="submit" size="lg" loading={loading}>
              ENTRER SUR LE PLATEAU
            </Button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
