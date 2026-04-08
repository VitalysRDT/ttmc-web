import type { IntrepideQuestion } from '@/lib/schemas/question.schema';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

interface RawIntrepideSubQ {
  lettre?: string;
  description?: string;
  question?: string;
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
  reponses?: RawIntrepideSubR[];
}

/**
 * Fix bug #5 : mapping par `lettre` au lieu d'index. Le code Dart faisait
 * `questions[i]` + `reponses[i]` ce qui cassait dès que les arrays étaient
 * désalignées. Ici on indexe par lettre et on prend l'intersection.
 */
export function normalizeIntrepide(raw: unknown): IntrepideQuestion[] {
  if (!Array.isArray(raw)) return [];
  const cards = raw as RawIntrepideCard[];
  const questions: IntrepideQuestion[] = [];

  for (const card of cards) {
    if (!card.id || !card.titre) continue;

    // Cas simple : pas de sous-questions, juste une question "reponse"
    if (
      !card.questions ||
      card.questions.length === 0 ||
      !card.reponses ||
      card.reponses.length === 0
    ) {
      if (card.instruction && card.reponse) {
        questions.push({
          kind: 'intrepide',
          id: `intrepide-${card.id}`,
          category: 'intrepide',
          theme: card.titre,
          type: card.type ?? 'Défi',
          instruction: card.instruction,
          subQuestions: [
            {
              letter: 'A',
              question: card.instruction,
              answer: card.reponse,
            },
          ],
          timeLimit: GAME_CONSTANTS.defaultTimeLimit,
        });
      }
      continue;
    }

    // Cas complexe : map par lettre
    const answersByLetter = new Map<string, string>();
    for (const r of card.reponses) {
      if (r.lettre && r.reponse) {
        answersByLetter.set(r.lettre.toUpperCase(), r.reponse.trim());
      }
    }
    const subQuestions: IntrepideQuestion['subQuestions'] = [];
    for (const q of card.questions) {
      const letter = q.lettre?.toUpperCase();
      if (!letter) continue;
      const questionText = (q.description ?? q.question ?? '').trim();
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
      ...(card.instruction ? { instruction: card.instruction } : {}),
      subQuestions,
      timeLimit: GAME_CONSTANTS.defaultTimeLimit,
    });
  }
  return questions;
}
