/**
 * Feature Evaluator
 * Evaluates feature flags using the chain: override → plan → percentage → default
 */

import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { FeaturesRepository, FeatureWithRules } from '../features/features.repository';
import { FeatureResultDto } from './dto';
import type { FlagshipFeatureRule } from '@forgestack/db';

/**
 * Rule value types (stored as jsonb in the database)
 */
interface OverrideRuleValue {
  enabled: boolean;
  conditions?: Record<string, unknown>;
}

interface PercentageRuleValue {
  percentage: number;
}

interface PlanGateRuleValue {
  plans: string[];
}

type RuleValue = OverrideRuleValue | PercentageRuleValue | PlanGateRuleValue;

export interface FeatureEvaluationContext {
  projectId: string;
  environmentId: string;
  orgId: string;
  planId?: string;
  context?: Record<string, unknown>;
  debug?: boolean;
}

@Injectable()
export class FeatureEvaluator {
  private readonly logger = new Logger(FeatureEvaluator.name);

  constructor(private readonly featuresRepository: FeaturesRepository) {}

  /**
   * Evaluate multiple features
   */
  async evaluateFeatures(
    keys: string[],
    ctx: FeatureEvaluationContext,
  ): Promise<Record<string, FeatureResultDto>> {
    if (keys.length === 0) return {};

    const featuresWithRules = await this.featuresRepository.findFeaturesWithRules(
      ctx.projectId,
      ctx.environmentId,
      keys,
    );

    const results: Record<string, FeatureResultDto> = {};

    for (const key of keys) {
      const feature = featuresWithRules.get(key);
      if (!feature) {
        results[key] = {
          value: false,
          ...(ctx.debug && { reason: 'feature_not_found' }),
        };
        continue;
      }

      results[key] = await this.evaluateSingleFeature(feature, ctx);
    }

    return results;
  }

  /**
   * Evaluate a single feature using the evaluation chain
   */
  private async evaluateSingleFeature(
    feature: FeatureWithRules,
    ctx: FeatureEvaluationContext,
  ): Promise<FeatureResultDto> {
    // Check if feature is globally disabled
    if (!feature.enabled) {
      return {
        value: false,
        ...(ctx.debug && { reason: 'feature_disabled' }),
      };
    }

    // 1. Check for override rules (highest priority)
    const overrideResult = this.evaluateOverrideRules(feature.rules, ctx);
    if (overrideResult !== null) {
      return {
        value: overrideResult,
        ...(ctx.debug && { reason: 'override_rule' }),
      };
    }

    // 2. Check plan-based access via rules
    if (feature.type === 'plan') {
      const planResult = this.evaluatePlanRules(feature.rules, ctx);
      if (planResult !== null) {
        return {
          value: planResult,
          ...(ctx.debug && { reason: planResult ? 'plan_access' : 'plan_not_included' }),
        };
      }
      // Also check plan_features table
      if (ctx.planId) {
        const hasAccess = await this.featuresRepository.isFeatureInPlan(
          feature.id,
          ctx.planId,
        );
        return {
          value: hasAccess,
          ...(ctx.debug && { reason: hasAccess ? 'plan_access' : 'plan_not_included' }),
        };
      }
    }

    // 3. Check percentage rollout via rules
    if (feature.type === 'percentage') {
      const percentageResult = this.evaluatePercentageRules(feature.key, feature.rules, ctx);
      if (percentageResult !== null) {
        return {
          value: percentageResult,
          ...(ctx.debug && { reason: percentageResult ? 'percentage_included' : 'percentage_excluded' }),
        };
      }
    }

    // 4. Return default value
    return {
      value: feature.defaultValue,
      ...(ctx.debug && { reason: 'default_value' }),
    };
  }

  /**
   * Evaluate override rules (sorted by priority)
   */
  private evaluateOverrideRules(
    rules: FlagshipFeatureRule[],
    ctx: FeatureEvaluationContext,
  ): boolean | null {
    const overrideRules = rules.filter((r) => r.ruleType === 'override');

    for (const rule of overrideRules) {
      const ruleValue = rule.value as OverrideRuleValue;
      if (this.matchesConditions(ruleValue.conditions, ctx)) {
        return ruleValue.enabled;
      }
    }
    return null;
  }

  /**
   * Evaluate plan gate rules
   */
  private evaluatePlanRules(
    rules: FlagshipFeatureRule[],
    ctx: FeatureEvaluationContext,
  ): boolean | null {
    if (!ctx.planId) return null;

    const planRules = rules.filter((r) => r.ruleType === 'plan_gate');

    for (const rule of planRules) {
      const ruleValue = rule.value as PlanGateRuleValue;
      if (ruleValue.plans?.includes(ctx.planId)) {
        return true;
      }
    }

    return planRules.length > 0 ? false : null;
  }

  /**
   * Evaluate percentage rollout rules
   */
  private evaluatePercentageRules(
    featureKey: string,
    rules: FlagshipFeatureRule[],
    ctx: FeatureEvaluationContext,
  ): boolean | null {
    const percentageRules = rules.filter((r) => r.ruleType === 'percentage');

    for (const rule of percentageRules) {
      const ruleValue = rule.value as PercentageRuleValue;
      if (typeof ruleValue.percentage === 'number') {
        return this.evaluatePercentage(featureKey, ruleValue.percentage, ctx);
      }
    }
    return null;
  }

  /**
   * Check if context matches rule conditions
   */
  private matchesConditions(
    conditions: Record<string, unknown> | undefined,
    ctx: FeatureEvaluationContext,
  ): boolean {
    // No conditions means always match
    if (!conditions || Object.keys(conditions).length === 0) return true;
    if (!ctx.context) return false;

    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = ctx.context[key];
      if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Deterministic percentage evaluation using consistent hashing
   */
  private evaluatePercentage(
    featureKey: string,
    percentage: number,
    ctx: FeatureEvaluationContext,
  ): boolean {
    // Use userId from context, or orgId as fallback
    const identifier = (ctx.context?.userId as string) || ctx.orgId;
    const hashInput = `${featureKey}:${identifier}`;

    const hash = createHash('sha256').update(hashInput).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const normalizedValue = (hashValue / 0xffffffff) * 100;

    return normalizedValue < percentage;
  }
}

