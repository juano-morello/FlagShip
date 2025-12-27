/**
 * FlagShip SDK Client
 */

import type {
  FlagShipClientConfig,
  EvaluateRequest,
  EvaluateResponse,
  UsageEvent,
  IngestResponse,
  LimitResult,
} from './types';
import {
  FlagShipError,
  LimitNotFoundError,
  NetworkError,
  createErrorFromResponse,
} from './errors';

const DEFAULT_BASE_URL = 'http://localhost:3001';
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

export class FlagShipClient {
  private readonly apiKey: string;
  private readonly environmentId: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(config: FlagShipClientConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }
    if (!config.environmentId) {
      throw new Error('environmentId is required');
    }

    this.apiKey = config.apiKey;
    this.environmentId = config.environmentId;
    this.baseUrl = config.baseUrl?.replace(/\/$/, '') || DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.retries ?? DEFAULT_RETRIES;
    this.retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY;
  }

  /**
   * Evaluate features and limits
   */
  async evaluate(request: EvaluateRequest): Promise<EvaluateResponse> {
    return this.request<EvaluateResponse>('POST', '/v1/evaluate', request);
  }

  /**
   * Ingest usage events
   */
  async ingest(events: UsageEvent | UsageEvent[]): Promise<IngestResponse> {
    const eventsArray = Array.isArray(events) ? events : [events];
    
    // Auto-generate idempotency keys if not provided
    const eventsWithKeys = eventsArray.map((event) => ({
      ...event,
      idempotencyKey: event.idempotencyKey ?? crypto.randomUUID(),
    }));

    return this.request<IngestResponse>('POST', '/v1/usage/ingest', {
      events: eventsWithKeys,
    });
  }

  /**
   * Check if a feature is enabled (convenience method)
   * Returns false for unknown features (fail-safe)
   */
  async isFeatureEnabled(
    key: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    const response = await this.evaluate({
      features: [key],
      context,
    });

    return response.features[key]?.value ?? false;
  }

  /**
   * Get limit status (convenience method)
   * Throws if limit is not found
   */
  async getLimit(key: string): Promise<LimitResult> {
    const response = await this.evaluate({
      limits: [key],
    });

    const limit = response.limits[key];
    if (!limit) {
      throw new LimitNotFoundError(key);
    }

    return limit;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let lastError: FlagShipError | undefined;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'X-Environment': this.environmentId,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        // Parse error response
        const retryAfter = response.headers ? this.parseRetryAfter(response.headers) : undefined;
        const errorBody = await response.json().catch(() => ({})) as {
          message?: string;
          error?: string;
          details?: Record<string, string[]>;
        };
        const error = createErrorFromResponse(response.status, errorBody, retryAfter);

        // Don't retry client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error;
        }

        lastError = error;
      } catch (err) {
        if (err instanceof FlagShipError) {
          // Re-throw FlagShip errors that shouldn't be retried
          if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 429) {
            throw err;
          }
          lastError = err;
        } else {
          lastError = new NetworkError(err instanceof Error ? err.message : 'Unknown error');
        }
      }

      // Calculate delay for next retry with jitter
      if (attempt < this.maxRetries) {
        const baseDelay = lastError instanceof Error && 'retryAfter' in lastError && lastError.retryAfter
          ? (lastError as { retryAfter: number }).retryAfter
          : this.retryDelay * Math.pow(2, attempt);
        // Add 0-10% jitter to prevent thundering herd
        const jitter = baseDelay * Math.random() * 0.1;
        await this.sleep(baseDelay + jitter);
      }

      attempt++;
    }

    throw lastError ?? new NetworkError('Request failed after retries');
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse Retry-After header (seconds to ms)
   */
  private parseRetryAfter(headers: Headers): number | undefined {
    const retryAfter = headers.get('Retry-After');
    if (!retryAfter) return undefined;

    const seconds = parseInt(retryAfter, 10);
    return isNaN(seconds) ? undefined : seconds * 1000;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

