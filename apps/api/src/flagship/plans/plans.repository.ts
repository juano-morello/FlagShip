/**
 * Plans Repository
 * Data access layer for plan management
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  plans,
  Plan,
  NewPlan,
  withServiceContext,
  eq,
  and,
  or,
  ilike,
  asc,
  count,
  sql,
} from '@forgestack/db';

export interface FindAllOptions {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedPlans {
  items: Plan[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PlansRepository {
  private readonly logger = new Logger(PlansRepository.name);

  /**
   * Find a plan by name
   */
  async findByName(name: string): Promise<Plan | null> {
    return withServiceContext('PlansRepository.findByName', async (tx) => {
      const [plan] = await tx
        .select()
        .from(plans)
        .where(eq(plans.name, name))
        .limit(1);
      return plan || null;
    });
  }

  /**
   * Find a plan by ID
   */
  async findById(id: string): Promise<Plan | null> {
    return withServiceContext('PlansRepository.findById', async (tx) => {
      const [plan] = await tx
        .select()
        .from(plans)
        .where(eq(plans.id, id))
        .limit(1);
      return plan || null;
    });
  }

  /**
   * Find all plans with pagination and filtering
   */
  async findAll(options: FindAllOptions = {}): Promise<PaginatedPlans> {
    const { search, isActive, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    return withServiceContext('PlansRepository.findAll', async (tx) => {
      // Build filter conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(plans.name, `%${search}%`),
            ilike(plans.displayName, `%${search}%`),
          ),
        );
      }

      if (isActive !== undefined) {
        conditions.push(eq(plans.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ value: total }] = await tx
        .select({ value: count() })
        .from(plans)
        .where(whereClause);

      // Get paginated items ordered by sortOrder
      const items = await tx
        .select()
        .from(plans)
        .where(whereClause)
        .orderBy(asc(plans.sortOrder))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total: Number(total),
        page,
        limit,
      };
    });
  }

  /**
   * Create a new plan
   */
  async create(data: Partial<NewPlan>): Promise<Plan> {
    return withServiceContext('PlansRepository.create', async (tx) => {
      const [plan] = await tx
        .insert(plans)
        .values({
          name: data.name!,
          displayName: data.displayName!,
          description: data.description || null,
          limits: data.limits || {},
          features: data.features || [],
          priceMonthly: data.priceMonthly || null,
          priceYearly: data.priceYearly || null,
          stripePriceIdMonthly: data.stripePriceIdMonthly || null,
          stripePriceIdYearly: data.stripePriceIdYearly || null,
          stripeMeteredPriceId: data.stripeMeteredPriceId || null,
          isActive: true,
          sortOrder: data.sortOrder || 0,
        })
        .returning();
      return plan;
    });
  }

  /**
   * Update an existing plan
   */
  async update(id: string, data: Partial<Plan>): Promise<Plan | null> {
    return withServiceContext('PlansRepository.update', async (tx) => {
      const [plan] = await tx
        .update(plans)
        .set({
          ...data,
          updatedAt: sql`NOW()`,
        })
        .where(eq(plans.id, id))
        .returning();
      return plan || null;
    });
  }

  /**
   * Soft delete a plan by setting isActive to false
   */
  async softDelete(id: string): Promise<void> {
    await withServiceContext('PlansRepository.softDelete', async (tx) => {
      await tx
        .update(plans)
        .set({
          isActive: false,
          updatedAt: sql`NOW()`,
        })
        .where(eq(plans.id, id))
        .returning();
    });
  }

  /**
   * Check if a plan has active subscriptions
   * Note: This is a placeholder - actual implementation depends on subscriptions table
   */
  async hasActiveSubscriptions(planId: string): Promise<boolean> {
    return withServiceContext('PlansRepository.hasActiveSubscriptions', async (tx) => {
      // TODO: Implement when subscriptions table is available
      // For now, return false to allow deletion
      // const [result] = await tx
      //   .select({ value: count() })
      //   .from(subscriptions)
      //   .where(
      //     and(
      //       eq(subscriptions.planId, planId),
      //       eq(subscriptions.status, 'active'),
      //     ),
      //   );
      // return Number(result.value) > 0;
      return false;
    });
  }
}

