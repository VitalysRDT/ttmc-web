'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameActions } from '@/lib/hooks/useGameActions';
import type { QuestionCategory } from '@/lib/schemas/enums';
import type { PendingModifier } from '@/lib/schemas/game-state.schema';

interface Props {
  roomId: string;
  pending: PendingModifier;
  isCurrentPlayer: boolean;
  currentPlayerName: string;
}

const CATEGORY_LABEL: Record<Exclude<QuestionCategory, 'debuter' | 'intrepide' | 'final' | 'bonus' | 'malus' | 'challenge'>, { title: string; subtitle: string; color: string }> = {
  improbable: { title: 'Improbable', subtitle: 'Culture et anecdotes rocambolesques', color: '#7c4dff' },
  mature: { title: 'Mature', subtitle: 'Thèmes adultes et sans filtre', color: '#ef5350' },
  plaisir: { title: 'Plaisir', subtitle: 'Sport, loisirs, pop culture', color: '#26c6da' },
  scolaire: { title: 'Scolaire', subtitle: 'Histoire, sciences, géographie', color: '#66bb6a' },
};

/**
 * Picker de catégorie pour les cartes Intrépide modifier (NIB, AMBITION).
 * NIB propose les 4 catégories standard ; AMBITION uniquement Mature / Improbable.
 */
export function ModifierCategoryPicker({
  roomId,
  pending,
  isCurrentPlayer,
  currentPlayerName,
}: Props) {
  const actions = useGameActions();
  const [submitting, setSubmitting] = useState<QuestionCategory | null>(null);

  const options: QuestionCategory[] =
    pending.kind === 'ambition'
      ? ['mature', 'improbable']
      : ['improbable', 'mature', 'plaisir', 'scolaire'];

  const handleSelect = async (category: QuestionCategory) => {
    if (submitting || !isCurrentPlayer) return;
    setSubmitting(category);
    try {
      await actions.selectModifierCategory(roomId, category);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
      setSubmitting(null);
    }
  };

  const ruleLabel =
    pending.kind === 'ambition'
      ? 'Difficulté imposée : 4 à 10'
      : 'Difficulté imposée : 1/10';
  const title =
    pending.kind === 'ambition'
      ? 'CHOISIS UN THÈME IMPOSÉ'
      : 'CHOISIS LIBREMENT TON THÈME';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-5 p-6 w-full max-w-xl"
    >
      <div className="text-center">
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-ttmc-intrepide)] uppercase font-bold mb-1">
          {pending.kind === 'ambition' ? '📜 AMBITION' : '📜 NIB'}
        </div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="mt-1 text-xs tracking-[0.2em] text-white/60 uppercase">{ruleLabel}</p>
      </div>

      {isCurrentPlayer ? (
        <div className="grid grid-cols-1 gap-3 w-full sm:grid-cols-2">
          {options.map((cat) => {
            const meta = CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL];
            if (!meta) return null;
            const isLoading = submitting === cat;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(cat)}
                disabled={submitting !== null}
                className="group flex flex-col gap-1 rounded-2xl border-2 bg-white/5 p-5 text-left transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: `${meta.color}55` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs tracking-[0.25em] font-black uppercase"
                    style={{ color: meta.color }}
                  >
                    {meta.title}
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                    {isLoading ? '...' : '→ Tirer'}
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-snug">{meta.subtitle}</p>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-white/50 italic">
          {currentPlayerName} choisit son thème…
        </p>
      )}
    </motion.div>
  );
}
