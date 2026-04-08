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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-strong relative flex flex-col gap-6 rounded-3xl border-2 border-[var(--color-ttmc-final)]/40 p-8 w-full max-w-xl"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,215,0,0.25)' }}
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category="final" />
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-primary)] uppercase font-bold">
          ⭐ Question finale
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2">Thème</div>
        <div className="text-sm tracking-[0.1em] font-bold text-[var(--color-primary)]">
          {question.theme}
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <p className="text-2xl leading-relaxed text-white font-semibold">{question.question}</p>

      {question.options && question.options.length > 0 && (
        <ul className="flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <li
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur-sm"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}

      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border-2 border-[var(--color-primary)]/60 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 p-5"
          style={{ boxShadow: '0 0 30px rgba(255,215,0,0.25)' }}
        >
          <div className="text-[10px] tracking-[0.3em] font-bold mb-2 uppercase text-[var(--color-primary)]">
            → Réponse
          </div>
          <p className="text-2xl font-bold text-white">{question.reponse}</p>
          {question.explication && (
            <p className="text-sm text-white/70 mt-3 italic">{question.explication}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
