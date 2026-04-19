'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CATEGORY_LABELS } from '@/lib/game/board-positions';
import type { StandardQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: StandardQuestion;
  onConfirm: (difficulty: number) => void;
  disabled?: boolean;
  minDifficulty?: number;
  maxDifficulty?: number;
}

const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function difficultyColor(d: number): string {
  if (d <= 3) return 'oklch(0.58 0.12 235)';
  if (d <= 6) return 'oklch(0.58 0.12 155)';
  if (d <= 8) return 'oklch(0.66 0.14 55)';
  return 'var(--color-accent)';
}

const BANDS = [
  { r: '1 → 3', t: 'Facile', c: 'oklch(0.58 0.12 235)' },
  { r: '4 → 6', t: 'Standard', c: 'oklch(0.58 0.12 155)' },
  { r: '7 → 8', t: 'Ardu', c: 'oklch(0.66 0.14 55)' },
  { r: '9 → 10', t: 'Cruel', c: 'var(--color-accent)' },
];

export function DifficultySelector({
  question,
  onConfirm,
  disabled,
  minDifficulty = 1,
  maxDifficulty = 10,
}: Props) {
  const [value, setValue] = useState<number | null>(null);

  const available = new Set(
    Object.keys(question.questions)
      .map((k) => Number(k))
      .filter(
        (d) =>
          !Number.isNaN(d) &&
          question.questions[String(d)] &&
          question.answers[String(d)] &&
          d >= minDifficulty &&
          d <= maxDifficulty,
      ),
  );
  const hasRestriction = minDifficulty > 1 || maxDifficulty < 10;
  const categoryLabel =
    CATEGORY_LABELS[question.category as keyof typeof CATEGORY_LABELS] ??
    question.category;

  return (
    <div className="paper-card p-9 w-full max-w-[880px]">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 12,
              height: 12,
              background: `var(--color-cat-${question.category})`,
              borderRadius: 2,
            }}
          />
          <span
            className="font-mono"
            style={{
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{ color: 'var(--color-ink-3)', marginRight: 8 }}
            >
              N°
            </span>
            {categoryLabel}
          </span>
        </div>
        <div className="kicker">Thème · {question.theme}</div>
      </div>

      <hr className="rule" style={{ margin: '28px 0 20px' }} />

      <div className="kicker kicker-ink">La question</div>
      <h2
        className="font-serif italic"
        style={{
          margin: '8px 0 32px',
          fontWeight: 500,
          fontSize: 'clamp(40px, 6vw, 64px)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: 'var(--color-ink)',
        }}
      >
        Tu mises combien&nbsp;?
      </h2>

      {hasRestriction && (
        <div
          className="font-mono"
          style={{
            display: 'inline-block',
            marginBottom: 24,
            padding: '6px 12px',
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)',
            borderRadius: 999,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Règle imposée · mise entre {minDifficulty} et {maxDifficulty}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          marginBottom: 36,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            border: '2px solid var(--color-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: value
              ? 'var(--color-paper)'
              : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          {value ? (
            <>
              <div
                className="font-serif"
                style={{
                  fontSize: 160,
                  lineHeight: 0.9,
                  fontWeight: 500,
                  color: difficultyColor(value),
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.04em',
                }}
              >
                {value}
              </div>
              <div
                className="font-mono"
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  color: 'var(--color-ink-3)',
                }}
              >
                CASES MISÉES
              </div>
            </>
          ) : (
            <div
              className="font-serif italic"
              style={{
                fontSize: 20,
                color: 'var(--color-ink-4)',
                textAlign: 'center',
                padding: 20,
              }}
            >
              choisis
              <br />
              ta mise
              <br />
              ci-dessous
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <p
            className="font-serif italic"
            style={{
              fontSize: 20,
              lineHeight: 1.4,
              color: 'var(--color-ink-2)',
              margin: '0 0 20px',
              maxWidth: 460,
            }}
          >
            Plus tu mises haut, plus la question sera dure. Si tu réponds juste,
            tu avances d&apos;autant de cases. Sinon, tu restes sur place.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 22,
              flexWrap: 'wrap',
            }}
          >
            {BANDS.map((t) => (
              <div key={t.t}>
                <div
                  style={{
                    width: 24,
                    height: 3,
                    background: t.c,
                    marginBottom: 6,
                  }}
                />
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    color: 'var(--color-ink)',
                  }}
                >
                  {t.r}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: 'var(--color-ink-3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.t}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 10,
          }}
        >
          <span className="kicker">Mise</span>
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              color: 'var(--color-ink-3)',
              letterSpacing: '0.14em',
            }}
          >
            01 ← PEINARD · TÉMÉRAIRE → 10
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 6,
          }}
        >
          {DIFFICULTIES.map((d) => {
            const isAvailable = available.has(d);
            const isSelected = value === d;
            const c = difficultyColor(d);
            return (
              <button
                key={d}
                disabled={!isAvailable || disabled}
                onClick={() => setValue(d)}
                style={{
                  position: 'relative',
                  height: 82,
                  background: isSelected ? c : 'var(--color-paper)',
                  border: `1.5px solid ${
                    isSelected ? c : 'var(--color-ink)'
                  }`,
                  color: isSelected
                    ? 'var(--color-paper)'
                    : 'var(--color-ink)',
                  cursor: isAvailable && !disabled ? 'pointer' : 'not-allowed',
                  opacity: isAvailable ? 1 : 0.25,
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: isSelected ? '4px 4px 0 var(--color-ink)' : 'none',
                  transform: isSelected ? 'translate(-2px,-2px)' : 'none',
                  borderRadius: 2,
                }}
              >
                <span
                  className="font-serif"
                  style={{
                    fontSize: 26,
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {d}
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: 9, letterSpacing: '0.14em' }}
                >
                  +{d} {d === 1 ? 'CASE' : 'CASES'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'var(--color-ink-3)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          La difficulté ne sera révélée qu&apos;après la validation.
        </span>
        <Button
          variant="accent"
          size="lg"
          disabled={value === null || disabled}
          onClick={() => value !== null && onConfirm(value)}
        >
          Je mise {value ? `${value} case${value > 1 ? 's' : ''}` : ''} · lancer la question →
        </Button>
      </div>
    </div>
  );
}
