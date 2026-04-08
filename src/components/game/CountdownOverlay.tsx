'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

interface Props {
  /** Timestamp serveur du début de la phase. */
  startedAt: Date | null | undefined;
  /** Durée du countdown en secondes (défaut: 5). */
  duration?: number;
  /** Appelé quand le countdown atteint 0. */
  onFinished?: () => void;
}

/**
 * Overlay plein écran qui affiche un compte à rebours synchronisé sur l'horloge serveur.
 *
 * Fix bug #1 : le CountdownOverlay Flutter reposait sur un bool local qui pouvait être
 * court-circuité par un re-render rapide. Ici, le compteur est purement dérivé de
 * `startedAt` (timestamp serveur), donc tous les joueurs voient le même countdown
 * et une transition de phase rapide ne peut pas le "sauter".
 */
export function CountdownOverlay({
  startedAt,
  duration = GAME_CONSTANTS.readCountdownSeconds,
  onFinished,
}: Props) {
  const remaining = useCountdown(startedAt, duration);

  if (!startedAt || remaining <= 0) {
    if (remaining <= 0 && onFinished) onFinished();
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={remaining}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 200 }}
          className="text-[12rem] font-black text-[var(--color-primary)]"
          style={{ textShadow: '0 0 60px rgba(255,215,0,0.6)' }}
        >
          {remaining}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
