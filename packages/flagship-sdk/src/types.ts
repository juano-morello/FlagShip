/**
 * FlagShip SDK Types
 */

// ============ Configuration ============

export interface FlagShipClientConfig {
  /** FlagShip API key (fsk_xxx) */
  apiKey: string;

  /** Target environment ID (env_xxx) */
  environmentId: string;

  /** Base URL for FlagShip API (default: http://localhost:3001) */
  baseUrl?: string;

  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;

  /** Maximum retry attempts for transient errors (default: 3) */
  retries?: number;

  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
}

// ============ Evaluate Types ============

export interface EvaluateRequest {
  /** Feature keys to evaluate */
  features?: string[];

  /** Limit metrics to check */
  limits?: string[];

  /** Evaluation context (e.g., userId for percentage rollouts) */
  context?: Record<string, unknown>;

  /** Include debug information in response */
  debug?: boolean;
}

export interface EvaluateResponse {
  /** Request tracking ID */
  requestId: string;

  /** Timestamp of evaluation */
  evaluatedAt: string;

  /** Feature evaluation results keyed by feature key */
  features: Record<string, FeatureResult>;

  /** Limit check results keyed by limit key */
  limits: Record<string, LimitResult>;
}

export interface FeatureResult {
  /** Evaluated value (true/false for boolean features) */
  value: boolean;

  /** Reason for the evaluation result (if debug=true) */
  reason?: string;
}

export interface LimitResult {
  /** Whether the limit allows the operation */
  allowed: boolean;

  /** Current usage value */
  current: number;

  /** Maximum limit value */
  limit: number;

  /** Remaining capacity */
  remaining: number;

  /** Reason for the limit status (if debug=true) */
  reason?: string;
}

// ============ Ingest Types ============

export interface UsageEvent {
  /** Metric identifier (e.g., "api_calls", "storage_bytes") */
  metric: string;

  /** Change amount (positive to increment, negative to decrement) */
  delta: number;

  /** When the event occurred (ISO 8601). Defaults to server time. */
  timestamp?: string;

  /** Idempotency key to prevent duplicate processing */
  idempotencyKey?: string;

  /** Additional context for the event */
  metadata?: Record<string, string | number>;
}

export interface IngestRequest {
  events: UsageEvent[];
}

export interface IngestResponse {
  /** Request tracking ID */
  requestId: string;

  /** When the request was processed */
  processedAt: string;

  /** Number of events accepted */
  accepted: number;

  /** Number of events rejected */
  rejected: number;

  /** Details for rejected events */
  errors?: IngestError[];

  /** Current usage summary per metric after ingestion */
  summary?: Record<string, UsageSummary>;
}

export interface IngestError {
  /** Index of the rejected event in the request */
  index: number;

  /** Metric key of the rejected event */
  metric: string;

  /** Reason for rejection */
  reason: string;
}

export interface UsageSummary {
  /** Current usage value */
  current: number;

  /** Configured limit (-1 for unlimited) */
  limit: number;

  /** Remaining capacity (-1 for unlimited) */
  remaining: number;
}

