'use client';

import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/game/board-positions';
import type { QuestionCategory } from '@/lib/schemas/enums';
import { cn } from '@/lib/utils/cn';

interface Props {
  category: QuestionCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CATEGORY_NUMS: Record<QuestionCategory, string> = {
  debuter: '00',
  improbable: '01',
  plaisir: '02',
  scolaire: '03',
  mature: '04',
  intrepide: '05',
  final: '06',
  bonus: '07',
  malus: '08',
  challenge: '09',
};

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-[10px] gap-2',
  md: 'text-[11px] gap-2.5',
  lg: 'text-[13px] gap-3',
};

const dotSize: Record<NonNullable<Props['size']>, string> = {
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
};

export function CategoryBadge({ category, className, size = 'md' }: Props) {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const num = CATEGORY_NUMS[category];
  return (
    <div
      className={cn(
        'font-mono inline-flex items-center uppercase tracking-[0.18em] font-medium',
        sizeClasses[size],
        className,
      )}
      style={{ color: 'var(--color-ink)' }}
    >
      <span
        className={cn('inline-block rounded-sm', dotSize[size])}
        style={{ background: color }}
      />
      <span style={{ color: 'var(--color-ink-3)' }}>N°{num}</span>
      <span>{label}</span>
    </div>
  );
}
