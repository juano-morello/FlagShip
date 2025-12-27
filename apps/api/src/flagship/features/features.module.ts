/**
 * FlagShip Features Module
 * Provides feature flag management for FlagShip control plane
 */

import { Module, forwardRef } from '@nestjs/common';
import { ActivitiesModule } from '../../activities/activities.module';
import { AuditModule } from '../audit/audit.module';
import { FeaturesRepository } from './features.repository';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';

@Module({
  imports: [forwardRef(() => ActivitiesModule), AuditModule],
  controllers: [FeaturesController],
  providers: [FeaturesRepository, FeaturesService],
  exports: [FeaturesRepository, FeaturesService],
})
export class FeaturesModule {}

