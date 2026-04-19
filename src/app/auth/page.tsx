'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
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
      setError("Entre un pseudo d'au moins 2 caractères");
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
    <main className="flex min-h-dvh items-center justify-center px-6 py-16 md:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[560px]"
      >
        <div className="kicker mb-7">§ 01 · Préambule</div>
        <h1
          className="font-serif italic"
          style={{
            margin: '0 0 8px 0',
            fontWeight: 500,
            fontSize: 'clamp(56px, 9vw, 96px)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
          }}
        >
          On commence
          <br />
          par ton <span style={{ color: 'var(--color-accent)' }}>pseudo</span>.
        </h1>
        <p
          className="mt-4"
          style={{
            color: 'var(--color-ink-3)',
            fontSize: 17,
            lineHeight: 1.55,
            maxWidth: 460,
          }}
        >
          Pas d&apos;email, pas de mot de passe. Tu choisis un nom, on te garde au
          chaud pour la partie. Tu peux le changer plus tard si tu regrettes.
        </p>

        <hr className="rule" style={{ margin: '40px 0 28px' }} />

        <form onSubmit={handleAnonymous} className="flex flex-col">
          <label className="kicker" style={{ display: 'block', marginBottom: 8 }}>
            Ton pseudo
          </label>
          <input
            className="editorial-input"
            placeholder="ex. Margaux la téméraire"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={24}
            autoFocus
            disabled={loading}
          />
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              color: 'var(--color-ink-4)',
              marginTop: 6,
              letterSpacing: '0.1em',
            }}
          >
            {pseudo.length}/24 · lettres, chiffres, accents bienvenus
          </div>

          {error && (
            <div
              className="font-mono"
              style={{
                marginTop: 14,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: 'oklch(0.55 0.2 25)',
                textTransform: 'uppercase',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginTop: 40, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!pseudo.trim()}
              loading={loading}
            >
              Entrer dans le salon →
            </Button>
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                color: 'var(--color-ink-3)',
                letterSpacing: '0.14em',
              }}
            >
              OU APPUIE SUR ENTRÉE
            </span>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
