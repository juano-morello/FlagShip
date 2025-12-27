/**
 * Usage Ingestion Service
 * Processes usage events with validation and idempotency
 */

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsageRepository } from './usage.repository';
import { IdempotencyService } from './idempotency.service';
import type {
  UsageEventDto,
  IngestResponseDto,
  IngestErrorDto,
  UsageSummaryDto,
} from './dto/ingest.dto';

export interface IngestionContext {
  environmentId: string;
  orgId: string;
  projectId: string;
  planId?: string;
}

export interface IngestionOptions {
  includeSummary?: boolean;
}

// Validation constants
const MAX_FUTURE_HOURS = 1;
const MAX_PAST_DAYS = 7;

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly usageRepository: UsageRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Ingest usage events
   */
  async ingest(
    events: UsageEventDto[],
    ctx: IngestionContext,
    options: IngestionOptions = {},
  ): Promise<IngestResponseDto> {
    const requestId = randomUUID();
    const processedAt = new Date().toISOString();
    const errors: IngestErrorDto[] = [];
    const processedMetrics = new Map<string, number>();
    let skippedDuplicates = 0;

    this.logger.debug(`Processing ${events.length} events for org ${ctx.orgId}`);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Check idempotency first (if key provided)
      if (event.idempotencyKey) {
        const isDuplicate = await this.idempotencyService.checkAndSet(
          ctx.environmentId,
          event.idempotencyKey,
        );
        if (isDuplicate) {
          // Already processed - skip but don't count as error or accepted
          this.logger.debug(`Skipping duplicate event: ${event.idempotencyKey}`);
          skippedDuplicates++;
          continue;
        }
      }

      const validationError = this.validateEvent(event);

      if (validationError) {
        errors.push({ index: i, metric: event.metric, reason: validationError });
        continue;
      }

      try {
        const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
        const result = await this.usageRepository.incrementUsage(
          ctx.environmentId,
          ctx.orgId,
          event.metric,
          event.delta,
          timestamp,
        );
        processedMetrics.set(event.metric, result.currentValue);
      } catch (error) {
        this.logger.error(`Failed to process event ${i}`, error);
        errors.push({ index: i, metric: event.metric, reason: 'processing_failed' });
      }
    }

    const response: IngestResponseDto = {
      requestId,
      processedAt,
      accepted: events.length - errors.length - skippedDuplicates,
      rejected: errors.length,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    if (options.includeSummary && processedMetrics.size > 0) {
      response.summary = await this.buildSummary(ctx, processedMetrics);
    }

    return response;
  }

  /**
   * Validate a single event
   */
  private validateEvent(event: UsageEventDto): string | null {
    if (event.timestamp) {
      const timestamp = new Date(event.timestamp);
      const now = new Date();

      // Check if timestamp is too far in the future
      const maxFuture = new Date(now.getTime() + MAX_FUTURE_HOURS * 60 * 60 * 1000);
      if (timestamp > maxFuture) {
        return `Timestamp too far in future (max ${MAX_FUTURE_HOURS} hour)`;
      }

      // Check if timestamp is too far in the past
      const maxPast = new Date(now.getTime() - MAX_PAST_DAYS * 24 * 60 * 60 * 1000);
      if (timestamp < maxPast) {
        return `Timestamp too far in past (max ${MAX_PAST_DAYS} days)`;
      }
    }

    return null;
  }

  /**
   * Build usage summary for processed metrics
   */
  private async buildSummary(
    ctx: IngestionContext,
    processedMetrics: Map<string, number>,
  ): Promise<Record<string, UsageSummaryDto>> {
    const summary: Record<string, UsageSummaryDto> = {};

    for (const [metricKey, currentValue] of processedMetrics) {
      const limit = await this.usageRepository.getLimit(
        ctx.environmentId,
        metricKey,
        ctx.planId,
      );

      const limitValue = limit?.limitValue ?? -1;
      summary[metricKey] = {
        current: currentValue,
        limit: limitValue,
        remaining: limitValue === -1 ? -1 : Math.max(0, limitValue - currentValue),
      };
    }

    return summary;
  }
}

