'use client';

import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onCorrect: () => void;
  onIncorrect: () => void;
  disabled?: boolean;
}

export function HonorButtons({ onCorrect, onIncorrect, disabled }: Props) {
  return (
    <div className="flex gap-4 w-full max-w-md">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onIncorrect}
        disabled={disabled}
        className="flex-1 h-20 rounded-3xl border-2 border-red-500/50 bg-red-500/10 text-red-400 font-black text-xl tracking-[0.1em] transition-colors hover:bg-red-500/20 disabled:opacity-50"
      >
        <span className="flex items-center justify-center gap-2">
          <X size={32} />
          RATÉ
        </span>
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onCorrect}
        disabled={disabled}
        className="flex-1 h-20 rounded-3xl border-2 border-green-500/50 bg-green-500/10 text-green-400 font-black text-xl tracking-[0.1em] transition-colors hover:bg-green-500/20 disabled:opacity-50"
      >
        <span className="flex items-center justify-center gap-2">
          <Check size={32} />
          TROUVÉ
        </span>
      </motion.button>
    </div>
  );
}
