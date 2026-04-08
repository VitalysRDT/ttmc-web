'use client';

import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/game/board-positions';
import type { QuestionCategory } from '@/lib/schemas/enums';
import { cn } from '@/lib/utils/cn';

interface Props {
  category: QuestionCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CATEGORY_EMOJIS: Record<QuestionCategory, string> = {
  debuter: '🎬',
  improbable: '🌀',
  plaisir: '🎉',
  mature: '🍷',
  scolaire: '📚',
  intrepide: '🔥',
  final: '⭐',
  bonus: '🎁',
  malus: '💀',
  challenge: '⚡',
};

const sizeClasses = {
  sm: 'text-[10px] px-3 py-1 gap-1.5',
  md: 'text-xs px-4 py-1.5 gap-2',
  lg: 'text-sm px-5 py-2 gap-2.5',
};

export function CategoryBadge({ category, className, size = 'md' }: Props) {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const emoji = CATEGORY_EMOJIS[category];
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-bold tracking-[0.2em] uppercase backdrop-blur-md',
        sizeClasses[size],
        className,
      )}
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}66`,
        boxShadow: `0 0 20px ${color}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <span className="text-base">{emoji}</span>
      <span>{label}</span>
    </div>
  );
}
