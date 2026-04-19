'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CategoryBadge } from './CategoryBadge';
import { useGameActions } from '@/lib/hooks/useGameActions';
import type { IntrepideQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: IntrepideQuestion;
  roomId: string;
  isCurrentPlayer: boolean;
  currentPlayerName: string;
}

export function IntrepideInstructionCard({
  question,
  roomId,
  isCurrentPlayer,
  currentPlayerName,
}: Props) {
  const actions = useGameActions();
  const [submitting, setSubmitting] = useState(false);

  const badgeLabel = question.variant === 'action' ? '⚡ Action' : '📜 Règle';
  const sectionLabel =
    question.variant === 'action' ? 'Détails' : 'En cas de mauvaise réponse';

  const handleValidate = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await actions.submitIntrepideAnswer(roomId, {});
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="paper-card w-full max-w-xl p-8"
      style={{ borderColor: 'var(--color-cat-intrepide)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <CategoryBadge category="intrepide" />
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'var(--color-cat-intrepide)',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {badgeLabel}
        </span>
      </div>
      <hr className="rule-thick" />

      <div
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <span className="kicker">Thème</span>
        <span
          className="font-serif italic"
          style={{
            fontSize: 22,
            color: 'var(--color-cat-intrepide)',
            fontWeight: 500,
          }}
        >
          {question.theme}
          {question.type && ` — ${question.type}`}
        </span>
      </div>

      {question.instruction && (
        <p
          className="font-serif"
          style={{
            margin: '22px 0 0',
            fontSize: 22,
            lineHeight: 1.35,
            color: 'var(--color-ink)',
            whiteSpace: 'pre-line',
          }}
        >
          {question.instruction}
        </p>
      )}

      {question.consequence && (
        <div
          style={{
            marginTop: 22,
            padding: 20,
            border: '1px solid var(--color-cat-intrepide)',
            background: 'var(--color-paper)',
          }}
        >
          <div
            className="kicker"
            style={{ color: 'var(--color-cat-intrepide)' }}
          >
            → {sectionLabel}
          </div>
          <p
            className="font-serif italic"
            style={{
              marginTop: 6,
              fontSize: 17,
              lineHeight: 1.5,
              color: 'var(--color-ink-2)',
              whiteSpace: 'pre-line',
            }}
          >
            {question.consequence}
          </p>
        </div>
      )}

      {isCurrentPlayer ? (
        <div
          style={{
            marginTop: 26,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Button
            variant="accent"
            size="lg"
            onClick={handleValidate}
            disabled={submitting}
            loading={submitting}
          >
            {question.variant === 'modifier'
              ? 'APPLIQUER LA RÈGLE →'
              : 'VALIDER — TOUR SUIVANT'}
          </Button>
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              color: 'var(--color-ink-4)',
              textTransform: 'uppercase',
            }}
          >
            {question.variant === 'action'
              ? "Appliquez l'action ensemble"
              : 'La règle sera appliquée immédiatement'}
          </p>
        </div>
      ) : (
        <p
          className="font-serif italic"
          style={{
            marginTop: 22,
            textAlign: 'center',
            fontSize: 18,
            color: 'var(--color-ink-3)',
          }}
        >
          {currentPlayerName} applique la carte…
        </p>
      )}
    </motion.div>
  );
}
