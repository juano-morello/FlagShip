/**
 * FlagShip Module
 * Core module for FlagShip control plane functionality
 */

import { Module } from '@nestjs/common';
import { EnvironmentsModule } from './environments/environments.module';
import { FeaturesModule } from './features/features.module';
import { FlagshipUsageModule } from './usage/usage.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { PlansModule } from './plans/plans.module';
import { AuditModule } from './audit/audit.module';
import { EnvironmentGuard } from './guards/environment.guard';

@Module({
  imports: [
    EnvironmentsModule,
    FeaturesModule,
    FlagshipUsageModule,
    EvaluationModule,
    PlansModule,
    AuditModule,
  ],
  controllers: [],
  providers: [EnvironmentGuard],
  exports: [
    EnvironmentsModule,
    FeaturesModule,
    FlagshipUsageModule,
    EvaluationModule,
    PlansModule,
    AuditModule,
    EnvironmentGuard,
  ],
})
export class FlagshipModule {}

