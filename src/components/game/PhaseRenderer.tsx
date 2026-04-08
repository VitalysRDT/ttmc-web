'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { QuestionCard } from './QuestionCard';
import { CountdownOverlay } from './CountdownOverlay';
import { DifficultySelector } from './DifficultySelector';
import { HonorButtons } from './HonorButtons';
import { CategoryBadge } from './CategoryBadge';
import { useGameActions } from '@/lib/hooks/useGameActions';
import { serverNow } from '@/lib/hooks/useServerTime';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';
import { SQUARE_CATEGORIES } from '@/lib/game/board-positions';
import type { GameRoom } from '@/lib/schemas/game-room.schema';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  room: GameRoom;
  currentPlayer: Player;
}

export function PhaseRenderer({ room, currentPlayer }: Props) {
  const actions = useGameActions();
  const state = room.gameState;

  const isCurrentPlayer = state?.currentPlayerId === currentPlayer.id;
  const isHost = room.hostId === currentPlayer.id;
  const currentPlayerName =
    room.players.find((p) => p.id === state?.currentPlayerId)?.pseudo ?? 'Joueur';
  const turn = state?.currentTurn;

  // Fix bug #1 C3 : utilise le timestamp primitif (number) comme dépendance au lieu
  // de l'instance Date. Zod recrée une Date à chaque fetch, donc l'useEffect se
  // redéclencherait à chaque polling si on utilisait state.phaseStartedAt directement.
  const phaseStartedAtMs = state?.phaseStartedAt?.getTime() ?? null;
  const currentPhase = state?.currentPhase;

  // Fix bug #1 C3 : mémorise le dernier timestamp pour lequel un reveal a été planifié.
  // Garantit un seul setTimeout par phase `reading_question`, peu importe combien de
  // fois le polling re-render ce composant.
  const revealPlannedForRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentPhase !== 'reading_question') {
      revealPlannedForRef.current = null;
      return;
    }
    if (!phaseStartedAtMs) return;
    if (!isCurrentPlayer) return;
    // Déjà planifié pour ce phaseStartedAt précis ?
    if (revealPlannedForRef.current === phaseStartedAtMs) return;
    revealPlannedForRef.current = phaseStartedAtMs;

    const elapsed = serverNow() - phaseStartedAtMs;
    // Ajoute une marge de +100ms sur la durée client pour être certain que le
    // guard serveur (minElapsed = 5000 - 300 = 4700ms) accepte notre appel.
    const targetMs = GAME_CONSTANTS.readCountdownSeconds * 1000 + 100;
    const remaining = Math.max(0, targetMs - elapsed);

    const timer = setTimeout(() => {
      actions.revealAnswer(room.id).catch(() => {});
    }, remaining);
    return () => clearTimeout(timer);
  }, [currentPhase, phaseStartedAtMs, room.id, isCurrentPlayer, actions]);

  if (!state) return null;

  switch (state.currentPhase) {
    case 'debuter_question':
      return <DebuterPhaseView room={room} currentPlayer={currentPlayer} />;

    case 'waiting_to_start': {
      const currentPos = state.playerPositions[state.currentPlayerId] ?? 0;
      const nextCategory = SQUARE_CATEGORIES[currentPos] ?? 'improbable';
      return (
        <div className="flex flex-col items-center gap-6 p-6">
          <h2 className="text-center text-3xl font-black text-white">
            {isCurrentPlayer ? 'C\'EST À TOI' : `AU TOUR DE ${currentPlayerName.toUpperCase()}`}
          </h2>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs tracking-[0.2em] text-white/50">
              CASE {currentPos}/50 — PROCHAINE CATÉGORIE
            </div>
            <CategoryBadge category={nextCategory} />
          </div>
          {isCurrentPlayer && (
            <Button
              size="lg"
              onClick={() =>
                actions.startTurn(room.id).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
            >
              TIRER UNE CARTE
            </Button>
          )}
          {!isCurrentPlayer && (
            <p className="text-sm text-white/50">En attente du joueur…</p>
          )}
        </div>
      );
    }

    case 'selecting_difficulty':
      if (!turn || turn.question.kind !== 'standard') return null;
      return (
        <div className="flex flex-col items-center gap-6 p-6">
          <div className="flex flex-col items-center gap-2">
            <CategoryBadge category={turn.question.category} />
            <div className="text-center text-sm tracking-[0.2em] text-white/60">
              {turn.question.theme}
            </div>
          </div>
          <DifficultySelector
            question={turn.question}
            disabled={!isCurrentPlayer}
            onConfirm={(d) =>
              actions.selectDifficulty(room.id, d).catch((err) =>
                alert(err instanceof Error ? err.message : String(err)),
              )
            }
          />
          {!isCurrentPlayer && (
            <p className="text-sm text-white/50">
              {currentPlayerName} choisit sa difficulté…
            </p>
          )}
        </div>
      );

    case 'reading_question':
      if (!turn) return null;
      return (
        <>
          <CountdownOverlay startedAt={state.phaseStartedAt} />
          <div className="flex flex-col items-center gap-6 p-6">
            <QuestionCard
              question={turn.question}
              difficulty={turn.selectedDifficulty}
              showAnswer={false}
            />
          </div>
        </>
      );

    case 'answering':
      if (!turn) return null;
      return (
        <div className="flex flex-col items-center gap-6 p-6">
          <QuestionCard
            question={turn.question}
            difficulty={turn.selectedDifficulty}
            showAnswer
          />
          {isCurrentPlayer ? (
            <HonorButtons
              onCorrect={() =>
                actions.submitAnswer(room.id, true).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
              onIncorrect={() =>
                actions.submitAnswer(room.id, false).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
            />
          ) : (
            <p className="text-sm text-white/50">
              {currentPlayerName} déclare sa réponse…
            </p>
          )}
        </div>
      );

    case 'revealing_answer':
      if (!turn) return null;
      return (
        <div className="flex flex-col items-center gap-6 p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-4xl font-black ${
              turn.isCorrect ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {turn.isCorrect
              ? `✓ +${turn.selectedDifficulty} CASE${turn.selectedDifficulty > 1 ? 'S' : ''}`
              : '✗ DOMMAGE'}
          </motion.div>
          <QuestionCard
            question={turn.question}
            difficulty={turn.selectedDifficulty}
            showAnswer
          />
          {isHost && (
            <Button
              size="lg"
              onClick={() =>
                actions.nextTurn(room.id).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
            >
              TOUR SUIVANT
            </Button>
          )}
          {!isHost && (
            <p className="text-sm text-white/50">En attente de l'hôte…</p>
          )}
        </div>
      );

    case 'turn_complete':
      return (
        <div className="flex flex-col items-center gap-6 p-6">
          <p className="text-white/60">Tour terminé</p>
        </div>
      );
  }
}

function DebuterPhaseView({ room, currentPlayer }: { room: GameRoom; currentPlayer: Player }) {
  const actions = useGameActions();
  const state = room.gameState!;
  const turn = state.currentTurn;
  const [loading, setLoading] = useState<string | null>(null);
  if (!turn || turn.question.kind !== 'debuter') return null;

  const selectedId = state.firstCorrectDebuterId;
  const selectedPlayer = selectedId
    ? room.players.find((p) => p.id === selectedId) ?? null
    : null;

  const handleSelect = async (playerId: string) => {
    setLoading(playerId);
    try {
      await actions.selectStartingPlayer(room.id, playerId);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-xl">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white">QUI COMMENCE ?</h2>
        <p className="text-sm text-white/60 mt-1">
          Appliquez l'instruction puis désignez le joueur qui démarre
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 w-full">
        <div className="flex items-center justify-between">
          <CategoryBadge category="debuter" />
          <div className="text-xs tracking-[0.2em] text-white/40">
            CARTE #{turn.question.numero}
          </div>
        </div>
        <p className="text-xl leading-relaxed text-white">
          {turn.question.textePrincipal}
        </p>
        {turn.question.texteSecondaire && (
          <div className="mt-1 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">
              EN CAS D'ÉGALITÉ
            </div>
            <p className="text-sm text-white/80 italic">{turn.question.texteSecondaire}</p>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full rounded-2xl border-2 border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 p-5 text-center"
        >
          <div className="text-xs tracking-[0.2em] text-[var(--color-primary)] mb-1">
            COMMENCE LA PARTIE
          </div>
          <div className="text-3xl font-black text-white">
            🏆 {selectedPlayer.pseudo}
          </div>
        </motion.div>
      )}

      {!selectedPlayer && (
        <div className="w-full flex flex-col gap-3">
          <div className="text-center text-xs tracking-[0.2em] text-white/50">
            DÉSIGNE LE JOUEUR QUI DÉMARRE
          </div>
          <div className="grid grid-cols-1 gap-3">
            {room.players.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(p.id)}
                disabled={loading !== null}
                className="flex items-center justify-between rounded-2xl border-2 border-white/20 bg-white/5 px-6 py-4 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
              >
                <span className="text-lg font-bold text-white">
                  {p.pseudo}
                  {p.id === currentPlayer.id && (
                    <span className="text-xs text-white/50 ml-2">(toi)</span>
                  )}
                </span>
                <span className="text-xs tracking-[0.2em] text-[var(--color-primary)]">
                  {loading === p.id ? '...' : 'COMMENCE →'}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
