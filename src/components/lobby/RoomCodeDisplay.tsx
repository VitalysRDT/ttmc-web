'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface Props {
  roomCode: string;
}

export function RoomCodeDisplay({ roomCode }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard non disponible (HTTP, etc.)
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[10px] tracking-[0.4em] text-white/50 uppercase">
        Code de la partie
      </div>
      <motion.button
        onClick={handleCopy}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        className="group relative flex items-center gap-5 rounded-3xl border-2 border-[var(--color-primary)]/40 px-10 py-5 transition-all hover:border-[var(--color-primary)]"
        style={{
          background: 'linear-gradient(145deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
          boxShadow: '0 10px 40px rgba(255,215,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <span
          className="text-7xl font-black tracking-[0.15em] text-[var(--color-primary)]"
          style={{ textShadow: '0 0 30px rgba(255,215,0,0.4)' }}
        >
          {roomCode}
        </span>
        {copied ? (
          <Check size={28} className="text-emerald-400" strokeWidth={3} />
        ) : (
          <Copy
            size={26}
            className="text-white/30 transition-colors group-hover:text-white"
            strokeWidth={2.5}
          />
        )}
      </motion.button>
      <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
        {copied ? 'Copié dans le presse-papier' : 'Clique pour copier'}
      </div>
    </div>
  );
}
