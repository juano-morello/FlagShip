/**
 * FlagShip Client Tests - TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FlagShipClient } from './client';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  RateLimitError,
  NetworkError,
  ServerError,
  LimitNotFoundError,
} from './errors';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('FlagShipClient', () => {
  let client: FlagShipClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      baseUrl: 'https://api.test.flagship.io',
      retries: 0, // Disable retries for unit tests
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with required config', () => {
      const c = new FlagShipClient({
        apiKey: 'fsk_test',
        environmentId: 'env_123',
      });
      expect(c).toBeInstanceOf(FlagShipClient);
    });

    it('should throw on missing apiKey', () => {
      expect(
        () => new FlagShipClient({ apiKey: '', environmentId: 'env_123' })
      ).toThrow('apiKey is required');
    });

    it('should throw on missing environmentId', () => {
      expect(
        () => new FlagShipClient({ apiKey: 'fsk_test', environmentId: '' })
      ).toThrow('environmentId is required');
    });

    it('should use default baseUrl if not provided', () => {
      const c = new FlagShipClient({
        apiKey: 'fsk_test',
        environmentId: 'env_123',
      });
      expect(c).toBeDefined();
    });
  });

  describe('evaluate()', () => {
    it('should call /v1/evaluate with correct headers', async () => {
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

      await client.evaluate({ features: ['billing_v2'] });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.flagship.io/v1/evaluate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'fsk_test_123',
            'X-Environment': 'env_test_456',
          }),
        })
      );
    });

    it('should return typed EvaluateResponse', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_abc',
          evaluatedAt: '2024-01-15T10:00:00Z',
          features: { billing_v2: { value: true, reason: 'enabled' } },
          limits: { api_calls: { allowed: true, current: 50, limit: 1000, remaining: 950 } },
        }),
      });

      const result = await client.evaluate({
        features: ['billing_v2'],
        limits: ['api_calls'],
      });

      expect(result.requestId).toBe('req_abc');
      expect(result.features.billing_v2.value).toBe(true);
      expect(result.limits.api_calls.allowed).toBe(true);
      expect(result.limits.api_calls.remaining).toBe(950);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      });

      await expect(client.evaluate({ features: ['test'] })).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should throw AuthorizationError on 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Not authorized' }),
      });

      await expect(client.evaluate({ features: ['test'] })).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should throw ValidationError on 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid request' }),
      });

      await expect(client.evaluate({ features: [] })).rejects.toThrow(ValidationError);
    });
  });

  describe('ingest()', () => {
    it('should accept single event and normalize to array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'req_123',
          processedAt: '2024-01-01T00:00:00Z',
          accepted: 1,
          rejected: 0,
        }),
      });

      await client.ingest({ metric: 'api_calls', delta: 1 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.flagship.io/v1/usage/ingest',
        expect.objectContaining({
          body: expect.stringContaining('"events"'),
        })
      );
    });
  });
});

