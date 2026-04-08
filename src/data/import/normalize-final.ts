import type { FinalQuestion } from '@/lib/schemas/question.schema';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

interface RawFinalCard {
  id?: number | string;
  categorie?: string;
  question?: string;
  expression?: string;
  options?: string[];
  reponse?: string | string[];
  reponses?: string[];
  explication?: string;
}

export function normalizeFinal(raw: unknown): FinalQuestion[] {
  const cartes =
    raw && typeof raw === 'object' && 'cartes' in raw
      ? ((raw as { cartes: unknown }).cartes as RawFinalCard[])
      : [];
  const questions: FinalQuestion[] = [];
  for (const card of cartes) {
    if (!card.question || (!card.reponse && !card.reponses)) continue;
    let reponse: string;
    if (typeof card.reponse === 'string') {
      reponse = card.reponse;
    } else if (Array.isArray(card.reponse)) {
      reponse = card.reponse.join(', ');
    } else if (Array.isArray(card.reponses)) {
      reponse = card.reponses.join(', ');
    } else {
      continue;
    }
    const id = `final-${card.id ?? (card.categorie ?? 'x').replace(/\s+/g, '-').toLowerCase()}`;
    // Ajoute l'expression au contenu de la question si présente (souvent c'est la phrase clé)
    const questionText = card.expression
      ? `${card.question}\n\n${card.expression}`
      : card.question;
    questions.push({
      kind: 'final',
      id,
      category: 'final',
      theme: card.categorie ?? 'Finale',
      question: questionText.trim(),
      ...(card.options && card.options.length > 0 ? { options: card.options } : {}),
      reponse: reponse.trim(),
      ...(card.explication ? { explication: card.explication.trim() } : {}),
      timeLimit: GAME_CONSTANTS.defaultTimeLimit,
    });
  }
  return questions;
}
