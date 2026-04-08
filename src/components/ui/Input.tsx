'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        <input
          ref={ref}
          className={cn(
            'h-16 w-full rounded-full border border-white/10 bg-black/40 px-6 text-center text-2xl font-bold tracking-[0.15em] text-white placeholder:text-white/20 transition-all',
            'focus:border-[var(--color-primary)] focus:outline-none focus:shadow-[0_0_32px_rgba(255,215,0,0.25)] focus:bg-black/60',
            error && 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_32px_rgba(239,68,68,0.3)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-red-400 text-xs tracking-wider text-center uppercase">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
