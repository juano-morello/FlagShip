/**
 * Convenience Methods Tests - TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FlagShipClient } from './client';
import { LimitNotFoundError } from './errors';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('FlagShipClient convenience methods', () => {
  let client: FlagShipClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      baseUrl: 'https://api.test.flagship.io',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isFeatureEnabled()', () => {
    it('should return true when feature is enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: { billing_v2: { value: true } },
          limits: {},
        }),
      });

      const result = await client.isFeatureEnabled('billing_v2');
      expect(result).toBe(true);
    });

    it('should return false when feature is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: { billing_v2: { value: false } },
          limits: {},
        }),
      });

      const result = await client.isFeatureEnabled('billing_v2');
      expect(result).toBe(false);
    });

    it('should return false for unknown feature (fail-safe)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: {},
          limits: {},
        }),
      });

      const result = await client.isFeatureEnabled('unknown_feature');
      expect(result).toBe(false);
    });

    it('should pass context to evaluate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: { rollout_feature: { value: true } },
          limits: {},
        }),
      });

      await client.isFeatureEnabled('rollout_feature', { userId: 'usr_123' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"userId"'),
        })
      );
    });
  });

  describe('getLimit()', () => {
    it('should return limit result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: {},
          limits: {
            api_calls: {
              allowed: true,
              current: 100,
              limit: 1000,
              remaining: 900,
            },
          },
        }),
      });

      const result = await client.getLimit('api_calls');

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(100);
      expect(result.limit).toBe(1000);
      expect(result.remaining).toBe(900);
    });

    it('should throw LimitNotFoundError for unknown limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: {},
          limits: {},
        }),
      });

      await expect(client.getLimit('unknown_limit')).rejects.toThrow(
        LimitNotFoundError
      );
    });
  });
});

