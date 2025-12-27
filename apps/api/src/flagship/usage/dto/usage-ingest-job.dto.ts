/**
 * Usage Ingest Job DTO
 * Job payload for async usage ingestion via BullMQ
 */

import { UsageEventDto } from './ingest.dto';

/**
 * Job payload for flagship:usage-ingest queue
 */
export interface UsageIngestJobData {
  // Request tracking
  requestId: string;

  // Context (from API authentication)
  environmentId: string;
  orgId: string;
  projectId: string;

  // Events to process
  events: Array<{
    metric: string;
    delta: number;
    timestamp?: string;
    idempotencyKey?: string;
    metadata?: Record<string, string | number>;
  }>;

  // Metadata
  queuedAt: string; // ISO 8601
}

/**
 * Helper to convert UsageEventDto to job event format
 */
export function toJobEvent(event: UsageEventDto): UsageIngestJobData['events'][0] {
  return {
    metric: event.metric,
    delta: event.delta,
    timestamp: event.timestamp,
    idempotencyKey: event.idempotencyKey,
    metadata: event.metadata,
  };
}

