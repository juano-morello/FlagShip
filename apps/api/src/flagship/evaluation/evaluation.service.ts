/**
 * Evaluation Service
 * Orchestrates feature and limit evaluation for the control plane
 */

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FeatureEvaluator, FeatureEvaluationContext } from './feature-evaluator';
import { LimitEvaluator, LimitEvaluationContext } from './limit-evaluator';
import { EvaluateRequestDto, EvaluateResponseDto } from './dto';

export interface EvaluationContext {
  projectId: string;
  environmentId: string;
  orgId: string;
  planId?: string;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly featureEvaluator: FeatureEvaluator,
    private readonly limitEvaluator: LimitEvaluator,
  ) {}

  /**
   * Evaluate features and limits in a single request
   */
  async evaluate(
    dto: EvaluateRequestDto,
    ctx: EvaluationContext,
  ): Promise<EvaluateResponseDto> {
    const requestId = randomUUID();
    const startTime = Date.now();

    this.logger.debug(
      `Evaluating request ${requestId}: ${dto.features?.length ?? 0} features, ${dto.limits?.length ?? 0} limits`,
    );

    // Build evaluation contexts
    const featureCtx: FeatureEvaluationContext = {
      projectId: ctx.projectId,
      environmentId: ctx.environmentId,
      orgId: ctx.orgId,
      planId: ctx.planId,
      context: dto.context,
      debug: dto.debug,
    };

    const limitCtx: LimitEvaluationContext = {
      environmentId: ctx.environmentId,
      orgId: ctx.orgId,
      planId: ctx.planId,
      debug: dto.debug,
    };

    // Evaluate features and limits in parallel
    const [features, limits] = await Promise.all([
      dto.features?.length
        ? this.featureEvaluator.evaluateFeatures(dto.features, featureCtx)
        : Promise.resolve({}),
      dto.limits?.length
        ? this.limitEvaluator.evaluateLimits(dto.limits, limitCtx)
        : Promise.resolve({}),
    ]);

    const duration = Date.now() - startTime;
    this.logger.debug(`Request ${requestId} completed in ${duration}ms`);

    return {
      requestId,
      evaluatedAt: new Date().toISOString(),
      features,
      limits,
    };
  }
}

