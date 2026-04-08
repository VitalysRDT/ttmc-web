'use client';

import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import type { IntrepideQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: IntrepideQuestion;
  showAnswer?: boolean;
}

export function IntrepideQuestionCard({ question, showAnswer }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-3xl border-2 border-[var(--color-ttmc-intrepide)]/50 bg-[var(--color-ttmc-intrepide)]/5 backdrop-blur-xl p-6 w-full max-w-xl"
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category="intrepide" />
        <div className="text-xs tracking-[0.2em] text-[var(--color-ttmc-intrepide)]">
          DÉFI INTRÉPIDE
        </div>
      </div>

      <div className="text-xs tracking-[0.2em] text-[var(--color-primary)]">
        {question.theme}
      </div>

      {question.instruction && (
        <p className="text-white/80 italic">{question.instruction}</p>
      )}

      <ul className="flex flex-col gap-3">
        {question.subQuestions.map((sub, i) => (
          <li
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-ttmc-intrepide)]/30 font-bold text-white">
                {sub.letter}
              </span>
              <div className="flex-1">
                <p className="text-white">{sub.question}</p>
                {showAnswer && (
                  <p className="mt-2 text-sm text-[var(--color-primary)] font-semibold">
                    → {sub.answer}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
