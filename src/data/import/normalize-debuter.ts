import type { DebuterQuestion } from '@/lib/schemas/question.schema';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

interface RawDebuterCard {
  numero?: string | number;
  texte_principal?: string;
  texte_secondaire?: string;
}

export function normalizeDebuter(raw: unknown): DebuterQuestion[] {
  const cartes =
    raw && typeof raw === 'object' && 'cartes' in raw
      ? ((raw as { cartes: unknown }).cartes as RawDebuterCard[])
      : [];
  const questions: DebuterQuestion[] = [];
  for (const card of cartes) {
    if (!card.texte_principal || !card.texte_secondaire) continue;
    const numero = Number(card.numero ?? 0);
    if (!numero) continue;
    questions.push({
      kind: 'debuter',
      id: `debuter-${numero}`,
      category: 'debuter',
      numero,
      textePrincipal: card.texte_principal.trim(),
      texteSecondaire: card.texte_secondaire.trim(),
      timeLimit: GAME_CONSTANTS.defaultTimeLimit,
    });
  }
  return questions;
}
