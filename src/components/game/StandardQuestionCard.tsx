'use client';

import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import type { StandardQuestion } from '@/lib/schemas/question.schema';
import { CATEGORY_COLORS } from '@/lib/game/board-positions';

interface Props {
  question: StandardQuestion;
  difficulty: number;
  showAnswer?: boolean;
}

export function StandardQuestionCard({ question, difficulty, showAnswer }: Props) {
  const questionText = question.questions[String(difficulty)] ?? '';
  const answerText = question.answers[String(difficulty)] ?? '';
  const ranges = question.answerRanges?.[String(difficulty)];
  const alternates = question.alternateAnswers?.[String(difficulty)];
  const accent = CATEGORY_COLORS[question.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="paper-card w-full max-w-xl p-8"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <CategoryBadge category={question.category} />
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'var(--color-ink-3)',
            }}
          >
            CARTE
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'var(--color-paper)',
              background: 'var(--color-ink)',
              padding: '4px 8px',
            }}
          >
            NIVEAU {difficulty}/10
          </span>
        </div>
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
            fontSize: 26,
            color: accent,
            fontWeight: 500,
          }}
        >
          {question.theme}
        </span>
      </div>

      <p
        className="font-serif"
        style={{
          fontSize: 32,
          lineHeight: 1.25,
          fontWeight: 400,
          margin: '24px 0 0',
          color: 'var(--color-ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {questionText}
      </p>

      <hr className="rule" style={{ margin: '32px 0 20px' }} />

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
              fontSize: 26,
              lineHeight: 1.3,
              fontWeight: 500,
              color: 'var(--color-ink)',
            }}
          >
            {answerText}
          </p>
          {ranges && (
            <p
              className="font-mono"
              style={{
                marginTop: 10,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: 'var(--color-ink-2)',
                textTransform: 'uppercase',
              }}
            >
              Accepté · entre {ranges.min} et {ranges.max}
              {ranges.unit ? ` ${ranges.unit}` : ''}
            </p>
          )}
          {alternates && alternates.length > 0 && (
            <p
              className="font-mono"
              style={{
                marginTop: 6,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: 'var(--color-ink-2)',
                textTransform: 'uppercase',
              }}
            >
              Aussi accepté · {alternates.join(', ')}
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
          <span>R E S T E Z&nbsp;&nbsp;C A L M E</span>
        </div>
      )}
    </motion.div>
  );
}
