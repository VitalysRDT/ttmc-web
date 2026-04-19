'use client';

import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import type { FinalQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: FinalQuestion;
  showAnswer?: boolean;
}

export function FinalQuestionCard({ question, showAnswer }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="paper-card p-8 w-full max-w-xl"
      style={{ borderColor: 'var(--color-accent)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <CategoryBadge category="final" />
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          · Question finale ·
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
          style={{ fontSize: 24, color: 'var(--color-accent)', fontWeight: 500 }}
        >
          {question.theme}
        </span>
      </div>

      <p
        className="font-serif"
        style={{
          margin: '22px 0 0',
          fontSize: 32,
          lineHeight: 1.25,
          color: 'var(--color-ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {question.question}
      </p>

      {question.options && question.options.length > 0 && (
        <ul
          style={{
            marginTop: 20,
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {question.options.map((opt, i) => (
            <li
              key={i}
              style={{
                padding: '10px 14px',
                border: '1px solid var(--color-rule)',
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  color: 'var(--color-ink-3)',
                  marginRight: 10,
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span
                className="font-serif"
                style={{ fontSize: 18 }}
              >
                {opt}
              </span>
            </li>
          ))}
        </ul>
      )}

      <hr className="rule" style={{ margin: '28px 0 18px' }} />

      {showAnswer ? (
        <div
          className="fade-up"
          style={{
            padding: 22,
            background: 'var(--color-accent-soft)',
            border: '1.5px solid var(--color-accent)',
          }}
        >
          <div className="kicker kicker-accent">→ Réponse officielle</div>
          <p
            className="font-serif"
            style={{
              margin: '6px 0 0',
              fontSize: 28,
              lineHeight: 1.3,
              fontWeight: 500,
            }}
          >
            {question.reponse}
          </p>
          {question.explication && (
            <p
              className="font-serif italic"
              style={{
                marginTop: 10,
                fontSize: 16,
                color: 'var(--color-ink-2)',
                lineHeight: 1.5,
              }}
            >
              {question.explication}
            </p>
          )}
        </div>
      ) : (
        <div
          className="font-mono"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            color: 'var(--color-ink-4)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span>Réponse masquée</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-rule)' }} />
          <span>DERNIÈRE ÉPREUVE</span>
        </div>
      )}
    </motion.div>
  );
}
