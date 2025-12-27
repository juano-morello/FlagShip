/**
 * FlagShip Usage Ingest Handler
 * Processes queued usage events asynchronously
 */

import { Job } from 'bullmq';
import IORedis from 'ioredis';
import {
  withServiceContext,
  flagshipUsageMetrics,
  eq,
  and,
  sql,
} from '@forgestack/db';
import {
  checkIdempotencyKey,
  calculatePeriodBoundaries,
  QUEUE_NAMES,
} from '@forgestack/shared';
import { createLogger } from '../telemetry/logger';
import { config } from '../config';

const logger = createLogger('FlagshipUsageIngest');

/**
 * Job data structure for flagship:usage-ingest queue
 */
export interface FlagshipUsageIngestJobData {
  requestId: string;
  environmentId: string;
  orgId: string;
  projectId: string;
  events: Array<{
    metric: string;
    delta: number;
    timestamp?: string;
    idempotencyKey?: string;
    metadata?: Record<string, string | number>;
  }>;
  queuedAt: string;
}

/**
 * Result of processing the job
 */
export interface UsageIngestResult {
  success: boolean;
  processed: number;
  skipped: number;
}

// Initialize Redis for idempotency
let redis: IORedis | null = null;
function getRedis(): IORedis | null {
  if (!redis && config.redis.url) {
    redis = new IORedis(config.redis.url, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    redis.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error in usage ingest handler');
    });
  }
  return redis;
}



/**
 * Increment usage for a metric (atomic upsert)
 */
async function incrementUsage(
  environmentId: string,
  orgId: string,
  metricKey: string,
  delta: number,
  timestamp: Date,
): Promise<void> {
  await withServiceContext('UsageIngest.incrementUsage', async (tx) => {
    // Calculate period boundaries (monthly) using shared utility
    const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

    // Try to find existing record
    const [existing] = await tx
      .select()
      .from(flagshipUsageMetrics)
      .where(
        and(
          eq(flagshipUsageMetrics.environmentId, environmentId),
          eq(flagshipUsageMetrics.orgId, orgId),
          eq(flagshipUsageMetrics.metricKey, metricKey),
          eq(flagshipUsageMetrics.periodStart, periodStart),
        ),
      )
      .limit(1);

    if (existing) {
      // Atomic increment
      await tx
        .update(flagshipUsageMetrics)
        .set({
          currentValue: sql`${flagshipUsageMetrics.currentValue} + ${delta}`,
          lastUpdatedAt: new Date(),
        })
        .where(eq(flagshipUsageMetrics.id, existing.id));
    } else {
      // Insert new record
      await tx.insert(flagshipUsageMetrics).values({
        environmentId,
        orgId,
        metricKey,
        currentValue: Math.max(0, delta),
        periodStart,
        periodEnd,
      });
    }
  });
}

/**
 * Handle flagship:usage-ingest job
 */
export async function handleFlagshipUsageIngest(
  job: Job<FlagshipUsageIngestJobData>,
): Promise<UsageIngestResult> {
  const { requestId, environmentId, orgId, events } = job.data;

  logger.info(
    { jobId: job.id, requestId, environmentId, eventCount: events.length },
    'Processing usage ingest job',
  );

  let processed = 0;
  let skipped = 0;

  for (const event of events) {
    // Check idempotency using shared utility
    if (event.idempotencyKey) {
      const redisClient = getRedis();
      const isDuplicate = await checkIdempotencyKey(
        redisClient,
        environmentId,
        event.idempotencyKey,
      );
      if (isDuplicate) {
        logger.debug({ idempotencyKey: event.idempotencyKey }, 'Skipping duplicate event');
        skipped++;
        continue;
      }
    }

    // Process event
    const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
    await incrementUsage(environmentId, orgId, event.metric, event.delta, timestamp);
    processed++;
  }

  logger.info(
    { jobId: job.id, requestId, processed, skipped },
    'Usage ingest completed',
  );

  return {
    success: true,
    processed,
    skipped,
  };
}

