/**
 * Environments Module
 * Provides environment management for FlagShip
 */

import { Module } from '@nestjs/common';
import { EnvironmentsController } from './environments.controller';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsRepository } from './environments.repository';
import { ActivitiesModule } from '../../activities/activities.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ActivitiesModule, AuditModule],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService, EnvironmentsRepository],
  exports: [EnvironmentsService, EnvironmentsRepository],
})
export class EnvironmentsModule {}

