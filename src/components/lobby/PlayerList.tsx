'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Crown } from 'lucide-react';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  players: Player[];
  hostId: string;
  maxPlayers: number;
}

const PLAYER_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#C7F464', '#B39BC8', '#F5A25D'];

export function PlayerList({ players, hostId, maxPlayers }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-white/50 uppercase">
        <span>Joueurs</span>
        <span>
          {players.length}/{maxPlayers}
        </span>
      </div>
      <AnimatePresence>
        {players.map((player, idx) => {
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length]!;
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="glass-card flex items-center gap-4 rounded-2xl px-5 py-4"
              style={
                player.isReady
                  ? {
                      boxShadow: `0 0 20px ${color}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
                      borderColor: `${color}55`,
                    }
                  : undefined
              }
            >
              <div
                className="size-12 rounded-full flex items-center justify-center text-lg font-black text-white border-2 border-white/30"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${color}, ${color}99)`,
                  boxShadow: `0 4px 12px ${color}55`,
                }}
              >
                {player.pseudo.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">{player.pseudo}</span>
                  {player.id === hostId && (
                    <Crown size={14} className="text-[var(--color-primary)] shrink-0" />
                  )}
                </div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-0.5">
                  {player.isReady ? 'Prêt à jouer' : 'En attente…'}
                </div>
              </div>
              <div
                className={`flex size-10 items-center justify-center rounded-full border ${
                  player.isReady
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-white/40'
                }`}
              >
                {player.isReady ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <Clock size={16} />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
