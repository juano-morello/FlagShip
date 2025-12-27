/**
 * Features Service
 * Business logic for FlagShip feature management
 */

import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { FlagshipFeature } from '@forgestack/db';
import { FeaturesRepository } from './features.repository';
import { ActivitiesService } from '../../activities/activities.service';
import { AuditService } from '../audit/audit.service';
import type { FlagshipContext } from '../guards/environment.guard';
import {
  CreateFeatureDto,
  UpdateFeatureDto,
  QueryFeaturesDto,
  FeatureResponseDto,
  PaginatedFeaturesDto,
} from './dto';

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(
    private readonly featuresRepository: FeaturesRepository,
    private readonly activitiesService: ActivitiesService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List features for a project with pagination and filtering
   */
  async list(
    ctx: FlagshipContext,
    query: QueryFeaturesDto,
  ): Promise<PaginatedFeaturesDto> {
    this.logger.debug(`Listing features for project ${ctx.projectId}`);

    const result = await this.featuresRepository.findAll(ctx.projectId, {
      search: query.search,
      type: query.type,
      enabled: query.enabled,
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
   * Get a single feature by ID with its rules
   */
  async get(ctx: FlagshipContext, id: string): Promise<FeatureResponseDto> {
    this.logger.debug(`Getting feature ${id} for project ${ctx.projectId}`);

    const feature = await this.featuresRepository.findById(id, ctx.projectId);
    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    // Fetch rules for this feature in the current environment
    const rules = await this.featuresRepository.findRulesForFeature(
      feature.id,
      ctx.environmentId,
    );

    return {
      ...this.toResponseDto(feature),
      rules: rules.map((rule) => ({
        id: rule.id,
        ruleType: rule.ruleType,
        value: rule.value as Record<string, unknown>,
        priority: rule.priority,
        enabled: rule.enabled,
      })),
    };
  }

  /**
   * Create a new feature
   */
  async create(
    ctx: FlagshipContext,
    dto: CreateFeatureDto,
  ): Promise<FeatureResponseDto> {
    this.logger.debug(`Creating feature ${dto.key} for project ${ctx.projectId}`);

    // Check for duplicate key
    const existing = await this.featuresRepository.findByKey(ctx.projectId, dto.key);
    if (existing) {
      throw new ConflictException(
        `Feature with key '${dto.key}' already exists in this project`,
      );
    }

    // Create feature
    const feature = await this.featuresRepository.create({
      projectId: ctx.projectId,
      key: dto.key,
      name: dto.name,
      description: dto.description || null,
      type: dto.type,
      defaultValue: dto.defaultValue ?? false,
      enabled: true,
      metadata: dto.metadata || null,
    });

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.feature.created',
      actorId: 'system', // TODO: Get from auth context
      title: `Created feature: ${feature.name}`,
      description: `Feature '${feature.key}' was created`,
      resourceType: 'flagship_feature',
      resourceId: feature.id,
      resourceName: feature.name,
      metadata: {
        projectId: ctx.projectId,
        featureKey: feature.key,
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
        action: 'feature.created',
        resourceType: 'feature',
        resourceId: feature.id,
        resourceName: feature.key,
        changes: {
          after: {
            key: feature.key,
            name: feature.name,
            type: feature.type,
            enabled: feature.enabled,
          },
        },
      },
    );

    return this.toResponseDto(feature);
  }

  /**
   * Update an existing feature
   */
  async update(
    ctx: FlagshipContext,
    id: string,
    dto: UpdateFeatureDto,
  ): Promise<FeatureResponseDto> {
    this.logger.debug(`Updating feature ${id} for project ${ctx.projectId}`);

    const feature = await this.featuresRepository.update(id, ctx.projectId, dto);
    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.feature.updated',
      actorId: 'system', // TODO: Get from auth context
      title: `Updated feature: ${feature.name}`,
      description: `Feature '${feature.key}' was updated`,
      resourceType: 'flagship_feature',
      resourceId: feature.id,
      resourceName: feature.name,
      metadata: {
        projectId: ctx.projectId,
        featureKey: feature.key,
        changes: dto,
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
        action: 'feature.updated',
        resourceType: 'feature',
        resourceId: feature.id,
        resourceName: feature.key,
        changes: {
          after: dto as Record<string, unknown>,
        },
      },
    );

    return this.toResponseDto(feature);
  }

  /**
   * Convert database model to response DTO
   */
  private toResponseDto(feature: FlagshipFeature): FeatureResponseDto {
    return {
      id: feature.id,
      projectId: feature.projectId,
      key: feature.key,
      name: feature.name,
      description: feature.description,
      type: feature.type as unknown as FeatureResponseDto['type'],
      defaultValue: feature.defaultValue,
      enabled: feature.enabled,
      metadata: feature.metadata as Record<string, unknown> | null,
      createdAt: feature.createdAt.toISOString(),
      updatedAt: feature.updatedAt.toISOString(),
    };
  }
}

