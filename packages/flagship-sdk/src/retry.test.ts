/**
 * Retry Logic Tests - TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FlagShipClient } from './client';
import { ServerError } from './errors';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('FlagShipClient retry logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should retry on 500 errors and succeed', async () => {
    // Use no delay to make test fast
    const client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      baseUrl: 'https://api.test.flagship.io',
      retries: 2,
      retryDelay: 1, // 1ms delay for fast tests
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({ message: 'Internal error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: {},
          limits: {},
        }),
      });

    const result = await client.evaluate({ features: ['test'] });
    expect(result.requestId).toBe('req_123');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 400 errors', async () => {
    const client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      retries: 3,
      retryDelay: 1,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ message: 'Bad request' }),
    });

    await expect(client.evaluate({ features: ['test'] })).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should not retry on 401 errors', async () => {
    const client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      retries: 3,
      retryDelay: 1,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ message: 'Unauthorized' }),
    });

    await expect(client.evaluate({ features: ['test'] })).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 with Retry-After header', async () => {
    const client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      retries: 3,
      retryDelay: 1,
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '0' }), // 0 seconds for fast test
        json: async () => ({ message: 'Rate limited' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          requestId: 'req_123',
          evaluatedAt: '2024-01-01T00:00:00Z',
          features: {},
          limits: {},
        }),
      });

    const result = await client.evaluate({ features: ['test'] });
    expect(result.requestId).toBe('req_123');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw ServerError after max retries exceeded', async () => {
    const client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      retries: 2,
      retryDelay: 1,
    });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({ message: 'Internal error' }),
    });

    await expect(client.evaluate({ features: ['test'] })).rejects.toThrow(ServerError);
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should apply jitter to retry delay within expected range', async () => {
    // Mock Math.random to return a predictable value (0.5)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const client = new FlagShipClient({
      apiKey: 'fsk_test_123',
      environmentId: 'env_test_456',
      retries: 2,
      retryDelay: 100, // 100ms base delay
    });

    const sleepSpy = vi.spyOn(client as any, 'sleep');

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'Server error' }),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ features: {} }),
      });

    await client.evaluate({ features: ['test'] });

    // First retry delay should be: baseDelay * 2^0 + jitter
    // With Math.random() = 0.5: 100 * 1 + (100 * 0.5 * 0.1) = 100 + 5 = 105
    expect(sleepSpy).toHaveBeenCalledTimes(1);
    const actualDelay = sleepSpy.mock.calls[0][0];
    expect(actualDelay).toBe(105);

    randomSpy.mockRestore();
  });
});

