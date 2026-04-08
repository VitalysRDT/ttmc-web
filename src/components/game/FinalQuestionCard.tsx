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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-3xl border-2 border-[var(--color-ttmc-final)]/50 bg-[var(--color-ttmc-final)]/5 backdrop-blur-xl p-6 w-full max-w-xl"
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category="final" />
        <div className="text-xs tracking-[0.2em] text-[var(--color-ttmc-final)]">
          QUESTION FINALE
        </div>
      </div>

      <div className="text-xs tracking-[0.2em] text-[var(--color-primary)]">
        {question.theme}
      </div>

      <p className="text-2xl leading-relaxed text-white font-semibold">
        {question.question}
      </p>

      {question.options && question.options.length > 0 && (
        <ul className="flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <li
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}

      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 p-5"
        >
          <div className="text-xs tracking-[0.2em] text-[var(--color-primary)] mb-2">
            RÉPONSE
          </div>
          <p className="text-2xl font-bold text-white">{question.reponse}</p>
          {question.explication && (
            <p className="text-sm text-white/70 mt-3">{question.explication}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
