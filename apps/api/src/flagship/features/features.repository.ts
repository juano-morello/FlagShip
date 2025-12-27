/**
 * FlagShip Features Repository
 * Data access layer for FlagShip feature flags and rules
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  flagshipFeatures,
  flagshipFeatureRules,
  flagshipPlanFeatures,
  environments,
  projects,
  FlagshipFeature,
  NewFlagshipFeature,
  FlagshipFeatureRule,
  withServiceContext,
  eq,
  and,
  or,
  ilike,
  inArray,
  desc,
  count,
} from '@forgestack/db';

export interface FindAllOptions {
  search?: string;
  type?: 'boolean' | 'percentage' | 'plan';
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedFeatures {
  items: FlagshipFeature[];
  total: number;
  page: number;
  limit: number;
}

export interface FeatureWithRules extends FlagshipFeature {
  rules: FlagshipFeatureRule[];
}

@Injectable()
export class FeaturesRepository {
  private readonly logger = new Logger(FeaturesRepository.name);

  /**
   * Find a feature by key within a project
   */
  async findByKey(projectId: string, key: string): Promise<FlagshipFeature | null> {
    return withServiceContext('FeaturesRepository.findByKey', async (tx) => {
      const [feature] = await tx
        .select()
        .from(flagshipFeatures)
        .where(
          and(
            eq(flagshipFeatures.projectId, projectId),
            eq(flagshipFeatures.key, key),
          ),
        )
        .limit(1);
      return feature || null;
    });
  }

  /**
   * Find multiple features by keys within a project
   */
  async findByKeys(projectId: string, keys: string[]): Promise<FlagshipFeature[]> {
    if (keys.length === 0) return [];

    return withServiceContext('FeaturesRepository.findByKeys', async (tx) => {
      return tx
        .select()
        .from(flagshipFeatures)
        .where(
          and(
            eq(flagshipFeatures.projectId, projectId),
            inArray(flagshipFeatures.key, keys),
          ),
        );
    });
  }

  /**
   * Find feature rules for a specific feature and environment
   */
  async findRulesForFeature(
    featureId: string,
    environmentId: string,
  ): Promise<FlagshipFeatureRule[]> {
    return withServiceContext('FeaturesRepository.findRulesForFeature', async (tx) => {
      return tx
        .select()
        .from(flagshipFeatureRules)
        .where(
          and(
            eq(flagshipFeatureRules.featureId, featureId),
            eq(flagshipFeatureRules.environmentId, environmentId),
            eq(flagshipFeatureRules.enabled, true),
          ),
        )
        .orderBy(desc(flagshipFeatureRules.priority));
    });
  }

  /**
   * Find features with their rules for a specific environment
   * Optimized for batch evaluation
   */
  async findFeaturesWithRules(
    projectId: string,
    environmentId: string,
    keys: string[],
  ): Promise<Map<string, FeatureWithRules>> {
    if (keys.length === 0) return new Map();

    return withServiceContext('FeaturesRepository.findFeaturesWithRules', async (tx) => {
      // Fetch features
      const features = await tx
        .select()
        .from(flagshipFeatures)
        .where(
          and(
            eq(flagshipFeatures.projectId, projectId),
            inArray(flagshipFeatures.key, keys),
          ),
        );

      if (features.length === 0) return new Map();

      const featureIds = features.map((f) => f.id);

      // Fetch rules for all features in the environment
      const rules = await tx
        .select()
        .from(flagshipFeatureRules)
        .where(
          and(
            inArray(flagshipFeatureRules.featureId, featureIds),
            eq(flagshipFeatureRules.environmentId, environmentId),
            eq(flagshipFeatureRules.enabled, true),
          ),
        )
        .orderBy(desc(flagshipFeatureRules.priority));

      // Group rules by feature
      const rulesByFeature = new Map<string, FlagshipFeatureRule[]>();
      for (const rule of rules) {
        const existing = rulesByFeature.get(rule.featureId) || [];
        existing.push(rule);
        rulesByFeature.set(rule.featureId, existing);
      }

      // Combine features with their rules
      const result = new Map<string, FeatureWithRules>();
      for (const feature of features) {
        result.set(feature.key, {
          ...feature,
          rules: rulesByFeature.get(feature.id) || [],
        });
      }

      return result;
    });
  }

  /**
   * Check if a feature is included in a plan
   */
  async isFeatureInPlan(featureId: string, planId: string): Promise<boolean> {
    return withServiceContext('FeaturesRepository.isFeatureInPlan', async (tx) => {
      const [result] = await tx
        .select({ id: flagshipPlanFeatures.id })
        .from(flagshipPlanFeatures)
        .where(
          and(
            eq(flagshipPlanFeatures.featureId, featureId),
            eq(flagshipPlanFeatures.planId, planId),
            eq(flagshipPlanFeatures.enabled, true),
          ),
        )
        .limit(1);
      return !!result;
    });
  }

  /**
   * Find all features for a project with pagination and filtering
   */
  async findAll(projectId: string, options: FindAllOptions = {}): Promise<PaginatedFeatures> {
    const { search, type, enabled, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    return withServiceContext('FeaturesRepository.findAll', async (tx) => {
      // Build filter conditions
      const conditions = [eq(flagshipFeatures.projectId, projectId)];

      if (search) {
        conditions.push(
          or(
            ilike(flagshipFeatures.key, `%${search}%`),
            ilike(flagshipFeatures.name, `%${search}%`),
          )!,
        );
      }

      if (type) {
        conditions.push(eq(flagshipFeatures.type, type));
      }

      if (enabled !== undefined) {
        conditions.push(eq(flagshipFeatures.enabled, enabled));
      }

      const whereClause = and(...conditions);

      // Get total count
      const [countResult] = await tx
        .select({ value: count() })
        .from(flagshipFeatures)
        .where(whereClause);

      const total = Number(countResult?.value ?? 0);

      // Get paginated items
      const items = await tx
        .select()
        .from(flagshipFeatures)
        .where(whereClause)
        .orderBy(desc(flagshipFeatures.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Find a feature by ID within a project
   */
  async findById(id: string, projectId: string): Promise<FlagshipFeature | null> {
    return withServiceContext('FeaturesRepository.findById', async (tx) => {
      const [feature] = await tx
        .select()
        .from(flagshipFeatures)
        .where(
          and(
            eq(flagshipFeatures.id, id),
            eq(flagshipFeatures.projectId, projectId),
          ),
        )
        .limit(1);
      return feature || null;
    });
  }

  /**
   * Create a new feature
   */
  async create(data: Omit<NewFlagshipFeature, 'createdAt' | 'updatedAt'>): Promise<FlagshipFeature> {
    return withServiceContext('FeaturesRepository.create', async (tx) => {
      const [feature] = await tx
        .insert(flagshipFeatures)
        .values(data)
        .returning();
      return feature;
    });
  }

  /**
   * Update an existing feature
   */
  async update(
    id: string,
    projectId: string,
    data: Partial<Pick<FlagshipFeature, 'name' | 'description' | 'enabled' | 'defaultValue' | 'metadata'>>,
  ): Promise<FlagshipFeature | null> {
    return withServiceContext('FeaturesRepository.update', async (tx) => {
      const [feature] = await tx
        .update(flagshipFeatures)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(flagshipFeatures.id, id),
            eq(flagshipFeatures.projectId, projectId),
          ),
        )
        .returning();
      return feature || null;
    });
  }
}

