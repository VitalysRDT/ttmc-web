import { create } from 'zustand';
import type { Player } from '@/lib/schemas/player.schema';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  firebaseUid: string | null;
  player: Player | null;
  error: string | null;
  setLoading: () => void;
  setAuthenticated: (firebaseUid: string, player: Player | null) => void;
  setUnauthenticated: () => void;
  setPlayer: (player: Player | null) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  firebaseUid: null,
  player: null,
  error: null,
  setLoading: () => set({ status: 'loading', error: null }),
  setAuthenticated: (firebaseUid, player) =>
    set({ status: 'authenticated', firebaseUid, player, error: null }),
  setUnauthenticated: () =>
    set({ status: 'unauthenticated', firebaseUid: null, player: null, error: null }),
  setPlayer: (player) => set({ player }),
  setError: (error) => set({ error }),
}));
