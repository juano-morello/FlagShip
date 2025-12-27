/**
 * Idempotency Utilities Tests
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkIdempotencyKey, IDEMPOTENCY_TTL_SECONDS, KEY_PREFIX } from '../idempotency';

// Mock Redis client
const createMockRedis = () => ({
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  quit: vi.fn(),
  on: vi.fn(),
});

describe('Idempotency Utilities', () => {
  describe('checkIdempotencyKey', () => {
    let mockRedis: ReturnType<typeof createMockRedis>;

    beforeEach(() => {
      mockRedis = createMockRedis();
    });

    it('should return false when key is successfully set (first time)', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const isDuplicate = await checkIdempotencyKey(
        mockRedis as any,
        'env_123',
        'key_abc',
      );

      expect(isDuplicate).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `${KEY_PREFIX}:env_123:key_abc`,
        expect.any(String),
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
        'NX',
      );
    });

    it('should return true when key already exists (duplicate)', async () => {
      mockRedis.set.mockResolvedValue(null);

      const isDuplicate = await checkIdempotencyKey(
        mockRedis as any,
        'env_123',
        'key_abc',
      );

      expect(isDuplicate).toBe(true);
    });

    it('should return false when Redis is null (no Redis available)', async () => {
      const isDuplicate = await checkIdempotencyKey(null, 'env_123', 'key_abc');

      expect(isDuplicate).toBe(false);
    });

    it('should return false on Redis error (allow processing)', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));

      const isDuplicate = await checkIdempotencyKey(
        mockRedis as any,
        'env_123',
        'key_abc',
      );

      expect(isDuplicate).toBe(false);
    });

    it('should use correct key format', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await checkIdempotencyKey(mockRedis as any, 'env_xyz', 'key_123');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'idempotency:env_xyz:key_123',
        expect.any(String),
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
        'NX',
      );
    });

    it('should set TTL to 24 hours', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await checkIdempotencyKey(mockRedis as any, 'env_123', 'key_abc');

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        86400, // 24 hours in seconds
        'NX',
      );
    });

    it('should store ISO timestamp as value', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await checkIdempotencyKey(mockRedis as any, 'env_123', 'key_abc');

      const storedValue = mockRedis.set.mock.calls[0]?.[1];
      expect(storedValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Constants', () => {
    it('should export IDEMPOTENCY_TTL_SECONDS', () => {
      expect(IDEMPOTENCY_TTL_SECONDS).toBe(86400);
    });

    it('should export KEY_PREFIX', () => {
      expect(KEY_PREFIX).toBe('idempotency');
    });
  });
});

