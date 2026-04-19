'use client';

import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import type { IntrepideQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: IntrepideQuestion;
  showAnswer?: boolean;
}

export function IntrepideQuestionCard({ question, showAnswer }: Props) {
  const isInstruction =
    question.variant === 'modifier' || question.variant === 'action';
  const badgeLabel =
    question.variant === 'action'
      ? '· Action ·'
      : question.variant === 'modifier'
        ? '· Règle ·'
        : '· Défi ·';
  const sectionLabel =
    question.variant === 'action' ? 'Détails' : 'En cas de mauvaise réponse';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="paper-card p-8 w-full max-w-xl"
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
            fontSize: 24,
            color: 'var(--color-cat-intrepide)',
            fontWeight: 500,
          }}
        >
          {question.theme}
          {question.type && isInstruction && ` — ${question.type}`}
        </span>
      </div>

      {question.instruction && (
        <p
          className="font-serif"
          style={{
            margin: '22px 0 0',
            fontSize: isInstruction ? 26 : 20,
            lineHeight: 1.3,
            color: 'var(--color-ink)',
            whiteSpace: 'pre-line',
            fontStyle: isInstruction ? 'normal' : 'italic',
          }}
        >
          {question.instruction}
        </p>
      )}

      {isInstruction && question.consequence && showAnswer && (
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
              fontSize: 18,
              lineHeight: 1.5,
              color: 'var(--color-ink-2)',
              whiteSpace: 'pre-line',
            }}
          >
            {question.consequence}
          </p>
        </div>
      )}

      {!isInstruction && question.subQuestions.length > 0 && (
        <ul
          style={{
            marginTop: 22,
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {question.subQuestions.map((sub, i) => (
            <li
              key={i}
              style={{
                padding: '12px 14px',
                border: '1px solid var(--color-rule)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              <span
                className="font-serif"
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: 'var(--color-cat-intrepide)',
                  minWidth: 26,
                  textAlign: 'center',
                }}
              >
                {sub.letter}
              </span>
              <div style={{ flex: 1 }}>
                {sub.question && (
                  <p
                    className="font-serif"
                    style={{
                      margin: 0,
                      fontSize: 17,
                      lineHeight: 1.4,
                      color: 'var(--color-ink)',
                    }}
                  >
                    {sub.question}
                  </p>
                )}
                {showAnswer && (
                  <p
                    className="font-serif italic"
                    style={{
                      margin: sub.question ? '6px 0 0' : 0,
                      fontSize: 16,
                      color: 'var(--color-accent)',
                      fontWeight: 500,
                    }}
                  >
                    → {sub.answer}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
