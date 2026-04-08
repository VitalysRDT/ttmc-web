import type { QuestionCategory } from '@/lib/schemas/enums';

/** Position relative (x, y en pourcentage 0-1) d'une case sur le plateau. */
export type BoardOffset = { x: number; y: number };

/** Nombre total de cases (0 à 50 inclus = 51 cases). */
export const TOTAL_SQUARES = 51;

/**
 * Coordonnées relatives de chaque case (0 à 50) sur l'image du plateau.
 * Port direct de `board_positions.dart`.
 */
export const SQUARE_POSITIONS: Record<number, BoardOffset> = {
  0: { x: 0.85, y: 0.92 },
  1: { x: 0.85, y: 0.85 },
  2: { x: 0.85, y: 0.78 },
  3: { x: 0.85, y: 0.71 },
  4: { x: 0.85, y: 0.64 },
  5: { x: 0.82, y: 0.57 },
  6: { x: 0.77, y: 0.52 },
  7: { x: 0.70, y: 0.48 },
  8: { x: 0.62, y: 0.48 },
  9: { x: 0.54, y: 0.48 },
  10: { x: 0.46, y: 0.48 },
  11: { x: 0.38, y: 0.48 },
  12: { x: 0.30, y: 0.50 },
  13: { x: 0.24, y: 0.54 },
  14: { x: 0.20, y: 0.60 },
  15: { x: 0.18, y: 0.67 },
  16: { x: 0.18, y: 0.74 },
  17: { x: 0.20, y: 0.80 },
  18: { x: 0.24, y: 0.85 },
  19: { x: 0.30, y: 0.88 },
  20: { x: 0.37, y: 0.89 },
  21: { x: 0.44, y: 0.88 },
  22: { x: 0.51, y: 0.87 },
  23: { x: 0.58, y: 0.85 },
  24: { x: 0.63, y: 0.80 },
  25: { x: 0.66, y: 0.74 },
  26: { x: 0.67, y: 0.67 },
  27: { x: 0.66, y: 0.60 },
  28: { x: 0.62, y: 0.55 },
  29: { x: 0.56, y: 0.52 },
  30: { x: 0.49, y: 0.52 },
  31: { x: 0.42, y: 0.54 },
  32: { x: 0.36, y: 0.58 },
  33: { x: 0.32, y: 0.64 },
  34: { x: 0.32, y: 0.71 },
  35: { x: 0.35, y: 0.77 },
  36: { x: 0.41, y: 0.80 },
  37: { x: 0.48, y: 0.79 },
  38: { x: 0.54, y: 0.76 },
  39: { x: 0.58, y: 0.70 },
  40: { x: 0.60, y: 0.63 },
  41: { x: 0.59, y: 0.56 },
  42: { x: 0.56, y: 0.50 },
  43: { x: 0.51, y: 0.45 },
  44: { x: 0.46, y: 0.41 },
  45: { x: 0.42, y: 0.36 },
  46: { x: 0.40, y: 0.30 },
  47: { x: 0.42, y: 0.24 },
  48: { x: 0.47, y: 0.19 },
  49: { x: 0.54, y: 0.16 },
  50: { x: 0.62, y: 0.14 },
};

/** Catégorie associée à chaque case du plateau. */
export const SQUARE_CATEGORIES: Record<number, QuestionCategory> = {
  0: 'improbable',
  1: 'improbable',
  2: 'plaisir',
  3: 'scolaire',
  4: 'mature',
  5: 'intrepide',
  6: 'improbable',
  7: 'plaisir',
  8: 'scolaire',
  9: 'mature',
  10: 'improbable',
  11: 'plaisir',
  12: 'intrepide',
  13: 'scolaire',
  14: 'mature',
  15: 'improbable',
  16: 'plaisir',
  17: 'scolaire',
  18: 'mature',
  19: 'improbable',
  20: 'intrepide',
  21: 'plaisir',
  22: 'scolaire',
  23: 'mature',
  24: 'improbable',
  25: 'plaisir',
  26: 'scolaire',
  27: 'mature',
  28: 'intrepide',
  29: 'improbable',
  30: 'plaisir',
  31: 'scolaire',
  32: 'mature',
  33: 'improbable',
  34: 'plaisir',
  35: 'intrepide',
  36: 'scolaire',
  37: 'mature',
  38: 'improbable',
  39: 'plaisir',
  40: 'scolaire',
  41: 'mature',
  42: 'intrepide',
  43: 'improbable',
  44: 'plaisir',
  45: 'scolaire',
  46: 'mature',
  47: 'improbable',
  48: 'plaisir',
  49: 'scolaire',
  50: 'final',
};

/** Couleurs des catégories (utilisées pour les cases et les badges). */
export const CATEGORY_COLORS: Record<QuestionCategory, string> = {
  mature: '#4FC3F7',
  improbable: '#9C27B0',
  plaisir: '#FF9800',
  scolaire: '#66BB6A',
  intrepide: '#E53935',
  final: '#FFD700',
  debuter: '#FFFFFF',
  bonus: '#E53935',
  malus: '#212121',
  challenge: '#FFEB3B',
};

/** Libellés français des catégories. */
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  debuter: 'Débuter',
  improbable: 'Improbable',
  plaisir: 'Plaisir',
  mature: 'Mature',
  scolaire: 'Scolaire',
  intrepide: 'Intrépide',
  final: 'Finale',
  bonus: 'Bonus',
  malus: 'Malus',
  challenge: 'Challenge',
};

/**
 * Retourne un offset d'empilement pour placer plusieurs pions sur la même case.
 * Port du helper Dart `getStackedPawnOffset`.
 */
export function getStackedPawnOffset(playerIndex: number, totalPlayers: number): BoardOffset {
  if (totalPlayers <= 1) return { x: 0, y: 0 };
  const angle = (playerIndex / totalPlayers) * 2 * Math.PI;
  const radius = 0.015;
  const xSign = angle < Math.PI ? 1 : -1;
  const ySign = angle < Math.PI / 2 || angle > (3 * Math.PI) / 2 ? -1 : 1;
  const magnitude = radius * (1 + playerIndex * 0.5);
  return { x: magnitude * xSign, y: magnitude * ySign };
}
