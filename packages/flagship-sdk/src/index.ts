/**
 * FlagShip SDK
 * Feature flags and usage limits for your application
 */

// Main client
export { FlagShipClient } from './client';

// Types
export type {
  FlagShipClientConfig,
  EvaluateRequest,
  EvaluateResponse,
  FeatureResult,
  LimitResult,
  UsageEvent,
  IngestRequest,
  IngestResponse,
  IngestError,
  UsageSummary,
} from './types';

// Errors
export {
  FlagShipError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  RateLimitError,
  NetworkError,
  ServerError,
  FeatureNotFoundError,
  LimitNotFoundError,
  createErrorFromResponse,
} from './errors';

