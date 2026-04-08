import type { StandardQuestion } from '@/lib/schemas/question.schema';
import { cleanAnswer } from './clean-answer';
import { extractRange } from './extract-ranges';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

/**
 * Types bruts observés dans les JSON sources (improbable, mature, plaisir, scolaire).
 */
interface RawStandardQuestion {
  numero?: number;
  difficulte?: number;
  question?: string;
  reponse?: string;
}

interface RawStandardCard {
  id?: number | string;
  theme?: string;
  questions?: RawStandardQuestion[];
}

/** Accepte soit une liste racine soit un wrapper `{cartes: [...]}` (scolaire). */
function extractCards(raw: unknown): RawStandardCard[] {
  if (Array.isArray(raw)) return raw as RawStandardCard[];
  if (raw && typeof raw === 'object' && 'cartes' in raw) {
    const cartes = (raw as { cartes?: unknown }).cartes;
    if (Array.isArray(cartes)) return cartes as RawStandardCard[];
  }
  return [];
}

export interface NormalizeStats {
  totalCards: number;
  totalQuestions: number;
  cleanedAnswers: number;
  extractedRanges: number;
  skipped: number;
}

export function normalizeStandardCategory(
  category: 'improbable' | 'mature' | 'plaisir' | 'scolaire',
  raw: unknown,
): { questions: StandardQuestion[]; stats: NormalizeStats } {
  const cards = extractCards(raw);
  const questions: StandardQuestion[] = [];
  const stats: NormalizeStats = {
    totalCards: 0,
    totalQuestions: 0,
    cleanedAnswers: 0,
    extractedRanges: 0,
    skipped: 0,
  };

  for (const card of cards) {
    if (!card.theme || !Array.isArray(card.questions)) {
      stats.skipped++;
      continue;
    }
    stats.totalCards++;
    const questionsMap: Record<string, string> = {};
    const answersMap: Record<string, string> = {};
    const alternateAnswers: Record<string, string[]> = {};
    const answerRanges: Record<string, { min: number; max: number; unit?: string }> = {};

    for (const q of card.questions) {
      const difficulty = q.difficulte ?? q.numero;
      if (
        !difficulty ||
        difficulty < 1 ||
        difficulty > 10 ||
        !q.question ||
        !q.reponse
      ) {
        continue;
      }
      stats.totalQuestions++;
      const key = String(difficulty);

      // Clean answer
      const rawAnswer = q.reponse;
      const cleaned = cleanAnswer(rawAnswer);
      if (cleaned.answer !== rawAnswer.trim()) {
        stats.cleanedAnswers++;
      }
      answersMap[key] = cleaned.answer;
      if (cleaned.alternates) {
        alternateAnswers[key] = cleaned.alternates;
      }

      // Extract range (uses raw answer with parens still in it)
      const range = extractRange(rawAnswer);
      if (range) {
        answerRanges[key] = range;
        stats.extractedRanges++;
      }

      questionsMap[key] = q.question.trim();
    }

    if (Object.keys(questionsMap).length === 0) {
      stats.skipped++;
      continue;
    }

    const id = `${category}-${card.id ?? card.theme.replace(/\s+/g, '-').toLowerCase()}`;
    questions.push({
      kind: 'standard',
      id,
      category,
      theme: card.theme,
      questions: questionsMap,
      answers: answersMap,
      ...(Object.keys(alternateAnswers).length > 0 ? { alternateAnswers } : {}),
      ...(Object.keys(answerRanges).length > 0 ? { answerRanges } : {}),
      timeLimit: GAME_CONSTANTS.defaultTimeLimit,
    });
  }

  return { questions, stats };
}
