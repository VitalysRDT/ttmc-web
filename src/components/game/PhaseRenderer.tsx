'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { QuestionCard } from './QuestionCard';
import { CountdownOverlay } from './CountdownOverlay';
import { DifficultySelector } from './DifficultySelector';
import { HonorButtons } from './HonorButtons';
import { CategoryBadge } from './CategoryBadge';
import {
  selectDifficulty,
  submitAnswer,
  selectStartingPlayer,
  startTurn,
  nextTurnAction,
  revealAnswerAction,
} from '@/lib/api/client-actions';
import { serverNow } from '@/lib/hooks/useServerTime';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';
import { SQUARE_CATEGORIES, CATEGORY_LABELS } from '@/lib/game/board-positions';
import type { GameRoom } from '@/lib/schemas/game-room.schema';
import type { Player } from '@/lib/schemas/player.schema';

interface Props {
  room: GameRoom;
  currentPlayer: Player;
}

export function PhaseRenderer({ room, currentPlayer }: Props) {
  const state = room.gameState;

  const isCurrentPlayer = state?.currentPlayerId === currentPlayer.id;
  const isHost = room.hostId === currentPlayer.id;
  const currentPlayerName =
    room.players.find((p) => p.id === state?.currentPlayerId)?.pseudo ?? 'Joueur';
  const turn = state?.currentTurn;

  const phaseStartedAt = state?.phaseStartedAt ?? null;
  const currentPhase = state?.currentPhase;

  // Auto-transition reading_question → answering après le countdown 5s
  useEffect(() => {
    if (currentPhase !== 'reading_question') return;
    if (!phaseStartedAt) return;
    if (!isCurrentPlayer) return;
    const elapsed = serverNow() - phaseStartedAt.getTime();
    const remaining = GAME_CONSTANTS.readCountdownSeconds * 1000 - elapsed;
    if (remaining <= 0) {
      revealAnswerAction(room.id).catch(() => {});
      return;
    }
    const timer = setTimeout(() => {
      revealAnswerAction(room.id).catch(() => {});
    }, remaining);
    return () => clearTimeout(timer);
  }, [currentPhase, phaseStartedAt, room.id, isCurrentPlayer]);

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
                startTurn(room.id).catch((err) =>
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
              selectDifficulty(room.id, d).catch((err) =>
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
                submitAnswer(room.id, true).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
              onIncorrect={() =>
                submitAnswer(room.id, false).catch((err) =>
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
                nextTurnAction(room.id).catch((err) =>
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

/**
 * Phase Débuter : affiche l'instruction de sélection et permet de désigner
 * le joueur qui commence.
 *
 * Les questions Débuter sont des instructions ("l'équipe la plus nombreuse commence",
 * "le joueur le plus jeune commence", etc.) et pas des questions avec une bonne réponse.
 * Les joueurs appliquent l'instruction puis désignent le joueur qui commence via un clic.
 */
function DebuterPhaseView({ room, currentPlayer }: { room: GameRoom; currentPlayer: Player }) {
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
      await selectStartingPlayer(room.id, playerId);
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

      {/* Instruction Débuter */}
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

      {/* Résultat si déjà désigné */}
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

      {/* Boutons de désignation */}
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
