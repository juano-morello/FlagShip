/**
 * Idempotency Utilities
 * Shared idempotency logic for FlagShip usage tracking
 */

// Idempotency TTL: 24 hours
export const IDEMPOTENCY_TTL_SECONDS = 86400;
export const KEY_PREFIX = 'idempotency';

/**
 * Redis client interface (minimal subset needed for idempotency)
 */
export interface RedisClient {
  set(
    key: string,
    value: string,
    mode: string,
    duration: number,
    flag: string,
  ): Promise<string | null>;
}

/**
 * Check if idempotency key has been processed
 * 
 * @param redis - Redis client instance (or null if Redis is unavailable)
 * @param environmentId - Environment ID for scoping
 * @param idempotencyKey - Unique key for the operation
 * @returns true if duplicate (key already exists), false if new (or on error)
 */
export async function checkIdempotencyKey(
  redis: RedisClient | null,
  environmentId: string,
  idempotencyKey: string,
): Promise<boolean> {
  if (!redis) return false; // No Redis, allow processing

  try {
    const key = `${KEY_PREFIX}:${environmentId}:${idempotencyKey}`;
    const value = new Date().toISOString();
    const result = await redis.set(key, value, 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');
    return result !== 'OK'; // true if duplicate (key already exists)
  } catch (error) {
    // On error, allow processing (fail open)
    return false;
  }
}

