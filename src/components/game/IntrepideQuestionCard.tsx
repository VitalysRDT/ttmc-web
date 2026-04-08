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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-strong relative flex flex-col gap-6 rounded-3xl border-2 border-[var(--color-ttmc-intrepide)]/40 p-8 w-full max-w-xl"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(239,83,80,0.2)' }}
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category="intrepide" />
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-ttmc-intrepide)] uppercase font-bold">
          🔥 Défi
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2">Thème</div>
        <div className="text-sm tracking-[0.1em] font-bold text-[var(--color-ttmc-intrepide)]">
          {question.theme}
        </div>
      </div>

      {question.instruction && (
        <p className="text-white/80 italic leading-relaxed">{question.instruction}</p>
      )}

      <ul className="flex flex-col gap-3">
        {question.subQuestions.map((sub, i) => (
          <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full font-black text-white"
                style={{
                  background: 'linear-gradient(145deg, #ef5350, #c62828)',
                  boxShadow: '0 4px 12px rgba(239,83,80,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                {sub.letter}
              </span>
              <div className="flex-1">
                <p className="text-white">{sub.question}</p>
                {showAnswer && (
                  <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
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
