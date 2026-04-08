'use client';

import { motion } from 'framer-motion';
import {
  SQUARE_POSITIONS,
  SQUARE_CATEGORIES,
  CATEGORY_COLORS,
  TOTAL_SQUARES,
} from '@/lib/game/board-positions';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  players: Player[];
  playerPositions: Record<string, number>;
  currentPlayerId: string;
}

const PLAYER_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#C7F464', '#B39BC8', '#F5A25D'];

/**
 * Plateau 51 cases. Version compacte : chaque case a sa couleur de catégorie,
 * les pions sont positionnés absolument via `SQUARE_POSITIONS` (% 0-1).
 */
export function GameBoard({ players, playerPositions, currentPlayerId }: Props) {
  return (
    <div className="relative aspect-square w-full max-w-xl rounded-3xl border border-white/10 bg-[var(--color-surface)] overflow-hidden">
      {/* Cases */}
      {Array.from({ length: TOTAL_SQUARES }, (_, i) => {
        const pos = SQUARE_POSITIONS[i];
        const category = SQUARE_CATEGORIES[i];
        if (!pos || !category) return null;
        const color = CATEGORY_COLORS[category];
        return (
          <div
            key={i}
            className="absolute flex size-8 items-center justify-center rounded-full border text-[10px] font-bold text-white shadow-md"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: `${color}40`,
              borderColor: color,
            }}
          >
            {i}
          </div>
        );
      })}

      {/* Pions */}
      {players.map((player, index) => {
        const position = playerPositions[player.id] ?? 0;
        const coords = SQUARE_POSITIONS[Math.min(position, TOTAL_SQUARES - 1)];
        if (!coords) return null;
        const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        const offset = index * 0.02;
        return (
          <motion.div
            key={player.id}
            initial={false}
            animate={{
              left: `${(coords.x + offset) * 100}%`,
              top: `${(coords.y - offset) * 100}%`,
              scale: player.id === currentPlayerId ? 1.2 : 1,
            }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            className="absolute size-6 rounded-full border-2 border-white shadow-lg"
            style={{
              backgroundColor: color,
              transform: 'translate(-50%, -50%)',
              zIndex: 10 + index,
            }}
          />
        );
      })}
    </div>
  );
}
