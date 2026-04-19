'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

interface Props {
  startedAt: Date | null | undefined;
  duration?: number;
  onFinished?: () => void;
}

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

  const isHot = remaining <= 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'oklch(0.97 0.008 85 / 0.94)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            letterSpacing: '0.28em',
            color: 'var(--color-ink-3)',
            textTransform: 'uppercase',
          }}
        >
          LIS. RÉFLÉCHIS. RÉPONDS.
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={remaining}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 220 }}
            className="font-serif"
            style={{
              fontSize: 'clamp(180px, 24vw, 280px)',
              lineHeight: 0.8,
              fontWeight: 500,
              fontStyle: 'italic',
              color: isHot ? 'var(--color-accent)' : 'var(--color-ink)',
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {remaining}
          </motion.div>
        </AnimatePresence>
        <div
          style={{
            width: 240,
            height: 2,
            background: 'var(--color-rule)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(remaining / duration) * 100}%`,
              height: '100%',
              background: isHot
                ? 'var(--color-accent)'
                : 'var(--color-ink)',
              transition: 'width 1s linear',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
