'use client';

import { motion } from 'framer-motion';
import { SQUARE_CATEGORIES, CATEGORY_COLORS } from '@/lib/game/board-positions';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  players: Player[];
  playerPositions: Record<string, number>;
  currentPlayerId: string;
}

const PAWN_COLORS = [
  'var(--color-ink)',
  'var(--color-accent)',
  'var(--color-cat-scolaire)',
  'var(--color-cat-mature)',
  'var(--color-cat-improbable)',
  'var(--color-cat-final)',
];

const COLS = 10;
const ROWS = 5;
const TOTAL = 50;
const W = 800;
const H = 400;

function snakeCell(index: number): { row: number; col: number } {
  const row = Math.floor(index / COLS);
  const col = row % 2 === 0 ? index % COLS : COLS - 1 - (index % COLS);
  return { row, col };
}

function pawnColor(players: Player[], player: Player): string {
  const idx = players.findIndex((p) => p.id === player.id);
  return PAWN_COLORS[idx % PAWN_COLORS.length]!;
}

export function GameBoard({ players, playerPositions, currentPlayerId }: Props) {
  const cellW = W / COLS;
  const cellH = H / ROWS;

  const cells = Array.from({ length: TOTAL }, (_, i) => {
    const { row, col } = snakeCell(i);
    const cat = SQUARE_CATEGORIES[i]!;
    return { i, row, col, cat };
  });

  const pathD = cells
    .map((c, idx) => {
      const x = c.col * cellW + cellW / 2;
      const y = c.row * cellH + cellH / 2;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const currentPos = playerPositions[currentPlayerId] ?? 0;
  const playersOnFinish = players.filter((p) => (playerPositions[p.id] ?? 0) >= 50);

  return (
    <div className="paper-card p-7 w-full">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="kicker">Plateau · 50 cases</div>
          <div
            className="font-serif italic"
            style={{ fontSize: 28, fontWeight: 500 }}
          >
            Le parcours
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {(['improbable', 'plaisir', 'scolaire', 'mature', 'intrepide'] as const).map(
            (c) => (
              <div
                key={c}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: CATEGORY_COLORS[c],
                    borderRadius: 2,
                  }}
                />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: 'var(--color-ink-3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {c}
                </span>
              </div>
            ),
          )}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${W} / ${H}`,
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {Array.from({ length: ROWS - 1 }, (_, i) => (
            <line
              key={'h' + i}
              x1="0"
              y1={(i + 1) * cellH}
              x2={W}
              y2={(i + 1) * cellH}
              stroke="var(--color-rule)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          ))}
          {Array.from({ length: COLS - 1 }, (_, i) => (
            <line
              key={'v' + i}
              x1={(i + 1) * cellW}
              y1="0"
              x2={(i + 1) * cellW}
              y2={H}
              stroke="var(--color-rule)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          ))}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        </svg>

        {cells.map((c) => {
          const x = c.col * cellW + cellW / 2;
          const y = c.row * cellH + cellH / 2;
          const here = players.filter((p) => (playerPositions[p.id] ?? 0) === c.i);
          const isHighlight = c.i === currentPos;
          return (
            <div
              key={c.i}
              style={{
                position: 'absolute',
                left: `${(x / W) * 100}%`,
                top: `${(y / H) * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: `${((cellW * 0.78) / W) * 100}%`,
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isHighlight
                  ? 'var(--color-ink)'
                  : 'var(--color-paper)',
                color: isHighlight
                  ? 'var(--color-paper)'
                  : 'var(--color-ink)',
                border: `1.5px solid ${
                  isHighlight ? 'var(--color-accent)' : 'var(--color-ink)'
                }`,
                borderRadius: '50%',
                boxShadow: isHighlight
                  ? '0 0 0 4px var(--color-accent-soft)'
                  : 'none',
              }}
            >
              <span
                className="font-serif"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {c.i}
              </span>
              <span
                style={{
                  position: 'absolute',
                  bottom: 4,
                  width: 8,
                  height: 2,
                  background: CATEGORY_COLORS[c.cat],
                  borderRadius: 1,
                  opacity: 0.8,
                }}
              />
              {here.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    display: 'flex',
                  }}
                >
                  {here.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      layoutId={`pawn-${p.id}`}
                      transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: pawnColor(players, p),
                        border: '2px solid var(--color-paper)',
                        boxShadow: '0 0 0 1.5px var(--color-ink)',
                        marginLeft: idx === 0 ? 0 : -4,
                        zIndex: 10 + idx,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Arrivée (50) marker */}
        <div
          className="font-mono"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            transform: 'translate(24%, 36%)',
            background: 'var(--color-accent)',
            color: 'var(--color-paper)',
            padding: '8px 14px',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            border: '1px solid var(--color-ink)',
            boxShadow: '3px 3px 0 var(--color-ink)',
            borderRadius: 2,
          }}
        >
          50 · Arrivée
          {playersOnFinish.length > 0 && (
            <span style={{ marginLeft: 8 }}>
              ·{' '}
              {playersOnFinish.map((p) => (
                <motion.span
                  key={p.id}
                  layoutId={`pawn-${p.id}`}
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: pawnColor(players, p),
                    border: '1.5px solid var(--color-paper)',
                    marginLeft: 4,
                    verticalAlign: 'middle',
                  }}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard pill row */}
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {players.map((p) => {
          const pos = playerPositions[p.id] ?? 0;
          const isCurrent = p.id === currentPlayerId;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 12px',
                border: `1px solid ${
                  isCurrent ? 'var(--color-accent)' : 'var(--color-rule)'
                }`,
                background: isCurrent
                  ? 'var(--color-accent-soft)'
                  : 'transparent',
                borderRadius: 999,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: pawnColor(players, p),
                  borderRadius: '50%',
                  border: '1.5px solid var(--color-ink)',
                }}
              />
              <span className="font-serif italic" style={{ fontSize: 15 }}>
                {p.pseudo}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: 'var(--color-ink-3)',
                  letterSpacing: '0.1em',
                }}
              >
                {String(pos).padStart(2, '0')}/50
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
