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
 *
 * Particularité : `startedAt` peut être légèrement dans le futur (buffer +600ms posé
 * côté serveur dans `selectDifficulty`). On gère ce cas en affichant `durationSec`
 * jusqu'à ce que l'instant démarre vraiment.
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
      const now = serverNow();
      const elapsedSec = (now - startTs) / 1000;
      if (elapsedSec < 0) {
        // startedAt est dans le futur (buffer serveur) — on affiche la durée totale
        setRemaining(durationSec);
        return;
      }
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
