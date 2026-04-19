'use client';

import { useState } from 'react';

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
      // ignore
    }
  };

  return (
    <div
      className="paper-card-raised"
      style={{
        display: 'inline-flex',
        padding: '24px 36px',
        gap: 28,
        alignItems: 'center',
      }}
    >
      <div>
        <div className="kicker kicker-ink">Code du salon</div>
        <div
          className="font-serif"
          style={{
            fontSize: 92,
            fontWeight: 500,
            letterSpacing: '0.1em',
            lineHeight: 1,
            color: 'var(--color-ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {roomCode}
        </div>
      </div>
      <div style={{ width: 1, height: 80, background: 'var(--color-rule)' }} />
      <button className="btn btn-ghost" onClick={handleCopy}>
        {copied ? 'Copié ✓' : 'Copier →'}
      </button>
    </div>
  );
}
