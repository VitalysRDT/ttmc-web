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
  /** Difficulté minimale autorisée (ex. 4 imposé par la carte AMBITION). */
  minDifficulty?: number;
  /** Difficulté maximale autorisée (ex. 10). */
  maxDifficulty?: number;
}

const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Couleur d'un niveau de difficulté : bleu froid (1) → jaune (5) → rouge chaud (10).
 */
function difficultyColor(d: number): string {
  if (d <= 3) return '#4fc3f7'; // bleu
  if (d <= 6) return '#66bb6a'; // vert
  if (d <= 8) return '#ff9800'; // orange
  return '#ef5350'; // rouge
}

export function DifficultySelector({
  question,
  onConfirm,
  disabled,
  minDifficulty = 1,
  maxDifficulty = 10,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const available = new Set(
    Object.keys(question.questions)
      .map((k) => Number(k))
      .filter(
        (d) =>
          !Number.isNaN(d) &&
          question.questions[String(d)] &&
          question.answers[String(d)] &&
          d >= minDifficulty &&
          d <= maxDifficulty,
      ),
  );
  const hasRestriction = minDifficulty > 1 || maxDifficulty < 10;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="text-center text-xs tracking-[0.3em] text-white/60 uppercase">
        Choisis ta difficulté
      </div>
      {hasRestriction && (
        <div className="-mt-2 rounded-full border border-[var(--color-ttmc-intrepide)]/40 bg-[var(--color-ttmc-intrepide)]/10 px-4 py-2 text-[10px] tracking-[0.2em] text-[var(--color-ttmc-intrepide)] uppercase font-bold">
          Règle imposée : {minDifficulty}-{maxDifficulty}
        </div>
      )}

      <div className="grid grid-cols-5 gap-3 w-full">
        {DIFFICULTIES.map((d) => {
          const isAvailable = available.has(d);
          const isSelected = selected === d;
          const color = difficultyColor(d);
          return (
            <motion.button
              key={d}
              whileTap={isAvailable ? { scale: 0.9 } : undefined}
              whileHover={isAvailable && !isSelected ? { scale: 1.05 } : undefined}
              onClick={() => isAvailable && !disabled && setSelected(d)}
              disabled={!isAvailable || disabled}
              className={cn(
                'relative aspect-square rounded-2xl text-2xl font-black transition-all duration-200',
                'border-2',
                !isAvailable && 'opacity-20 cursor-not-allowed',
              )}
              style={
                isSelected
                  ? {
                      background: `linear-gradient(145deg, ${color}ee, ${color}88)`,
                      borderColor: color,
                      color: '#fff',
                      boxShadow: `0 0 24px ${color}88, 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
                    }
                  : {
                      background: isAvailable ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      borderColor: isAvailable ? `${color}44` : 'rgba(255,255,255,0.05)',
                      color: isAvailable ? '#fff' : 'rgba(255,255,255,0.3)',
                    }
              }
            >
              {d}
              {isSelected && (
                <motion.div
                  layoutId="difficulty-glow"
                  className="absolute -inset-1 rounded-2xl -z-10 blur-xl"
                  style={{ backgroundColor: `${color}55` }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <Button
        size="lg"
        onClick={() => selected !== null && onConfirm(selected)}
        disabled={selected === null || disabled}
      >
        {selected !== null ? `Valider +${selected} case${selected > 1 ? 's' : ''}` : 'Valider'}
      </Button>
    </div>
  );
}
