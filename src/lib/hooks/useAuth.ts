'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Player } from '@/lib/schemas/player.schema';

/**
 * Hook à monter une seule fois au niveau des providers.
 * Récupère le player courant via GET /api/auth/me.
 */
export function useAuthListener() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  useEffect(() => {
    let cancelled = false;
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setUnauthenticated();
          return;
        }
        const data = (await res.json()) as { player: Player | null };
        if (cancelled) return;
        if (data.player) {
          setAuthenticated(data.player.id, data.player);
        } else {
          setUnauthenticated();
        }
      } catch {
        if (!cancelled) setUnauthenticated();
      }
    }
    void fetchMe();
    return () => {
      cancelled = true;
    };
  }, [setAuthenticated, setUnauthenticated]);
}

export function useCurrentPlayer() {
  return useAuthStore((s) => s.player);
}

export function useAuthStatus() {
  return useAuthStore((s) => s.status);
}
