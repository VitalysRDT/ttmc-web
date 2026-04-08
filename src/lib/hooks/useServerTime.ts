'use client';

import { useEffect } from 'react';

/**
 * Synchronise l'horloge du client avec le serveur via GET /api/time.
 * Remplace `.info/serverTimeOffset` de Firebase Realtime Database (fix bug #4).
 */

let cachedOffset = 0;
let initialized = false;

async function measureOffset(): Promise<void> {
  try {
    const start = Date.now();
    const res = await fetch('/api/time', { cache: 'no-store' });
    const rtt = Date.now() - start;
    const { serverTime } = (await res.json()) as { serverTime: number };
    // Estimation simple : serverTime représente l'instant au milieu du round-trip
    cachedOffset = serverTime + rtt / 2 - Date.now();
  } catch {
    cachedOffset = 0;
  }
}

export function serverNow(): number {
  return Date.now() + cachedOffset;
}

export function getServerOffset(): number {
  return cachedOffset;
}

/** Hook à monter une fois dans les providers : mesure + re-mesure toutes les 5 min. */
export function useServerTimeSync(): void {
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    void measureOffset();
    const interval = setInterval(() => {
      void measureOffset();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
