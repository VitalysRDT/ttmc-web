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
        whileHover={{ y: -2 }}
        onClick={onIncorrect}
        disabled={disabled}
        className="group flex-1 h-20 rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-red-500/15 to-red-500/5 text-red-400 font-black text-lg tracking-[0.15em] transition-all hover:border-red-500 hover:from-red-500/25 hover:to-red-500/10 hover:text-red-300 disabled:opacity-50 backdrop-blur-xl"
        style={{ boxShadow: '0 10px 30px rgba(239,68,68,0.15)' }}
      >
        <span className="flex items-center justify-center gap-3">
          <X size={28} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
          RATÉ
        </span>
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ y: -2 }}
        onClick={onCorrect}
        disabled={disabled}
        className="group flex-1 h-20 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 text-emerald-400 font-black text-lg tracking-[0.15em] transition-all hover:border-emerald-500 hover:from-emerald-500/25 hover:to-emerald-500/10 hover:text-emerald-300 disabled:opacity-50 backdrop-blur-xl"
        style={{ boxShadow: '0 10px 30px rgba(16,185,129,0.15)' }}
      >
        <span className="flex items-center justify-center gap-3">
          <Check size={28} strokeWidth={3} className="transition-transform group-hover:scale-125" />
          TROUVÉ
        </span>
      </motion.button>
    </div>
  );
}
