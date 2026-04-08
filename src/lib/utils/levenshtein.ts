/**
 * Calcule la distance de Levenshtein entre deux chaînes.
 * Port du helper Dart (non utilisé actuellement mais prêt pour une validation
 * textuelle future des réponses).
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}

/**
 * Normalise une chaîne pour comparaison : lowercase, retire accents et ponctuation,
 * collapse whitespace.
 */
export function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Vérifie si deux réponses sont "assez similaires" (tolérance Levenshtein
 * proportionnelle à la longueur).
 */
export function answersMatch(given: string, expected: string, tolerance = 0.15): boolean {
  const a = normalizeForCompare(given);
  const b = normalizeForCompare(expected);
  if (a === b) return true;
  if (!a || !b) return false;
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return distance / maxLen <= tolerance;
}
