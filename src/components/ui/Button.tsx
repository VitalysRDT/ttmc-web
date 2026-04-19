'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn btn-primary',
  accent: 'btn btn-accent',
  secondary: 'btn',
  ghost: 'btn btn-ghost',
  danger:
    'btn border-[oklch(0.55_0.2_25)] bg-[oklch(0.55_0.2_25)] text-[var(--color-paper)]',
  success:
    'btn border-[oklch(0.55_0.13_155)] bg-[oklch(0.55_0.13_155)] text-[var(--color-paper)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-[10px] px-4 py-1.5',
  md: 'text-[12px] px-5 py-2.5',
  lg: 'text-[13px] px-7 py-3.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {loading ? (
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';
