'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { StandardQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: StandardQuestion;
  onConfirm: (difficulty: number) => void;
  disabled?: boolean;
}

const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function DifficultySelector({ question, onConfirm, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const available = new Set(
    Object.keys(question.questions)
      .map((k) => Number(k))
      .filter((d) => !Number.isNaN(d) && question.questions[String(d)] && question.answers[String(d)]),
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <h2 className="text-center text-sm tracking-[0.2em] text-white/60">
        CHOISIS TA DIFFICULTÉ
      </h2>

      <div className="grid grid-cols-5 gap-3 w-full">
        {DIFFICULTIES.map((d) => {
          const isAvailable = available.has(d);
          const isSelected = selected === d;
          return (
            <motion.button
              key={d}
              whileTap={isAvailable ? { scale: 0.92 } : undefined}
              onClick={() => isAvailable && !disabled && setSelected(d)}
              disabled={!isAvailable || disabled}
              className={cn(
                'aspect-square rounded-2xl border-2 text-2xl font-black transition-colors',
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-black scale-105'
                  : 'border-white/20 bg-white/5 text-white hover:border-white/50',
                !isAvailable && 'opacity-30 cursor-not-allowed',
              )}
            >
              {d}
            </motion.button>
          );
        })}
      </div>

      <Button
        size="lg"
        onClick={() => selected !== null && onConfirm(selected)}
        disabled={selected === null || disabled}
      >
        VALIDER
      </Button>
    </div>
  );
}
