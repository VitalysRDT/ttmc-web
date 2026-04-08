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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-strong relative flex flex-col gap-6 rounded-3xl p-8 w-full max-w-xl"
      style={{
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      {/* Accent coloré top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full blur-sm"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-center justify-between">
        <CategoryBadge category={question.category} />
        <div className="flex items-center gap-2">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
          />
          <div className="text-xs tracking-[0.2em] text-white/50">
            NIVEAU {difficulty}/10
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2">Thème</div>
        <div className="text-sm tracking-[0.1em] font-bold" style={{ color: accent }}>
          {question.theme}
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <p className="text-xl leading-relaxed text-white font-light">{questionText}</p>

      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative rounded-2xl border-2 p-5"
          style={{
            borderColor: `${accent}80`,
            background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
            boxShadow: `0 0 30px ${accent}33, inset 0 1px 0 ${accent}33`,
          }}
        >
          <div
            className="text-[10px] tracking-[0.3em] font-bold mb-2 uppercase"
            style={{ color: accent }}
          >
            → Réponse
          </div>
          <p className="text-2xl font-bold text-white leading-snug">{answerText}</p>
          {ranges && (
            <p className="text-xs text-white/60 mt-3 italic">
              Accepté : entre {ranges.min} et {ranges.max}
              {ranges.unit ? ` ${ranges.unit}` : ''}
            </p>
          )}
          {alternates && alternates.length > 0 && (
            <p className="text-xs text-white/60 mt-2 italic">
              Aussi accepté : {alternates.join(', ')}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
