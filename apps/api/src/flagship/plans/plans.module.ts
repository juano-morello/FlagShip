/**
 * Plans Module
 * Provides plan management functionality
 */

import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PlansRepository } from './plans.repository';
import { ActivitiesModule } from '../../activities/activities.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ActivitiesModule, AuditModule],
  controllers: [PlansController],
  providers: [PlansRepository, PlansService],
  exports: [PlansService, PlansRepository],
})
export class PlansModule {}

