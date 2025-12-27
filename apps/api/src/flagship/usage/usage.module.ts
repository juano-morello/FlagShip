/**
 * FlagShip Usage Module
 * Provides usage metrics, limits management, and ingestion for FlagShip control plane
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '../../queue/queue.module';
import { UsageRepository } from './usage.repository';
import { IngestionService } from './ingestion.service';
import { IngestionQueueService } from './ingestion-queue.service';
import { IngestionController } from './ingestion.controller';
import { IdempotencyService } from './idempotency.service';

@Module({
  imports: [ConfigModule, QueueModule],
  controllers: [IngestionController],
  providers: [
    UsageRepository,
    IngestionService,
    IngestionQueueService,
    IdempotencyService,
  ],
  exports: [UsageRepository, IngestionService, IngestionQueueService, IdempotencyService],
})
export class FlagshipUsageModule {}

