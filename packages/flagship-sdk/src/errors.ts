/**
 * FlagShip SDK Error Classes
 */

/** Base error class for all FlagShip errors */
export class FlagShipError extends Error {
  /** Error code (e.g., 'UNAUTHORIZED', 'RATE_LIMITED') */
  code: string;

  /** HTTP status code if applicable */
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'FlagShipError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** Invalid or missing API key (401) */
export class AuthenticationError extends FlagShipError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthenticationError';
  }
}

/** API key not authorized for environment (403) */
export class AuthorizationError extends FlagShipError {
  constructor(message = 'API key not authorized for this environment') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'AuthorizationError';
  }
}

/** Request validation failed (400) */
export class ValidationError extends FlagShipError {
  /** Validation error details by field */
  details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/** Rate limit exceeded (429) */
export class RateLimitError extends FlagShipError {
  /** Milliseconds until retry is allowed */
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/** Network connection or timeout error */
export class NetworkError extends FlagShipError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/** Internal server error (5xx) */
export class ServerError extends FlagShipError {
  constructor(message = 'Internal server error', statusCode = 500) {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'ServerError';
  }
}

/** Feature not found error */
export class FeatureNotFoundError extends FlagShipError {
  constructor(featureKey: string) {
    super(`Feature '${featureKey}' not found`, 'FEATURE_NOT_FOUND', 404);
    this.name = 'FeatureNotFoundError';
  }
}

/** Limit not found error */
export class LimitNotFoundError extends FlagShipError {
  constructor(limitKey: string) {
    super(`Limit '${limitKey}' not found`, 'LIMIT_NOT_FOUND', 404);
    this.name = 'LimitNotFoundError';
  }
}

/**
 * Create appropriate error from HTTP response
 */
export function createErrorFromResponse(
  statusCode: number,
  body: { message?: string; error?: string; details?: Record<string, string[]> },
  retryAfter?: number
): FlagShipError {
  const message = body.message || body.error || 'Unknown error';

  switch (statusCode) {
    case 400:
      return new ValidationError(message, body.details);
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 429:
      return new RateLimitError(message, retryAfter);
    default:
      if (statusCode >= 500) {
        return new ServerError(message, statusCode);
      }
      return new FlagShipError(message, 'UNKNOWN_ERROR', statusCode);
  }
}

