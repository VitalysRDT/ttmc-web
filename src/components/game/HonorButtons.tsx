'use client';

import { motion } from 'framer-motion';

interface Props {
  onCorrect: () => void;
  onIncorrect: () => void;
  disabled?: boolean;
  difficulty?: number;
}

export function HonorButtons({ onCorrect, onIncorrect, disabled, difficulty }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onCorrect}
        disabled={disabled}
        className="paper-card-raised"
        style={{
          padding: '22px 26px',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div>
          <div className="kicker">Réponse A</div>
          <div
            className="font-serif italic"
            style={{ fontSize: 38, fontWeight: 500, marginTop: 2 }}
          >
            Oui, juste.
          </div>
        </div>
        <div
          className="font-mono"
          style={{
            padding: '6px 12px',
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            fontSize: 11,
            letterSpacing: '0.16em',
          }}
        >
          {difficulty ? `+${difficulty} ${difficulty > 1 ? 'CASES' : 'CASE'}` : '✓ JUSTE'}
        </div>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onIncorrect}
        disabled={disabled}
        style={{
          padding: '20px 26px',
          textAlign: 'left',
          background: 'transparent',
          border: '1.5px solid var(--color-rule)',
          borderRadius: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div>
          <div className="kicker">Réponse B</div>
          <div
            className="font-serif italic"
            style={{
              fontSize: 32,
              fontWeight: 500,
              marginTop: 2,
              color: 'var(--color-ink-2)',
            }}
          >
            Non, tant pis.
          </div>
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'var(--color-ink-3)',
          }}
        >
          ±0 CASE
        </div>
      </motion.button>
    </div>
  );
}
