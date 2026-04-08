'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          ref={ref}
          className={cn(
            'h-14 w-full rounded-full border border-white/10 bg-black/30 px-6 text-center text-xl text-white placeholder:text-white/30 focus:border-[var(--color-primary)] focus:outline-none transition-colors',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
