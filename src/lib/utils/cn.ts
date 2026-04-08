import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine plusieurs class strings conditionnelles et fusionne les classes
 * Tailwind conflictuelles (la dernière gagne).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
