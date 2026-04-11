'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategoryBadge } from './CategoryBadge';
import { useGameActions } from '@/lib/hooks/useGameActions';
import type { IntrepideQuestion } from '@/lib/schemas/question.schema';

interface Props {
  question: IntrepideQuestion;
  roomId: string;
  isCurrentPlayer: boolean;
  currentPlayerName: string;
}

/**
 * Carte Intrépide en phase `answering` : affiche chaque sous-question (lettre)
 * avec son indice + sa réponse et deux boutons RATÉ/TROUVÉ. Le joueur valide
 * item par item puis envoie le résultat global via « VALIDER ». Le serveur
 * calcule `spaces = correctCount` et fait avancer le pion.
 */
export function IntrepideAnswerCard({
  question,
  roomId,
  isCurrentPlayer,
  currentPlayerName,
}: Props) {
  const actions = useGameActions();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const total = question.subQuestions.length;
  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter(Boolean).length;
  const allAnswered = answered === total;

  const handleMark = (letter: string, ok: boolean) => {
    if (!isCurrentPlayer || submitting) return;
    if (answers[letter] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [letter]: ok }));
  };

  const handleValidate = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    try {
      await actions.submitIntrepideAnswer(roomId, answers);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-strong relative flex flex-col gap-6 rounded-3xl border-2 border-[var(--color-ttmc-intrepide)]/40 p-6 w-full max-w-xl"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(239,83,80,0.2)' }}
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category="intrepide" />
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-ttmc-intrepide)] uppercase font-bold">
          🔥 Défi
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2">Thème</div>
        <div className="text-sm tracking-[0.1em] font-bold text-[var(--color-ttmc-intrepide)]">
          {question.theme}
          {question.type && ` — ${question.type}`}
        </div>
      </div>

      {question.instruction && (
        <p className="text-sm text-white/80 italic leading-relaxed">{question.instruction}</p>
      )}

      <ul className="flex flex-col gap-3">
        {question.subQuestions.map((sub) => {
          const mark = answers[sub.letter];
          const locked = mark !== undefined;
          const isCorrect = mark === true;
          const isWrong = mark === false;

          return (
            <li
              key={sub.letter}
              className={`rounded-xl border p-4 backdrop-blur-sm transition-colors ${
                isCorrect
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : isWrong
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full font-black text-white"
                  style={{
                    background: 'linear-gradient(145deg, #ef5350, #c62828)',
                    boxShadow: '0 4px 12px rgba(239,83,80,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  {sub.letter}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-snug">{sub.question}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                    → {sub.answer}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMark(sub.letter, false)}
                  disabled={!isCurrentPlayer || locked || submitting}
                  className={`flex-1 h-11 rounded-xl border-2 font-black text-xs tracking-[0.15em] transition-all disabled:cursor-not-allowed ${
                    isWrong
                      ? 'border-red-500 bg-red-500/25 text-red-200'
                      : 'border-red-500/40 bg-red-500/5 text-red-400 hover:border-red-500 hover:bg-red-500/15 disabled:opacity-40'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <X size={16} strokeWidth={3} />
                    RATÉ
                  </span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMark(sub.letter, true)}
                  disabled={!isCurrentPlayer || locked || submitting}
                  className={`flex-1 h-11 rounded-xl border-2 font-black text-xs tracking-[0.15em] transition-all disabled:cursor-not-allowed ${
                    isCorrect
                      ? 'border-emerald-500 bg-emerald-500/25 text-emerald-200'
                      : 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/15 disabled:opacity-40'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Check size={16} strokeWidth={3} />
                    TROUVÉ
                  </span>
                </motion.button>
              </div>
            </li>
          );
        })}
      </ul>

      {isCurrentPlayer ? (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs tracking-[0.2em] text-white/60">
            {answered}/{total} répondues — {correct} correcte{correct > 1 ? 's' : ''}
          </div>
          <Button
            size="lg"
            onClick={handleValidate}
            disabled={!allAnswered || submitting}
            loading={submitting}
          >
            VALIDER (+{correct} CASE{correct > 1 ? 'S' : ''})
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-white/50 italic">
          {currentPlayerName} répond…
        </p>
      )}
    </motion.div>
  );
}
