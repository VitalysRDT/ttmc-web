/**
 * Extraction de plages numériques depuis une réponse.
 *
 * Exemples :
 *   "38 notes (propositions entre 37 et 39 notes acceptées)"
 *     → {min: 37, max: 39, unit: "notes"}
 *   "1.000 cm³ (propositions entre 900 et 1.100 cm³ acceptées)"
 *     → {min: 900, max: 1100, unit: "cm³"}
 *   "1992 (propositions 1990–1994 acceptées)"
 *     → {min: 1990, max: 1994}
 */

export interface AnswerRange {
  min: number;
  max: number;
  unit?: string;
}

const RANGE_REGEXES = [
  // "entre X et Y [unit]"
  /entre\s+([\d.,]+)\s+et\s+([\d.,]+)\s*([%a-zà-ÿ\p{L}³²]*)/iu,
  // "X–Y" ou "X-Y" ou "X à Y"
  /([\d.,]+)\s*(?:–|-|à)\s*([\d.,]+)\s*([%a-zà-ÿ\p{L}³²]*)/iu,
];

function parseNumber(s: string): number | null {
  const normalized = s.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

export function extractRange(raw: string): AnswerRange | null {
  if (!raw) return null;
  // On cherche dans les parenthèses pour éviter les faux positifs
  const parenMatch = raw.match(/\(([^)]*)\)/);
  const searchText = parenMatch ? parenMatch[1]! : raw;

  for (const regex of RANGE_REGEXES) {
    const m = searchText.match(regex);
    if (!m) continue;
    const min = parseNumber(m[1]!);
    const max = parseNumber(m[2]!);
    if (min === null || max === null || min >= max) continue;
    const unit = m[3]?.trim() || undefined;
    return { min, max, ...(unit ? { unit } : {}) };
  }
  return null;
}
