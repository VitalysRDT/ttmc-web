'use client';

import type { Question } from '@/lib/schemas/question.schema';
import { StandardQuestionCard } from './StandardQuestionCard';
import { DebuterQuestionCard } from './DebuterQuestionCard';
import { FinalQuestionCard } from './FinalQuestionCard';
import { IntrepideQuestionCard } from './IntrepideQuestionCard';

interface Props {
  question: Question;
  /** Pour les questions standard uniquement. */
  difficulty?: number;
  showAnswer?: boolean;
}

/** Dispatcher par type de question. */
export function QuestionCard({ question, difficulty, showAnswer }: Props) {
  switch (question.kind) {
    case 'standard':
      return (
        <StandardQuestionCard
          question={question}
          difficulty={difficulty ?? 1}
          showAnswer={showAnswer}
        />
      );
    case 'debuter':
      return <DebuterQuestionCard question={question} showAnswer={showAnswer} />;
    case 'final':
      return <FinalQuestionCard question={question} showAnswer={showAnswer} />;
    case 'intrepide':
      return <IntrepideQuestionCard question={question} showAnswer={showAnswer} />;
  }
}
