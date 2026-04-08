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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 w-full max-w-xl"
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category="debuter" />
        <div className="text-xs tracking-[0.2em] text-white/40">QUI COMMENCE ?</div>
      </div>

      <p className="text-xl leading-relaxed text-white">{question.textePrincipal}</p>

      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 p-5"
        >
          <div className="text-xs tracking-[0.2em] text-[var(--color-primary)] mb-2">
            RÉPONSE
          </div>
          <p className="text-lg text-white">{question.texteSecondaire}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
