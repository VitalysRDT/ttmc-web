import type {
  IntrepideQuestion,
  IntrepideVariant,
} from '@/lib/schemas/question.schema';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

interface RawIntrepideSubQ {
  lettre?: string;
  description?: string;
  question?: string;
  proposition?: string;
  chanson?: string;
}

interface RawIntrepideSubR {
  lettre?: string;
  reponse?: string;
}

interface RawIntrepideCard {
  id?: number | string;
  type?: string;
  titre?: string;
  instruction?: string;
  reponse?: string;
  questions?: RawIntrepideSubQ[];
  reponses?: RawIntrepideSubR[] | string[];
}

/**
 * Table explicite des variants par id de carte.
 *
 * - `modifier` = carte qui impose une règle pour le tour (NIB, AMBITION).
 * - `action`   = carte qui demande une réorganisation physique (AVERELL).
 * - défaut (non listé) = `quiz` : sous-questions A/B/C… à valider.
 *
 * Pourquoi un mapping explicite ? On n'a que 8 cartes dans le pack et les
 * heuristiques (« `questions` vide → modifier ») confondraient les cartes
 * `free_list` (ID 75 Mario Kart qui n'a pas de sous-questions typées mais
 * reste un quiz). Garder cette table à jour si un nouveau pack arrive.
 */
const VARIANT_BY_ID: Record<number, IntrepideVariant> = {
  70: 'modifier', // NIB
  72: 'modifier', // AMBITION
  76: 'action', // AVERELL
};

function isStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every((x) => typeof x === 'string');
}

/**
 * Fix bug #5 : mapping par `lettre` au lieu d'index. Le code Dart faisait
 * `questions[i]` + `reponses[i]` ce qui cassait dès que les arrays étaient
 * désalignées. Ici on indexe par lettre et on prend l'intersection.
 *
 * Gère 3 variants :
 *  - `modifier` / `action` : pas de sous-questions, on stocke `consequence`.
 *  - `quiz` (défaut) avec `questions` + `reponses` objets indexés par lettre.
 *  - `quiz` (free_list) avec `reponses: string[]` (ex. Mario Kart) — on
 *    synthétise des lettres A, B, C… avec `question` vide.
 */
export function normalizeIntrepide(raw: unknown): IntrepideQuestion[] {
  if (!Array.isArray(raw)) return [];
  const cards = raw as RawIntrepideCard[];
  const questions: IntrepideQuestion[] = [];

  for (const card of cards) {
    if (!card.id || !card.titre) continue;
    const numericId =
      typeof card.id === 'number' ? card.id : Number(card.id);
    const variant: IntrepideVariant =
      !Number.isNaN(numericId) && VARIANT_BY_ID[numericId]
        ? VARIANT_BY_ID[numericId]
        : 'quiz';

    // Variants modifier / action : instruction + consequence, pas de sous-items.
    if (variant === 'modifier' || variant === 'action') {
      if (!card.instruction) continue;
      questions.push({
        kind: 'intrepide',
        id: `intrepide-${card.id}`,
        category: 'intrepide',
        theme: card.titre,
        type: card.type ?? 'Défi',
        variant,
        instruction: card.instruction,
        ...(card.reponse ? { consequence: card.reponse } : {}),
        subQuestions: [],
        timeLimit: GAME_CONSTANTS.defaultTimeLimit,
      });
      continue;
    }

    // Variant quiz — cas `free_list` : reponses est un tableau de strings,
    // pas d'objets `{lettre, reponse}`. On synthétise des lettres A/B/C…
    if (isStringArray(card.reponses) && card.reponses.length > 0) {
      const subQuestions = card.reponses
        .filter((r) => typeof r === 'string' && r.trim().length > 0)
        .map((answer, i) => ({
          letter: String.fromCharCode(65 + i),
          question: '',
          answer: answer.trim(),
        }));
      if (subQuestions.length === 0) continue;
      questions.push({
        kind: 'intrepide',
        id: `intrepide-${card.id}`,
        category: 'intrepide',
        theme: card.titre,
        type: card.type ?? 'Défi',
        variant: 'quiz',
        ...(card.instruction ? { instruction: card.instruction } : {}),
        subQuestions,
        timeLimit: GAME_CONSTANTS.defaultTimeLimit,
      });
      continue;
    }

    // Variant quiz classique — map par lettre.
    const reponsesObj = (card.reponses ?? []) as RawIntrepideSubR[];
    const questionsArr = card.questions ?? [];
    if (questionsArr.length === 0 || reponsesObj.length === 0) {
      // Carte mal formée (ni quiz, ni modifier, ni action) — on la skip.
      continue;
    }
    const answersByLetter = new Map<string, string>();
    for (const r of reponsesObj) {
      if (r.lettre && r.reponse) {
        answersByLetter.set(r.lettre.toUpperCase(), r.reponse.trim());
      }
    }
    const subQuestions: IntrepideQuestion['subQuestions'] = [];
    for (const q of questionsArr) {
      const letter = q.lettre?.toUpperCase();
      if (!letter) continue;
      const questionText = (
        q.description ??
        q.question ??
        q.proposition ??
        q.chanson ??
        ''
      ).trim();
      if (!questionText) continue;
      const answer = answersByLetter.get(letter) ?? '';
      if (!answer) continue;
      subQuestions.push({ letter, question: questionText, answer });
    }
    if (subQuestions.length === 0) continue;

    questions.push({
      kind: 'intrepide',
      id: `intrepide-${card.id}`,
      category: 'intrepide',
      theme: card.titre,
      type: card.type ?? 'Défi',
      variant: 'quiz',
      ...(card.instruction ? { instruction: card.instruction } : {}),
      subQuestions,
      timeLimit: GAME_CONSTANTS.defaultTimeLimit,
    });
  }
  return questions;
}
