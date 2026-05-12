import IORedis, { type Redis as IORedisType } from 'ioredis';

if (!process.env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL non défini — le cache Redis sera désactivé');
}

let cachedRaw: IORedisType | null = null;
const globalForRedis = globalThis as unknown as { __ioredisClient?: IORedisType };

function getRaw(): IORedisType | null {
  if (cachedRaw) return cachedRaw;
  if (globalForRedis.__ioredisClient) {
    cachedRaw = globalForRedis.__ioredisClient;
    return cachedRaw;
  }
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const client = new IORedis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  client.on('error', (err) => {
    console.warn('[redis] error:', err.message);
  });
  cachedRaw = client;
  if (process.env.NODE_ENV !== 'production') globalForRedis.__ioredisClient = client;
  return cachedRaw;
}

/**
 * Shim API-compatible @upstash/redis (subset utilise par ce repo) :
 * .get<T>(), .set(k,v,{ex}), .del(...keys).
 * Backend ioredis self-hosted. Si REDIS_URL absent, no-op silencieux
 * (preserve le comportement Upstash fallback).
 */
class RedisShim {
  async get<T = unknown>(key: string): Promise<T | null> {
    const io = getRaw();
    if (!io) return null;
    const v = await io.get(key);
    if (v === null) return null;
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as unknown as T;
    }
  }
  async set(
    key: string,
    value: unknown,
    opts?: { ex?: number; px?: number; nx?: boolean },
  ): Promise<'OK' | null> {
    const io = getRaw();
    if (!io) return null;
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    if (opts?.nx && opts?.ex !== undefined) {
      return io.set(key, payload, 'EX', opts.ex, 'NX') as Promise<'OK' | null>;
    }
    if (opts?.nx) {
      return io.set(key, payload, 'NX') as Promise<'OK' | null>;
    }
    if (opts?.ex !== undefined) {
      return io.set(key, payload, 'EX', opts.ex);
    }
    if (opts?.px !== undefined) {
      return io.set(key, payload, 'PX', opts.px);
    }
    return io.set(key, payload);
  }
  async del(...keys: string[]): Promise<number> {
    if (!keys.length) return 0;
    const io = getRaw();
    if (!io) return 0;
    return io.del(...keys);
  }
}

export const redis = new RedisShim();

export const CACHE_KEYS = {
  room: (id: string) => `ttmc:room:${id}`,
  roomByCode: (code: string) => `ttmc:room-code:${code}`,
  questionsByCategory: (cat: string) => `ttmc:questions:${cat}`,
};

export const CACHE_TTL = {
  room: 30,
  questions: 3600,
};

export async function invalidateRoomCache(roomId: string, roomCode?: string): Promise<void> {
  const keys = [CACHE_KEYS.room(roomId)];
  if (roomCode) keys.push(CACHE_KEYS.roomByCode(roomCode));
  try {
    await redis.del(...keys);
  } catch {
    // Silencieux : invalidation implicite au prochain read (TTL)
  }
}
