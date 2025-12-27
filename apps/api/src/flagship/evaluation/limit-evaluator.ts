/**
 * Limit Evaluator
 * Evaluates usage limits against current consumption
 */

import { Injectable, Logger } from '@nestjs/common';
import { UsageRepository } from '../usage/usage.repository';
import { LimitResultDto } from './dto';
import type { FlagshipUsageMetric, FlagshipUsageLimit } from '@forgestack/db';

export interface LimitEvaluationContext {
  environmentId: string;
  orgId: string;
  planId?: string;
  debug?: boolean;
}

@Injectable()
export class LimitEvaluator {
  private readonly logger = new Logger(LimitEvaluator.name);

  constructor(private readonly usageRepository: UsageRepository) {}

  /**
   * Evaluate multiple limits
   */
  async evaluateLimits(
    keys: string[],
    ctx: LimitEvaluationContext,
  ): Promise<Record<string, LimitResultDto>> {
    if (keys.length === 0) return {};

    // Fetch current usage and limits in parallel
    const [usageMap, limitsMap] = await Promise.all([
      this.usageRepository.getCurrentUsageMultiple(
        ctx.environmentId,
        ctx.orgId,
        keys,
      ),
      this.usageRepository.getLimitsMultiple(
        ctx.environmentId,
        keys,
        ctx.planId,
      ),
    ]);

    const results: Record<string, LimitResultDto> = {};

    for (const key of keys) {
      const usage = usageMap.get(key);
      const limit = limitsMap.get(key);

      results[key] = this.evaluateSingleLimit(key, usage, limit, ctx);
    }

    return results;
  }

  /**
   * Evaluate a single limit
   */
  private evaluateSingleLimit(
    _key: string,
    usage: FlagshipUsageMetric | undefined,
    limit: FlagshipUsageLimit | undefined,
    ctx: LimitEvaluationContext,
  ): LimitResultDto {
    // No limit defined - allow by default
    if (!limit) {
      return {
        allowed: true,
        current: usage?.currentValue ?? 0,
        limit: -1, // -1 indicates unlimited
        remaining: -1,
        ...(ctx.debug && { reason: 'no_limit_defined' }),
      };
    }

    const currentValue = usage?.currentValue ?? 0;
    const limitValue = limit.limitValue;
    const remaining = Math.max(0, limitValue - currentValue);
    const allowed = currentValue < limitValue;

    // For soft limits, always allow but include warning
    if (limit.enforcement === 'soft') {
      return {
        allowed: true,
        current: currentValue,
        limit: limitValue,
        remaining,
        ...(ctx.debug && {
          reason: allowed ? 'within_soft_limit' : 'soft_limit_exceeded',
        }),
      };
    }

    // Hard limit enforcement
    return {
      allowed,
      current: currentValue,
      limit: limitValue,
      remaining,
      ...(ctx.debug && {
        reason: allowed ? 'within_hard_limit' : 'hard_limit_exceeded',
      }),
    };
  }
}

