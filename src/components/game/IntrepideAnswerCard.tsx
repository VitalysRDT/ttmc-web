'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Lock } from 'lucide-react';
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
 * Carte Intrépide en phase `answering`, révélation progressive lettre par lettre.
 *
 * UX : seul le sous-item courant expose sa réponse + boutons RATÉ/TROUVÉ.
 * Les items suivants n'affichent que l'énoncé (réponse masquée). Les items
 * validés sont figés (vert/rouge). Quand toutes les lettres ont été marquées,
 * le bouton VALIDER devient actif et envoie la map complète au serveur.
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
  const firstUnansweredIndex = question.subQuestions.findIndex(
    (sub) => answers[sub.letter] === undefined,
  );
  const currentIndex = firstUnansweredIndex === -1 ? total : firstUnansweredIndex;

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
        {question.subQuestions.map((sub, index) => {
          const mark = answers[sub.letter];
          const isLocked = mark !== undefined;
          const isActive = index === currentIndex;
          const isMasked = index > currentIndex;
          const isCorrectMark = mark === true;
          const isWrongMark = mark === false;

          const borderClass = isCorrectMark
            ? 'border-emerald-500/50 bg-emerald-500/10'
            : isWrongMark
              ? 'border-red-500/50 bg-red-500/10'
              : isActive
                ? 'border-[var(--color-ttmc-intrepide)]/60 bg-[var(--color-ttmc-intrepide)]/10'
                : 'border-white/10 bg-white/5';

          return (
            <motion.li
              key={sub.letter}
              layout
              animate={{ opacity: isMasked ? 0.55 : 1 }}
              transition={{ duration: 0.25 }}
              className={`rounded-xl border p-4 backdrop-blur-sm transition-colors ${borderClass}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full font-black text-white"
                  style={{
                    background: 'linear-gradient(145deg, #ef5350, #c62828)',
                    boxShadow:
                      '0 4px 12px rgba(239,83,80,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  {sub.letter}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-snug">{sub.question}</p>
                  <AnimatePresence initial={false}>
                    {(isLocked || isActive) && (
                      <motion.p
                        key="answer"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="text-sm font-semibold text-[var(--color-primary)] overflow-hidden"
                      >
                        → {sub.answer}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {isMasked && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-white/40 uppercase">
                      <Lock size={10} strokeWidth={2.5} />
                      Réponse masquée
                    </div>
                  )}
                </div>
              </div>

              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 flex gap-2"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMark(sub.letter, false)}
                    disabled={!isCurrentPlayer || submitting}
                    className="flex-1 h-11 rounded-xl border-2 border-red-500/40 bg-red-500/5 font-black text-xs tracking-[0.15em] text-red-400 transition-all hover:border-red-500 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <X size={16} strokeWidth={3} />
                      RATÉ
                    </span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMark(sub.letter, true)}
                    disabled={!isCurrentPlayer || submitting}
                    className="flex-1 h-11 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 font-black text-xs tracking-[0.15em] text-emerald-400 transition-all hover:border-emerald-500 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Check size={16} strokeWidth={3} />
                      TROUVÉ
                    </span>
                  </motion.button>
                </motion.div>
              )}

              {isLocked && (
                <div
                  className={`mt-2 text-[10px] tracking-[0.2em] font-bold uppercase ${
                    isCorrectMark ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {isCorrectMark ? '✓ Trouvé' : '✗ Raté'}
                </div>
              )}
            </motion.li>
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
