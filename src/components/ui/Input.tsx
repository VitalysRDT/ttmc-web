'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-2">
        <input
          ref={ref}
          className={cn(
            'editorial-input',
            error && 'border-b-[oklch(0.55_0.2_25)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[oklch(0.55_0.2_25)]">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
