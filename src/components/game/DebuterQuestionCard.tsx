'use client';

import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import type { DebuterQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: DebuterQuestion;
  showAnswer?: boolean;
}

export function DebuterQuestionCard({ question, showAnswer }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="paper-card p-8 w-full max-w-xl"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <CategoryBadge category="debuter" />
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.18em',
            color: 'var(--color-ink-3)',
            textTransform: 'uppercase',
          }}
        >
          Qui commence ?
        </span>
      </div>
      <hr className="rule-thick" />

      <p
        className="font-serif"
        style={{
          margin: '22px 0 0',
          fontSize: 28,
          lineHeight: 1.3,
          color: 'var(--color-ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {question.textePrincipal}
      </p>

      {showAnswer && question.texteSecondaire && (
        <div
          className="fade-up"
          style={{
            marginTop: 22,
            padding: 20,
            background: 'var(--color-accent-soft)',
            border: '1.5px solid var(--color-accent)',
          }}
        >
          <div className="kicker kicker-accent">→ En cas d&apos;égalité</div>
          <p
            className="font-serif italic"
            style={{
              marginTop: 6,
              fontSize: 20,
              lineHeight: 1.4,
              color: 'var(--color-ink)',
            }}
          >
            {question.texteSecondaire}
          </p>
        </div>
      )}
    </motion.div>
  );
}
