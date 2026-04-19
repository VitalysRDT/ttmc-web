'use client';

import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  players: Player[];
  hostId: string;
  maxPlayers: number;
  onToggleReady?: (playerId: string) => void;
  currentPlayerId?: string;
}

const PAWN_COLORS = [
  'var(--color-ink)',
  'var(--color-accent)',
  'var(--color-cat-scolaire)',
  'var(--color-cat-mature)',
  'var(--color-cat-improbable)',
  'var(--color-cat-final)',
];

export function PlayerList({
  players,
  hostId,
  maxPlayers,
  onToggleReady,
  currentPlayerId,
}: Props) {
  const readyCount = players.filter((p) => p.isReady).length;
  const emptyCount = Math.max(0, maxPlayers - players.length);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
        }}
      >
        <div className="kicker">
          Joueurs · {players.length}/{maxPlayers}
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'var(--color-ink-3)',
            letterSpacing: '0.14em',
          }}
        >
          {readyCount}/{players.length} PRÊTS
        </div>
      </div>
      <hr className="rule-thick" />

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {players.map((p, i) => {
          const pawn = PAWN_COLORS[i % PAWN_COLORS.length];
          const isSelf = p.id === currentPlayerId;
          return (
            <li
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 4px',
                borderBottom: '1px solid var(--color-rule)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--color-ink-4)',
                    width: 24,
                    letterSpacing: '0.1em',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    background: pawn,
                    borderRadius: '50%',
                    border: '1.5px solid var(--color-ink)',
                  }}
                />
                <span
                  className="font-serif italic"
                  style={{ fontSize: 24, fontWeight: 500 }}
                >
                  {p.pseudo}
                </span>
                {p.id === hostId && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.16em',
                      border: '1px solid var(--color-ink)',
                      padding: '2px 6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Hôte
                  </span>
                )}
              </div>
              <button
                onClick={() => onToggleReady && isSelf && onToggleReady(p.id)}
                disabled={!isSelf}
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  padding: '6px 10px',
                  background: p.isReady
                    ? 'var(--color-ink)'
                    : 'var(--color-paper)',
                  color: p.isReady
                    ? 'var(--color-paper)'
                    : 'var(--color-ink-3)',
                  border: `1px solid ${
                    p.isReady ? 'var(--color-ink)' : 'var(--color-rule)'
                  }`,
                  borderRadius: 999,
                  cursor: isSelf ? 'pointer' : 'default',
                  textTransform: 'uppercase',
                }}
              >
                {p.isReady ? '✓ Prêt·e' : 'En attente'}
              </button>
            </li>
          );
        })}

        {Array.from({ length: emptyCount }, (_, i) => (
          <li
            key={'empty' + i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '18px 4px',
              borderBottom: '1px solid var(--color-rule)',
              color: 'var(--color-ink-4)',
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: 11, width: 24, letterSpacing: '0.1em' }}
            >
              {String(players.length + i + 1).padStart(2, '0')}
            </span>
            <span
              style={{
                width: 14,
                height: 14,
                border: '1.5px dashed var(--color-ink-4)',
                borderRadius: '50%',
              }}
            />
            <span
              className="font-serif italic"
              style={{ fontSize: 22, fontWeight: 400 }}
            >
              place libre…
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
