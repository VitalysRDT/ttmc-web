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
      // Clipboard non disponible (HTTP, etc.) — ignore silencieusement
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs tracking-[0.3em] text-white/50">CODE DE LA PARTIE</div>
      <motion.button
        onClick={handleCopy}
        whileTap={{ scale: 0.96 }}
        className="group flex items-center gap-4 rounded-2xl border border-[var(--color-primary)]/30 bg-white/5 px-8 py-4 hover:bg-white/10 transition-colors"
      >
        <span className="text-6xl font-black tracking-[0.3em] text-[var(--color-primary)]">
          {roomCode}
        </span>
        {copied ? (
          <Check size={24} className="text-green-400" />
        ) : (
          <Copy size={24} className="text-white/40 group-hover:text-white" />
        )}
      </motion.button>
    </div>
  );
}
