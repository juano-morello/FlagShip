/**
 * FlagShip Usage Repository
 * Data access layer for usage metrics and limits
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  flagshipUsageMetrics,
  flagshipUsageLimits,
  FlagshipUsageMetric,
  FlagshipUsageLimit,
  withServiceContext,
  eq,
  and,
  inArray,
  lte,
  gte,
  sql,
} from '@forgestack/db';

export interface UsageWithLimit {
  metric: FlagshipUsageMetric | null;
  limit: FlagshipUsageLimit | null;
}

@Injectable()
export class UsageRepository {
  private readonly logger = new Logger(UsageRepository.name);

  /**
   * Get current usage for a specific metric in an environment
   */
  async getCurrentUsage(
    environmentId: string,
    orgId: string,
    metricKey: string,
  ): Promise<FlagshipUsageMetric | null> {
    const now = new Date();

    return withServiceContext('UsageRepository.getCurrentUsage', async (tx) => {
      const [metric] = await tx
        .select()
        .from(flagshipUsageMetrics)
        .where(
          and(
            eq(flagshipUsageMetrics.environmentId, environmentId),
            eq(flagshipUsageMetrics.orgId, orgId),
            eq(flagshipUsageMetrics.metricKey, metricKey),
            lte(flagshipUsageMetrics.periodStart, now),
            gte(flagshipUsageMetrics.periodEnd, now),
          ),
        )
        .limit(1);
      return metric || null;
    });
  }

  /**
   * Get current usage for multiple metrics
   */
  async getCurrentUsageMultiple(
    environmentId: string,
    orgId: string,
    metricKeys: string[],
  ): Promise<Map<string, FlagshipUsageMetric>> {
    if (metricKeys.length === 0) return new Map();

    const now = new Date();

    return withServiceContext('UsageRepository.getCurrentUsageMultiple', async (tx) => {
      const metrics = await tx
        .select()
        .from(flagshipUsageMetrics)
        .where(
          and(
            eq(flagshipUsageMetrics.environmentId, environmentId),
            eq(flagshipUsageMetrics.orgId, orgId),
            inArray(flagshipUsageMetrics.metricKey, metricKeys),
            lte(flagshipUsageMetrics.periodStart, now),
            gte(flagshipUsageMetrics.periodEnd, now),
          ),
        );

      const result = new Map<string, FlagshipUsageMetric>();
      for (const metric of metrics) {
        result.set(metric.metricKey, metric);
      }
      return result;
    });
  }

  /**
   * Get limit definition for a metric (with optional plan-specific limit)
   */
  async getLimit(
    environmentId: string,
    metricKey: string,
    planId?: string,
  ): Promise<FlagshipUsageLimit | null> {
    return withServiceContext('UsageRepository.getLimit', async (tx) => {
      // First try to find plan-specific limit
      if (planId) {
        const [planLimit] = await tx
          .select()
          .from(flagshipUsageLimits)
          .where(
            and(
              eq(flagshipUsageLimits.environmentId, environmentId),
              eq(flagshipUsageLimits.metricKey, metricKey),
              eq(flagshipUsageLimits.planId, planId),
            ),
          )
          .limit(1);
        if (planLimit) return planLimit;
      }

      // Fallback to default limit (no plan)
      const [defaultLimit] = await tx
        .select()
        .from(flagshipUsageLimits)
        .where(
          and(
            eq(flagshipUsageLimits.environmentId, environmentId),
            eq(flagshipUsageLimits.metricKey, metricKey),
          ),
        )
        .limit(1);
      return defaultLimit || null;
    });
  }

  /**
   * Get limits for multiple metrics
   */
  async getLimitsMultiple(
    environmentId: string,
    metricKeys: string[],
    planId?: string,
  ): Promise<Map<string, FlagshipUsageLimit>> {
    if (metricKeys.length === 0) return new Map();

    return withServiceContext('UsageRepository.getLimitsMultiple', async (tx) => {
      // Get all limits for the environment and metric keys
      const limits = await tx
        .select()
        .from(flagshipUsageLimits)
        .where(
          and(
            eq(flagshipUsageLimits.environmentId, environmentId),
            inArray(flagshipUsageLimits.metricKey, metricKeys),
          ),
        );

      // Build result map, preferring plan-specific limits
      const result = new Map<string, FlagshipUsageLimit>();
      
      for (const limit of limits) {
        const existing = result.get(limit.metricKey);
        // Prefer plan-specific limit if planId matches
        if (planId && limit.planId === planId) {
          result.set(limit.metricKey, limit);
        } else if (!existing && !limit.planId) {
          // Use default limit if no plan-specific one yet
          result.set(limit.metricKey, limit);
        }
      }

      return result;
    });
  }

  /**
   * Increment usage for a metric (atomic upsert)
   * Creates the metric record if it doesn't exist
   */
  async incrementUsage(
    environmentId: string,
    orgId: string,
    metricKey: string,
    delta: number,
    timestamp: Date,
  ): Promise<{ currentValue: number }> {
    return withServiceContext('UsageRepository.incrementUsage', async (tx) => {
      // Calculate period boundaries (monthly by default)
      const periodStart = new Date(timestamp.getFullYear(), timestamp.getMonth(), 1);
      const periodEnd = new Date(timestamp.getFullYear(), timestamp.getMonth() + 1, 0, 23, 59, 59, 999);

      // Try to find existing record for this period
      const [existing] = await tx
        .select()
        .from(flagshipUsageMetrics)
        .where(
          and(
            eq(flagshipUsageMetrics.environmentId, environmentId),
            eq(flagshipUsageMetrics.orgId, orgId),
            eq(flagshipUsageMetrics.metricKey, metricKey),
            eq(flagshipUsageMetrics.periodStart, periodStart),
          ),
        )
        .limit(1);

      if (existing) {
        // Atomic increment
        const [updated] = await tx
          .update(flagshipUsageMetrics)
          .set({
            currentValue: sql`${flagshipUsageMetrics.currentValue} + ${delta}`,
            lastUpdatedAt: new Date(),
          })
          .where(eq(flagshipUsageMetrics.id, existing.id))
          .returning();
        return { currentValue: updated.currentValue };
      } else {
        // Insert new record
        const [inserted] = await tx
          .insert(flagshipUsageMetrics)
          .values({
            environmentId,
            orgId,
            metricKey,
            currentValue: Math.max(0, delta), // Don't allow negative initial values
            periodStart,
            periodEnd,
          })
          .returning();
        return { currentValue: inserted.currentValue };
      }
    });
  }
}
