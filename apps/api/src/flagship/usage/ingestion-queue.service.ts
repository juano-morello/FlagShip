/**
 * Ingestion Queue Service
 * Handles queueing of usage events for async processing
 */

import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../queue/queue.service';
import type { UsageEventDto } from './dto/ingest.dto';
import type { UsageIngestJobData } from './dto/usage-ingest-job.dto';
import { toJobEvent } from './dto/usage-ingest-job.dto';
import { QUEUE_NAMES } from '@forgestack/shared';

export interface IngestionQueueContext {
  environmentId: string;
  orgId: string;
  projectId: string;
}

export interface EnqueueResult {
  jobId: string;
  queuedAt: string;
}

@Injectable()
export class IngestionQueueService {
  private readonly logger = new Logger(IngestionQueueService.name);

  constructor(private readonly queueService: QueueService) {}

  /**
   * Enqueue usage events for async processing
   */
  async enqueue(
    ctx: IngestionQueueContext,
    events: UsageEventDto[],
    requestId: string,
  ): Promise<EnqueueResult> {
    const queuedAt = new Date().toISOString();

    const jobData: UsageIngestJobData = {
      requestId,
      environmentId: ctx.environmentId,
      orgId: ctx.orgId,
      projectId: ctx.projectId,
      events: events.map(toJobEvent),
      queuedAt,
    };

    const jobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 1000 + Math.floor(Math.random() * 200), // 1000-1200ms with jitter
      },
      removeOnComplete: 100,
      removeOnFail: false, // Keep failed jobs for DLQ routing
    };

    this.logger.debug(
      `Enqueueing ${events.length} events for env=${ctx.environmentId}, requestId=${requestId}`,
    );

    const job = await this.queueService.addJob(
      QUEUE_NAMES.FLAGSHIP_USAGE_INGEST,
      jobData,
      jobOptions,
    );

    this.logger.log(
      `Queued usage ingest job ${job.id} with ${events.length} events for org ${ctx.orgId}`,
    );

    return {
      jobId: job.id!,
      queuedAt,
    };
  }
}

