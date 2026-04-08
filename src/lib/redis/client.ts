import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn(
    '⚠️  UPSTASH_REDIS_REST_URL/TOKEN non défini — le cache Redis sera désactivé',
  );
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
});

/**
 * Helpers de cache pour les rooms.
 * Le cache est invalidé à chaque mutation ; les reads GET passent par le cache.
 */
export const CACHE_KEYS = {
  room: (id: string) => `ttmc:room:${id}`,
  roomByCode: (code: string) => `ttmc:room-code:${code}`,
  questionsByCategory: (cat: string) => `ttmc:questions:${cat}`,
};

export const CACHE_TTL = {
  room: 30, // secondes — volatile, invalidé sur mutation
  questions: 3600, // 1h — immutable dans la pratique
};

/** Invalide le cache d'une room (après mutation). */
export async function invalidateRoomCache(roomId: string, roomCode?: string): Promise<void> {
  const keys = [CACHE_KEYS.room(roomId)];
  if (roomCode) keys.push(CACHE_KEYS.roomByCode(roomCode));
  try {
    await redis.del(...keys);
  } catch {
    // Silencieux : si Redis est down, on invalide implicitement au prochain read (TTL)
  }
}
