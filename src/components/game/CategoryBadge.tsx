'use client';

import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/game/board-positions';
import type { QuestionCategory } from '@/lib/schemas/enums';
import { cn } from '@/lib/utils/cn';

interface Props {
  category: QuestionCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: Props) {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase',
        className,
      )}
      style={{
        backgroundColor: `${color}30`,
        color,
        border: `1px solid ${color}80`,
      }}
    >
      {label}
    </div>
  );
}
