'use client';

import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import type { StandardQuestion } from '@/lib/schemas/question.schema';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 w-full max-w-xl"
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category={question.category} />
        <div className="text-xs tracking-[0.2em] text-white/40">
          DIFFICULTÉ {difficulty}/10
        </div>
      </div>

      <div className="text-xs tracking-[0.2em] text-[var(--color-primary)]">
        {question.theme}
      </div>

      <p className="text-xl leading-relaxed text-white">{questionText}</p>

      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 rounded-2xl border-2 border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 p-5"
        >
          <div className="text-xs tracking-[0.2em] text-[var(--color-primary)] mb-2">
            RÉPONSE
          </div>
          <p className="text-2xl font-bold text-white">{answerText}</p>
          {ranges && (
            <p className="text-sm text-white/60 mt-2">
              Accepté : de {ranges.min} à {ranges.max}
              {ranges.unit && ` ${ranges.unit}`}
            </p>
          )}
          {alternates && alternates.length > 0 && (
            <p className="text-sm text-white/60 mt-2">
              Alternatives : {alternates.join(', ')}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
