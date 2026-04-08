'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { QuestionCard } from './QuestionCard';
import { CountdownOverlay } from './CountdownOverlay';
import { DifficultySelector } from './DifficultySelector';
import { HonorButtons } from './HonorButtons';
import {
  selectDifficulty,
  submitAnswer,
  submitDebuterAnswer,
  startTurn,
  nextTurnAction,
  revealAnswerAction,
  commitDebuterTransition,
} from '@/lib/api/client-actions';
import { serverNow } from '@/lib/hooks/useServerTime';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';
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

  const phaseTransitionAt = state?.phaseTransitionAt ?? null;
  const phaseStartedAt = state?.phaseStartedAt ?? null;
  const currentPhase = state?.currentPhase;

  // Fix bug #3 : seul le host déclenche la transition après Débuter
  useEffect(() => {
    if (currentPhase !== 'debuter_question') return;
    if (!phaseTransitionAt) return;
    if (!isHost) return;
    const delay = phaseTransitionAt.getTime() - serverNow();
    const timer = setTimeout(
      () => {
        commitDebuterTransition(room.id).catch(() => {});
      },
      Math.max(0, delay),
    );
    return () => clearTimeout(timer);
  }, [currentPhase, phaseTransitionAt, room.id, isHost]);

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

    case 'waiting_to_start':
      return (
        <div className="flex flex-col items-center gap-6 p-6">
          <h2 className="text-center text-3xl font-black text-white">
            {isCurrentPlayer ? 'C\'EST À TOI' : `AU TOUR DE ${currentPlayerName.toUpperCase()}`}
          </h2>
          {isCurrentPlayer && (
            <Button
              size="lg"
              onClick={() =>
                startTurn(room.id).catch((err) =>
                  alert(err instanceof Error ? err.message : String(err)),
                )
              }
            >
              DÉBUTER
            </Button>
          )}
        </div>
      );

    case 'selecting_difficulty':
      if (!turn || turn.question.kind !== 'standard') return null;
      return (
        <div className="flex flex-col items-center gap-6 p-6">
          <div className="text-center text-sm tracking-[0.2em] text-white/60">
            THÈME : {turn.question.theme}
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
          {isCurrentPlayer && (
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
            {turn.isCorrect ? '✓ BRAVO' : '✗ DOMMAGE'}
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
  const state = room.gameState!;
  const turn = state.currentTurn;
  const [revealed, setRevealed] = useState(false);
  if (!turn || turn.question.kind !== 'debuter') return null;

  const hasAnswered = !!state.debuterAnswers[currentPlayer.id];
  const firstCorrect = state.firstCorrectDebuterId;
  const firstCorrectName = firstCorrect
    ? (room.players.find((p) => p.id === firstCorrect)?.pseudo ?? '?')
    : null;

  const handleAnswer = async (isCorrect: boolean) => {
    try {
      await submitDebuterAnswer(room.id, isCorrect);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white">QUI COMMENCE ?</h2>
        <p className="text-sm text-white/60 mt-1">
          Le premier à trouver la réponse commence la partie
        </p>
      </div>

      <QuestionCard question={turn.question} showAnswer={revealed} />

      {!revealed && (
        <Button size="md" variant="secondary" onClick={() => setRevealed(true)}>
          RÉVÉLER LA RÉPONSE
        </Button>
      )}

      {firstCorrect && (
        <div className="text-center text-[var(--color-primary)] font-bold">
          🏆 {firstCorrectName} commence la partie !
        </div>
      )}

      {!hasAnswered && !firstCorrect && (
        <HonorButtons
          onCorrect={() => handleAnswer(true)}
          onIncorrect={() => handleAnswer(false)}
        />
      )}
      {hasAnswered && !firstCorrect && (
        <p className="text-white/60 text-center">En attente des autres joueurs…</p>
      )}
    </div>
  );
}
