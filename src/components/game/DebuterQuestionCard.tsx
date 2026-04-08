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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-strong relative flex flex-col gap-6 rounded-3xl p-8 w-full max-w-xl"
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category="debuter" />
        <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Qui commence ?
        </div>
      </div>

      <p className="text-xl leading-relaxed text-white font-light">{question.textePrincipal}</p>

      {showAnswer && question.texteSecondaire && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 p-5"
        >
          <div className="text-[10px] tracking-[0.3em] font-bold mb-2 uppercase text-[var(--color-primary)]">
            → En cas d'égalité
          </div>
          <p className="text-base text-white/90 italic">{question.texteSecondaire}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
