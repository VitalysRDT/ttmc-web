'use client';

import { useEffect, useState } from 'react';
import { serverNow } from './useServerTime';
import { GAME_CONSTANTS } from '@/lib/schemas/enums';

/**
 * Countdown server-driven.
 *
 * Fix bug #1 : le CountdownOverlay Flutter utilisait un bool local qui pouvait être
 * court-circuité si la phase changeait rapidement. Ici, le countdown est calculé
 * uniquement à partir de `startedAt` (timestamp serveur) — tous les clients voient
 * exactement le même compte à rebours.
 */
export function useCountdown(startedAt: Date | null | undefined, durationSec: number): number {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    if (!startedAt) {
      setRemaining(durationSec);
      return;
    }
    const startTs = startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime();
    const tick = () => {
      const elapsedSec = (serverNow() - startTs) / 1000;
      const left = Math.max(0, Math.ceil(durationSec - elapsedSec));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startedAt, durationSec]);

  return remaining;
}

/**
 * Retourne le temps restant en secondes pour la phase courante.
 */
export function useServerTimer(
  phaseStartedAt: Date | null | undefined,
  timeLimitSec: number = GAME_CONSTANTS.defaultTimeLimit,
): number {
  return useCountdown(phaseStartedAt, timeLimitSec);
}
