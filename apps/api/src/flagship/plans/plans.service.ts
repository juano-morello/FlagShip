/**
 * Plans Service
 * Business logic for plan management
 */

import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Plan } from '@forgestack/db';
import { PlansRepository } from './plans.repository';
import { ActivitiesService } from '../../activities/activities.service';
import { AuditService } from '../audit/audit.service';
import type { FlagshipContext } from '../guards/environment.guard';
import {
  CreatePlanDto,
  UpdatePlanDto,
  QueryPlansDto,
  PlanResponseDto,
  PaginatedPlansDto,
} from './dto';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  // Plan name validation regex
  private readonly NAME_PATTERN = /^[a-z][a-z0-9_-]*$/;

  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly activitiesService: ActivitiesService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List plans with pagination and filtering
   */
  async list(
    ctx: FlagshipContext,
    query: QueryPlansDto,
  ): Promise<PaginatedPlansDto> {
    this.logger.debug(`Listing plans`);

    const result = await this.plansRepository.findAll({
      search: query.search,
      isActive: query.isActive,
      page: query.page || 1,
      limit: query.limit || 10,
    });

    return {
      items: result.items.map(this.toResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get a single plan by ID
   */
  async get(ctx: FlagshipContext, id: string): Promise<PlanResponseDto> {
    this.logger.debug(`Getting plan ${id}`);

    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return this.toResponseDto(plan);
  }

  /**
   * Create a new plan
   */
  async create(
    ctx: FlagshipContext,
    dto: CreatePlanDto,
  ): Promise<PlanResponseDto> {
    this.logger.debug(`Creating plan ${dto.name}`);

    // Validate name format
    if (!this.NAME_PATTERN.test(dto.name)) {
      throw new BadRequestException(
        'Plan name must start with a lowercase letter and contain only lowercase letters, numbers, underscores, and hyphens',
      );
    }

    // Check for duplicate name
    const existing = await this.plansRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        `Plan with name '${dto.name}' already exists`,
      );
    }

    // Create plan
    const plan = await this.plansRepository.create({
      name: dto.name,
      displayName: dto.displayName,
      description: dto.description || null,
      limits: dto.limits || {},
      features: dto.features || [],
      priceMonthly: dto.priceMonthly || null,
      priceYearly: dto.priceYearly || null,
      stripePriceIdMonthly: dto.stripePriceIdMonthly || null,
      stripePriceIdYearly: dto.stripePriceIdYearly || null,
      stripeMeteredPriceId: dto.stripeMeteredPriceId || null,
      sortOrder: dto.sortOrder || 0,
    });

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.plan.created',
      actorId: 'system', // TODO: Get from auth context
      title: `Created plan: ${plan.displayName}`,
      description: `Plan '${plan.name}' was created`,
      resourceType: 'flagship_plan',
      resourceId: plan.id,
      resourceName: plan.displayName,
      metadata: {
        planName: plan.name,
      },
    });

    // Emit audit event
    await this.auditService.emit(
      {
        orgId: ctx.orgId,
        environmentId: ctx.environmentId,
        actorId: 'system', // TODO: Get from auth context
        actorType: 'system',
      },
      {
        action: 'plan.created',
        resourceType: 'plan',
        resourceId: plan.id,
        resourceName: plan.name,
        changes: {
          after: {
            name: plan.name,
            displayName: plan.displayName,
            priceMonthly: plan.priceMonthly,
            priceYearly: plan.priceYearly,
          },
        },
      },
    );

    return this.toResponseDto(plan);
  }

  /**
   * Update an existing plan
   */
  async update(
    ctx: FlagshipContext,
    id: string,
    dto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    this.logger.debug(`Updating plan ${id}`);

    // Remove name from update data if present (name is immutable)
    const { ...updateData } = dto;

    const plan = await this.plansRepository.update(id, updateData);
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.plan.updated',
      actorId: 'system', // TODO: Get from auth context
      title: `Updated plan: ${plan.displayName}`,
      description: `Plan '${plan.name}' was updated`,
      resourceType: 'flagship_plan',
      resourceId: plan.id,
      resourceName: plan.displayName,
    });

    // Emit audit event
    await this.auditService.emit(
      {
        orgId: ctx.orgId,
        environmentId: ctx.environmentId,
        actorId: 'system', // TODO: Get from auth context
        actorType: 'system',
      },
      {
        action: 'plan.updated',
        resourceType: 'plan',
        resourceId: plan.id,
        resourceName: plan.name,
        changes: {
          after: updateData,
        },
      },
    );

    return this.toResponseDto(plan);
  }

  /**
   * Soft delete a plan
   */
  async softDelete(ctx: FlagshipContext, id: string): Promise<void> {
    this.logger.debug(`Soft deleting plan ${id}`);

    // Check if plan has active subscriptions
    const hasSubscriptions = await this.plansRepository.hasActiveSubscriptions(id);
    if (hasSubscriptions) {
      throw new ConflictException(
        'Cannot delete plan with active subscriptions',
      );
    }

    // Get plan details before deletion
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Soft delete the plan
    await this.plansRepository.softDelete(id);

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.plan.deleted',
      actorId: 'system', // TODO: Get from auth context
      title: `Deleted plan`,
      description: `Plan was soft deleted`,
      resourceType: 'flagship_plan',
      resourceId: id,
    });

    // Emit audit event
    await this.auditService.emit(
      {
        orgId: ctx.orgId,
        environmentId: ctx.environmentId,
        actorId: 'system', // TODO: Get from auth context
        actorType: 'system',
      },
      {
        action: 'plan.deleted',
        resourceType: 'plan',
        resourceId: id,
        resourceName: plan.name,
        changes: {
          before: {
            name: plan.name,
            displayName: plan.displayName,
            isActive: plan.isActive,
          },
        },
      },
    );
  }

  /**
   * Map database entity to response DTO
   */
  private toResponseDto(plan: Plan): PlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      limits: plan.limits as Record<string, number>,
      features: plan.features as string[],
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      stripePriceIdMonthly: plan.stripePriceIdMonthly,
      stripePriceIdYearly: plan.stripePriceIdYearly,
      stripeMeteredPriceId: plan.stripeMeteredPriceId,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }
}
