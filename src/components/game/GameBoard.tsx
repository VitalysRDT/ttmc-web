'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { SQUARE_CATEGORIES, CATEGORY_COLORS } from '@/lib/game/board-positions';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  players: Player[];
  playerPositions: Record<string, number>;
  currentPlayerId: string;
}

const PLAYER_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#C7F464', '#B39BC8', '#F5A25D'];
const COLS = 10;
const SNAKE_CASES = 50; // 0-49 en grille, case 50 = ligne d'arrivée dédiée

/**
 * Calcule la position grille d'une case dans un serpentin zigzag :
 * - ligne paire : gauche → droite (LTR)
 * - ligne impaire : droite → gauche (RTL)
 * Le flux passe de manière continue : ..., 9 (row 0 col 9), 10 (row 1 col 9), ...
 */
function snakeCell(index: number): { row: number; col: number } {
  const row = Math.floor(index / COLS);
  const col = row % 2 === 0 ? index % COLS : COLS - 1 - (index % COLS);
  return { row, col };
}

function getPlayerColor(players: Player[], player: Player): string {
  const idx = players.findIndex((p) => p.id === player.id);
  return PLAYER_COLORS[idx % PLAYER_COLORS.length]!;
}

export function GameBoard({ players, playerPositions, currentPlayerId }: Props) {
  const cells = Array.from({ length: SNAKE_CASES }, (_, i) => {
    const { row, col } = snakeCell(i);
    const category = SQUARE_CATEGORIES[i]!;
    const color = CATEGORY_COLORS[category];
    const playersHere = players.filter((p) => (playerPositions[p.id] ?? 0) === i);
    return { index: i, row, col, color, playersHere };
  });

  const playersOnFinish = players.filter((p) => (playerPositions[p.id] ?? 0) >= 50);

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--color-surface)] p-4 flex flex-col gap-4">
      {/* Snake grid 10×5 */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell) => {
          const isCurrentCase = cell.playersHere.some((p) => p.id === currentPlayerId);
          return (
            <div
              key={cell.index}
              style={{
                gridRow: cell.row + 1,
                gridColumn: cell.col + 1,
                backgroundColor: `${cell.color}35`,
                borderColor: cell.color,
              }}
              className={`relative aspect-square flex items-center justify-center rounded-full border text-[10px] font-bold text-white/70 ${
                isCurrentCase ? 'ring-2 ring-white shadow-lg shadow-white/20' : ''
              }`}
            >
              <span className="pointer-events-none">{cell.index}</span>
              {cell.playersHere.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {cell.playersHere.map((p, idx) => {
                    const pawnColor = getPlayerColor(players, p);
                    const offsetCount = cell.playersHere.length;
                    const offset = (idx - (offsetCount - 1) / 2) * 5;
                    return (
                      <motion.div
                        key={p.id}
                        layoutId={`pawn-${p.id}`}
                        transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                        className="absolute inset-0 m-auto size-3.5 rounded-full border-2 border-white shadow-md"
                        style={{
                          backgroundColor: pawnColor,
                          transform: `translate(${offset}px, ${offset}px)`,
                          zIndex: 10 + idx,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ligne d'arrivée (case 50) */}
      <div className="flex justify-center">
        <div className="relative flex items-center gap-3 rounded-full border-2 border-[var(--color-primary)] bg-gradient-to-r from-[var(--color-primary)]/25 via-[var(--color-primary)]/10 to-[var(--color-primary)]/25 px-5 py-2">
          <Star size={16} className="text-[var(--color-primary)] fill-[var(--color-primary)]" />
          <span className="text-xs font-black tracking-[0.15em] text-[var(--color-primary)]">
            50 — ARRIVÉE
          </span>
          <Star size={16} className="text-[var(--color-primary)] fill-[var(--color-primary)]" />
          {playersOnFinish.map((p, idx) => {
            const color = getPlayerColor(players, p);
            return (
              <motion.div
                key={p.id}
                layoutId={`pawn-${p.id}`}
                transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                className="absolute top-1/2 size-4 rounded-full border-2 border-white shadow-lg"
                style={{
                  backgroundColor: color,
                  right: `${-16 - idx * 14}px`,
                  transform: 'translateY(-50%)',
                  zIndex: 20 + idx,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Légende des couleurs par catégorie */}
      <div className="flex flex-wrap justify-center gap-2 pt-1 text-[9px] tracking-[0.1em] text-white/50">
        {(['improbable', 'plaisir', 'scolaire', 'mature', 'intrepide'] as const).map((cat) => (
          <div key={cat} className="flex items-center gap-1">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            />
            <span className="uppercase">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
