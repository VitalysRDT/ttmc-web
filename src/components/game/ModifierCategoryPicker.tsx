'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameActions } from '@/lib/hooks/useGameActions';
import type { QuestionCategory } from '@/lib/schemas/enums';
import type { PendingModifier } from '@/lib/schemas/game-state.schema';

interface Props {
  roomId: string;
  pending: PendingModifier;
  isCurrentPlayer: boolean;
  currentPlayerName: string;
}

type PickableCategory = 'improbable' | 'mature' | 'plaisir' | 'scolaire';

const CATEGORY_META: Record<
  PickableCategory,
  { title: string; subtitle: string; tone: string }
> = {
  improbable: {
    title: 'Improbable',
    subtitle: 'Culture et anecdotes rocambolesques',
    tone: 'var(--color-cat-improbable)',
  },
  mature: {
    title: 'Mature',
    subtitle: 'Thèmes adultes et sans filtre',
    tone: 'var(--color-cat-mature)',
  },
  plaisir: {
    title: 'Plaisir',
    subtitle: 'Sport, loisirs, pop culture',
    tone: 'var(--color-cat-plaisir)',
  },
  scolaire: {
    title: 'Scolaire',
    subtitle: 'Histoire, sciences, géographie',
    tone: 'var(--color-cat-scolaire)',
  },
};

export function ModifierCategoryPicker({
  roomId,
  pending,
  isCurrentPlayer,
  currentPlayerName,
}: Props) {
  const actions = useGameActions();
  const [submitting, setSubmitting] = useState<QuestionCategory | null>(null);

  const options: PickableCategory[] =
    pending.kind === 'ambition'
      ? ['mature', 'improbable']
      : ['improbable', 'mature', 'plaisir', 'scolaire'];

  const handleSelect = async (category: QuestionCategory) => {
    if (submitting || !isCurrentPlayer) return;
    setSubmitting(category);
    try {
      await actions.selectModifierCategory(roomId, category);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
      setSubmitting(null);
    }
  };

  const ruleLabel =
    pending.kind === 'ambition'
      ? 'Difficulté imposée · 4 à 10'
      : 'Difficulté imposée · 1/10';
  const title =
    pending.kind === 'ambition'
      ? 'Choisis un thème imposé'
      : 'Choisis librement ton thème';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="paper-card w-full max-w-xl p-8"
      style={{ borderColor: 'var(--color-cat-intrepide)' }}
    >
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.22em',
          color: 'var(--color-cat-intrepide)',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {pending.kind === 'ambition' ? '📜 AMBITION' : '📜 NIB'}
      </div>
      <h2
        className="font-serif italic"
        style={{
          margin: '6px 0 0',
          fontSize: 44,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {title}.
      </h2>
      <p
        className="font-mono"
        style={{
          marginTop: 8,
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'var(--color-ink-3)',
          textTransform: 'uppercase',
        }}
      >
        {ruleLabel}
      </p>

      <hr className="rule" style={{ margin: '22px 0' }} />

      {isCurrentPlayer ? (
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          {options.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isLoading = submitting === cat;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(cat)}
                disabled={submitting !== null}
                style={{
                  padding: 18,
                  textAlign: 'left',
                  background: 'var(--color-paper)',
                  border: `1.5px solid ${meta.tone}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  opacity: submitting !== null && !isLoading ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    className="font-serif italic"
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      color: meta.tone,
                    }}
                  >
                    {meta.title}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      color: 'var(--color-ink-3)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isLoading ? '…' : '→ Tirer'}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--color-ink-2)',
                    lineHeight: 1.4,
                  }}
                >
                  {meta.subtitle}
                </p>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <p
          className="font-serif italic"
          style={{
            fontSize: 18,
            color: 'var(--color-ink-3)',
          }}
        >
          {currentPlayerName} choisit son thème…
        </p>
      )}
    </motion.div>
  );
}
