'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-[#ffe666] to-[#e0b800] text-black hover:from-[#fff080] hover:to-[#eac200] glow-primary border border-[#fff3a0]/40',
  secondary:
    'bg-white/5 text-white hover:bg-white/10 border border-white/15 backdrop-blur-xl',
  ghost:
    'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  danger:
    'bg-gradient-to-b from-red-500 to-red-700 text-white hover:from-red-400 hover:to-red-600 shadow-lg shadow-red-500/30 border border-red-400/40',
  success:
    'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600 shadow-lg shadow-emerald-500/30 border border-emerald-400/40',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs tracking-wider rounded-full',
  md: 'h-12 px-6 text-sm tracking-wide rounded-full',
  lg: 'h-16 px-10 text-base font-black tracking-[0.15em] rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-bold uppercase transition-all duration-200',
          'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <span className="relative z-10">{children}</span>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';
