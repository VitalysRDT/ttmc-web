'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { joinRoomByCode } from '@/lib/api/client-actions';

export function JoinRoomDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);
    if (!/^\d{4}$/.test(code)) {
      setError('Le code doit contenir 4 chiffres.');
      return;
    }
    setLoading(true);
    try {
      await joinRoomByCode(code);
      router.push(`/lobby/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la jointure');
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="lg" variant="secondary" onClick={() => setOpen(true)}>
        REJOINDRE
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-[var(--color-primary)]/30 bg-[var(--color-surface)] p-8 shadow-2xl"
            >
              <h2 className="text-center text-sm tracking-[0.2em] text-[var(--color-primary)] mb-6">
                CODE DE LA PARTIE
              </h2>
              <div className="flex flex-col gap-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  autoFocus
                  error={error}
                  disabled={loading}
                />
                <Button size="lg" onClick={handleJoin} loading={loading}>
                  REJOINDRE
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
