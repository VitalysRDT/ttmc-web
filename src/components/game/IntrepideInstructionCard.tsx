'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
 * Carte Intrépide non-quiz (variants `modifier` et `action`).
 *
 * Ces cartes n'ont pas de sous-questions à valider lettre par lettre.
 * - `modifier` : impose une règle pour le tour (NIB, AMBITION). Le joueur
 *   applique la règle manuellement (honor system).
 * - `action` : demande une réorganisation physique entre joueurs (AVERELL).
 *
 * UX : affiche l'instruction + la conséquence (`consequence`) puis un seul
 * bouton « VALIDER » qui envoie `subItemAnswers: {}` au serveur — `spaces = 0`,
 * pas de mouvement de pion, le tour passe au joueur suivant.
 */
export function IntrepideInstructionCard({
  question,
  roomId,
  isCurrentPlayer,
  currentPlayerName,
}: Props) {
  const actions = useGameActions();
  const [submitting, setSubmitting] = useState(false);

  const badgeLabel = question.variant === 'action' ? '⚡ Action' : '📜 Règle';
  const sectionLabel =
    question.variant === 'action' ? 'Détails' : 'En cas de mauvaise réponse';

  const handleValidate = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await actions.submitIntrepideAnswer(roomId, {});
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
          {badgeLabel}
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
        <p className="whitespace-pre-line text-base leading-relaxed text-white">
          {question.instruction}
        </p>
      )}

      {question.consequence && (
        <div className="rounded-2xl border border-[var(--color-ttmc-intrepide)]/30 bg-[var(--color-ttmc-intrepide)]/5 p-5">
          <div className="text-[10px] tracking-[0.3em] font-bold mb-2 uppercase text-[var(--color-ttmc-intrepide)]">
            → {sectionLabel}
          </div>
          <p className="whitespace-pre-line text-sm text-white/85 italic leading-relaxed">
            {question.consequence}
          </p>
        </div>
      )}

      {isCurrentPlayer ? (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={handleValidate}
            disabled={submitting}
            loading={submitting}
          >
            {question.variant === 'modifier' ? 'APPLIQUER LA RÈGLE →' : 'VALIDER — TOUR SUIVANT'}
          </Button>
          <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
            {question.variant === 'action'
              ? 'Appliquez l\'action ensemble'
              : 'La règle sera appliquée immédiatement'}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-white/50 italic">
          {currentPlayerName} applique la carte…
        </p>
      )}
    </motion.div>
  );
}
