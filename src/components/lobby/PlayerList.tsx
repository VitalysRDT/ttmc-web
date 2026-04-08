'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Crown } from 'lucide-react';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  players: Player[];
  hostId: string;
  maxPlayers: number;
}

export function PlayerList({ players, hostId, maxPlayers }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-xs tracking-[0.2em] text-white/50">
        JOUEURS ({players.length}/{maxPlayers})
      </div>
      <AnimatePresence>
        {players.map((player) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div
              className={`size-10 rounded-full flex items-center justify-center font-bold ${
                player.isReady
                  ? 'bg-green-500/30 text-green-400'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {player.isReady ? <Check size={18} /> : <X size={18} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{player.pseudo}</span>
                {player.id === hostId && (
                  <Crown size={14} className="text-[var(--color-primary)]" />
                )}
              </div>
              <div className="text-xs text-white/40">
                {player.isReady ? 'Prêt' : 'En attente…'}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
