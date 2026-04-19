'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { GameRoom } from '@/lib/schemas/game-room.schema';
import {
  selectDifficulty as selectDifficultyAction,
  submitAnswer as submitAnswerAction,
  submitIntrepideAnswer as submitIntrepideAnswerAction,
  selectStartingPlayer as selectStartingPlayerAction,
  startTurn as startTurnAction,
  nextTurnAction as nextTurnApiAction,
  revealAnswerAction as revealAnswerApiAction,
  skipCardAction as skipCardApiAction,
  selectModifierCategoryAction as selectModifierCategoryApiAction,
  toggleReady as toggleReadyAction,
  startGame as startGameAction,
  leaveRoom as leaveRoomAction,
  HttpError,
} from '@/lib/api/client-actions';

/**
 * Hook qui expose toutes les mutations de jeu avec mise à jour immédiate du cache
 * TanStack Query. Supprime la latence de polling (jusqu'à 1 s) : dès qu'une mutation
 * réussit, le nouveau `room` retourné par le serveur est injecté via `setQueryData`
 * dans la query `['room', roomId]` — les `useRoomStream` hooks réagissent
 * instantanément.
 *
 * Les erreurs 409 (countdown non écoulé, race condition) sont ignorées silencieusement
 * par `revealAnswerAction` uniquement, puisqu'elles sont attendues quand plusieurs
 * clients tirent simultanément.
 */
export function useGameActions() {
  const queryClient = useQueryClient();

  const applyRoom = useCallback(
    (roomId: string, room: GameRoom | null) => {
      if (room) {
        queryClient.setQueryData(['room', roomId], room);
      }
    },
    [queryClient],
  );

  const actions = useMemo(
    () => ({
      async selectDifficulty(roomId: string, difficulty: number) {
        const room = await selectDifficultyAction(roomId, difficulty);
        applyRoom(roomId, room);
      },
      async submitAnswer(roomId: string, isCorrect: boolean) {
        const room = await submitAnswerAction(roomId, isCorrect);
        applyRoom(roomId, room);
      },
      async submitIntrepideAnswer(
        roomId: string,
        subItemAnswers: Record<string, boolean>,
      ) {
        const room = await submitIntrepideAnswerAction(roomId, subItemAnswers);
        applyRoom(roomId, room);
      },
      async selectStartingPlayer(roomId: string, playerId: string) {
        const room = await selectStartingPlayerAction(roomId, playerId);
        applyRoom(roomId, room);
      },
      async startTurn(roomId: string) {
        const room = await startTurnAction(roomId);
        applyRoom(roomId, room);
      },
      async nextTurn(roomId: string) {
        const room = await nextTurnApiAction(roomId);
        applyRoom(roomId, room);
      },
      async skipCard(roomId: string) {
        const room = await skipCardApiAction(roomId);
        applyRoom(roomId, room);
      },
      async selectModifierCategory(
        roomId: string,
        category: import('@/lib/schemas/enums').QuestionCategory,
      ) {
        const room = await selectModifierCategoryApiAction(roomId, category);
        applyRoom(roomId, room);
      },
      async revealAnswer(roomId: string) {
        try {
          const room = await revealAnswerApiAction(roomId);
          applyRoom(roomId, room);
        } catch (err) {
          // 409 = countdown non écoulé. Silencieux : le serveur a raison, on attend.
          if (err instanceof HttpError && err.status === 409) return;
          throw err;
        }
      },
      async toggleReady(roomId: string) {
        const room = await toggleReadyAction(roomId);
        applyRoom(roomId, room);
      },
      async startGame(roomId: string) {
        const room = await startGameAction(roomId);
        applyRoom(roomId, room);
      },
      async leaveRoom(roomId: string) {
        const room = await leaveRoomAction(roomId);
        applyRoom(roomId, room);
      },
    }),
    [applyRoom],
  );

  return actions;
}
