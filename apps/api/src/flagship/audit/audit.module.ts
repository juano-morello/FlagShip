/**
 * Audit Module
 * FlagShip audit events module
 */

import { Module } from '@nestjs/common';
import { QueueModule } from '../../queue/queue.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';

@Module({
  imports: [QueueModule],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}

