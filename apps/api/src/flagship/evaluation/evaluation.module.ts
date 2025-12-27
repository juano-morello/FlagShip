/**
 * Evaluation Module
 * Provides the /v1/evaluate endpoint for FlagShip control plane
 */

import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { FeatureEvaluator } from './feature-evaluator';
import { LimitEvaluator } from './limit-evaluator';
import { FeaturesModule } from '../features/features.module';
import { FlagshipUsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../../api-keys/api-keys.module';
import { EnvironmentsModule } from '../environments/environments.module';

@Module({
  imports: [
    FeaturesModule,
    FlagshipUsageModule,
    ApiKeysModule,
    EnvironmentsModule,
  ],
  controllers: [EvaluationController],
  providers: [
    EvaluationService,
    FeatureEvaluator,
    LimitEvaluator,
  ],
  exports: [EvaluationService],
})
export class EvaluationModule {}

