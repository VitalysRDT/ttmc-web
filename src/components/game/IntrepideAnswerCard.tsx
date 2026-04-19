'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function IntrepideAnswerCard({
  question,
  roomId,
  isCurrentPlayer,
  currentPlayerName,
}: Props) {
  const actions = useGameActions();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const total = question.subQuestions.length;
  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter(Boolean).length;
  const allAnswered = answered === total;
  const firstUnansweredIndex = question.subQuestions.findIndex(
    (sub) => answers[sub.letter] === undefined,
  );
  const currentIndex = firstUnansweredIndex === -1 ? total : firstUnansweredIndex;

  const handleMark = (letter: string, ok: boolean) => {
    if (!isCurrentPlayer || submitting) return;
    if (answers[letter] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [letter]: ok }));
  };

  const handleValidate = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    try {
      await actions.submitIntrepideAnswer(roomId, answers);
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
          · Défi ·
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
          className="font-serif italic"
          style={{
            margin: '18px 0 0',
            fontSize: 18,
            lineHeight: 1.4,
            color: 'var(--color-ink-2)',
            whiteSpace: 'pre-line',
          }}
        >
          {question.instruction}
        </p>
      )}

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
        {question.subQuestions.map((sub, index) => {
          const mark = answers[sub.letter];
          const isLocked = mark !== undefined;
          const isActive = index === currentIndex;
          const isMasked = index > currentIndex;
          const isCorrect = mark === true;
          const isWrong = mark === false;

          const borderColor = isCorrect
            ? 'oklch(0.55 0.13 155)'
            : isWrong
              ? 'oklch(0.55 0.2 25)'
              : isActive
                ? 'var(--color-cat-intrepide)'
                : 'var(--color-rule)';
          const bg = isCorrect
            ? 'oklch(0.92 0.05 155 / 0.4)'
            : isWrong
              ? 'oklch(0.92 0.06 25 / 0.35)'
              : 'var(--color-paper)';

          return (
            <motion.li
              key={sub.letter}
              layout
              animate={{ opacity: isMasked ? 0.55 : 1 }}
              transition={{ duration: 0.25 }}
              style={{
                padding: '14px 16px',
                border: `1.5px solid ${borderColor}`,
                background: bg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span
                  className="font-serif"
                  style={{
                    fontSize: 26,
                    fontWeight: 500,
                    color: 'var(--color-cat-intrepide)',
                    minWidth: 28,
                    textAlign: 'center',
                  }}
                >
                  {sub.letter}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                  <AnimatePresence initial={false}>
                    {(isLocked || isActive) && (
                      <motion.p
                        key="answer"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.25 }}
                        className="font-serif italic"
                        style={{
                          fontSize: 16,
                          color: 'var(--color-accent)',
                          fontWeight: 500,
                          overflow: 'hidden',
                        }}
                      >
                        → {sub.answer}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {isMasked && (
                    <div
                      className="font-mono"
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        color: 'var(--color-ink-4)',
                        textTransform: 'uppercase',
                      }}
                    >
                      🔒 Réponse masquée
                    </div>
                  )}
                </div>
              </div>

              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{ display: 'flex', gap: 8, marginTop: 12 }}
                >
                  <button
                    onClick={() => handleMark(sub.letter, false)}
                    disabled={!isCurrentPlayer || submitting}
                    className="btn btn-ghost"
                    style={{ flex: 1 }}
                  >
                    ✗ RATÉ
                  </button>
                  <button
                    onClick={() => handleMark(sub.letter, true)}
                    disabled={!isCurrentPlayer || submitting}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    ✓ TROUVÉ
                  </button>
                </motion.div>
              )}

              {isLocked && (
                <div
                  className="font-mono"
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: isCorrect
                      ? 'oklch(0.45 0.14 155)'
                      : 'oklch(0.5 0.2 25)',
                  }}
                >
                  {isCorrect ? '✓ Trouvé' : '✗ Raté'}
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>

      {isCurrentPlayer ? (
        <div
          style={{
            marginTop: 22,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'var(--color-ink-3)',
              textTransform: 'uppercase',
            }}
          >
            {answered}/{total} répondues · {correct} correcte{correct > 1 ? 's' : ''}
          </div>
          <Button
            variant="accent"
            size="lg"
            onClick={handleValidate}
            disabled={!allAnswered || submitting}
            loading={submitting}
          >
            VALIDER · +{correct} CASE{correct > 1 ? 'S' : ''}
          </Button>
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
          {currentPlayerName} répond…
        </p>
      )}
    </motion.div>
  );
}
