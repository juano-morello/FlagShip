/**
 * Environments Service
 * Business logic for FlagShip environment management
 */

import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Environment } from '@forgestack/db';
import { EnvironmentsRepository } from './environments.repository';
import { ActivitiesService } from '../../activities/activities.service';
import { AuditService } from '../audit/audit.service';
import type { FlagshipContext } from '../guards/environment.guard';
import {
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
  QueryEnvironmentsDto,
  EnvironmentResponseDto,
  PaginatedEnvironmentsDto,
} from './dto';

@Injectable()
export class EnvironmentsService {
  private readonly logger = new Logger(EnvironmentsService.name);

  constructor(
    private readonly environmentsRepository: EnvironmentsRepository,
    private readonly activitiesService: ActivitiesService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List environments for a project with pagination and filtering
   */
  async list(
    ctx: FlagshipContext,
    query: QueryEnvironmentsDto,
  ): Promise<PaginatedEnvironmentsDto> {
    this.logger.debug(`Listing environments for project ${ctx.projectId}`);

    // Fetch all environments for the project
    let envs = await this.environmentsRepository.findByProjectId(ctx.projectId);

    // Apply filters
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      envs = envs.filter((env) => env.name.toLowerCase().includes(searchLower));
    }

    if (query.type) {
      envs = envs.filter((env) => env.type === query.type);
    }

    if (query.isDefault !== undefined) {
      envs = envs.filter((env) => env.isDefault === query.isDefault);
    }

    // Sort by createdAt descending
    envs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const total = envs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEnvs = envs.slice(startIndex, endIndex);

    return {
      items: paginatedEnvs.map(this.toResponseDto),
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single environment by ID
   */
  async get(ctx: FlagshipContext, id: string): Promise<EnvironmentResponseDto> {
    this.logger.debug(`Getting environment ${id} for project ${ctx.projectId}`);

    const environment = await this.environmentsRepository.findById(id);
    if (!environment || environment.projectId !== ctx.projectId) {
      throw new NotFoundException(`Environment with ID ${id} not found`);
    }

    return this.toResponseDto(environment);
  }

  /**
   * Create a new environment
   */
  async create(
    ctx: FlagshipContext,
    dto: CreateEnvironmentDto,
  ): Promise<EnvironmentResponseDto> {
    this.logger.debug(`Creating environment ${dto.name} for project ${ctx.projectId}`);

    // Check for duplicate type
    const existing = await this.environmentsRepository.findByProjectAndType(
      ctx.projectId,
      dto.type,
    );
    if (existing) {
      throw new ConflictException(
        `Environment type '${dto.type}' already exists in this project`,
      );
    }

    // Auto-generate apiKeyPrefix if not provided
    const apiKeyPrefix = dto.apiKeyPrefix || `fsk_${dto.type}_`;

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.unsetOtherDefaults(ctx.projectId);
    }

    // Create environment
    const environment = await this.environmentsRepository.create({
      projectId: ctx.projectId,
      name: dto.name,
      type: dto.type,
      apiKeyPrefix,
      isDefault: dto.isDefault ?? false,
      settings: dto.settings || null,
    });

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.environment.created',
      actorId: 'system', // TODO: Get from auth context
      title: `Created environment: ${environment.name}`,
      description: `Environment '${environment.name}' (${environment.type}) was created`,
      resourceType: 'flagship_environment',
      resourceId: environment.id,
      resourceName: environment.name,
      metadata: {
        projectId: ctx.projectId,
        environmentType: environment.type,
      },
    });

    // Emit audit event
    await this.auditService.emit(
      {
        orgId: ctx.orgId,
        environmentId: environment.id,
        actorId: 'system', // TODO: Get from auth context
        actorType: 'system',
      },
      {
        action: 'environment.created',
        resourceType: 'environment',
        resourceId: environment.id,
        resourceName: environment.name,
        changes: {
          after: {
            name: environment.name,
            type: environment.type,
            isDefault: environment.isDefault,
          },
        },
      },
    );

    return this.toResponseDto(environment);
  }

  /**
   * Update an existing environment
   */
  async update(
    ctx: FlagshipContext,
    id: string,
    dto: UpdateEnvironmentDto,
  ): Promise<EnvironmentResponseDto> {
    this.logger.debug(`Updating environment ${id} for project ${ctx.projectId}`);

    // Verify environment exists and belongs to project
    const existing = await this.environmentsRepository.findById(id);
    if (!existing || existing.projectId !== ctx.projectId) {
      throw new NotFoundException(`Environment with ID ${id} not found`);
    }

    // If setting as default, unset other defaults
    if (dto.isDefault === true) {
      await this.unsetOtherDefaults(ctx.projectId, id);
    }

    // Update environment
    const environment = await this.environmentsRepository.update(id, dto);
    if (!environment) {
      throw new NotFoundException(`Environment with ID ${id} not found`);
    }

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.environment.updated',
      actorId: 'system', // TODO: Get from auth context
      title: `Updated environment: ${environment.name}`,
      description: `Environment '${environment.name}' was updated`,
      resourceType: 'flagship_environment',
      resourceId: environment.id,
      resourceName: environment.name,
      metadata: {
        projectId: ctx.projectId,
        changes: dto,
      },
    });

    // Emit audit event
    await this.auditService.emit(
      {
        orgId: ctx.orgId,
        environmentId: environment.id,
        actorId: 'system', // TODO: Get from auth context
        actorType: 'system',
      },
      {
        action: 'environment.updated',
        resourceType: 'environment',
        resourceId: environment.id,
        resourceName: environment.name,
        changes: {
          after: dto as Record<string, unknown>,
        },
      },
    );

    return this.toResponseDto(environment);
  }

  /**
   * Soft delete an environment
   * Note: Since schema doesn't have deletedAt, we'll mark isDefault as false
   * In a real implementation, you'd add a deletedAt column or enabled flag
   */
  async delete(ctx: FlagshipContext, id: string): Promise<void> {
    this.logger.debug(`Deleting environment ${id} for project ${ctx.projectId}`);

    // Verify environment exists and belongs to project
    const existing = await this.environmentsRepository.findById(id);
    if (!existing || existing.projectId !== ctx.projectId) {
      throw new NotFoundException(`Environment with ID ${id} not found`);
    }

    // Check if this is the last environment
    const allEnvs = await this.environmentsRepository.findByProjectId(ctx.projectId);
    if (allEnvs.length <= 1) {
      throw new BadRequestException('Cannot delete the last environment in a project');
    }

    // Check if this is the default environment
    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot delete default environment without reassigning default first',
      );
    }

    // Soft delete by setting isDefault to false (placeholder for actual soft delete)
    await this.environmentsRepository.update(id, { isDefault: false });

    // Log activity
    await this.activitiesService.create({
      orgId: ctx.orgId,
      type: 'flagship.environment.deleted',
      actorId: 'system', // TODO: Get from auth context
      title: `Deleted environment: ${existing.name}`,
      description: `Environment '${existing.name}' (${existing.type}) was deleted`,
      resourceType: 'flagship_environment',
      resourceId: existing.id,
      resourceName: existing.name,
      metadata: {
        projectId: ctx.projectId,
        environmentType: existing.type,
      },
    });

    // Emit audit event
    await this.auditService.emit(
      {
        orgId: ctx.orgId,
        environmentId: existing.id,
        actorId: 'system', // TODO: Get from auth context
        actorType: 'system',
      },
      {
        action: 'environment.deleted',
        resourceType: 'environment',
        resourceId: existing.id,
        resourceName: existing.name,
        changes: {
          before: {
            name: existing.name,
            type: existing.type,
            isDefault: existing.isDefault,
          },
        },
      },
    );
  }

  /**
   * Unset isDefault flag on all other environments in the project
   */
  private async unsetOtherDefaults(projectId: string, excludeId?: string): Promise<void> {
    const envs = await this.environmentsRepository.findByProjectId(projectId);
    const defaultEnvs = envs.filter(
      (env) => env.isDefault && env.id !== excludeId,
    );

    for (const env of defaultEnvs) {
      await this.environmentsRepository.update(env.id, { isDefault: false });
    }
  }

  /**
   * Convert database model to response DTO
   */
  private toResponseDto(environment: Environment): EnvironmentResponseDto {
    return {
      id: environment.id,
      projectId: environment.projectId,
      name: environment.name,
      type: environment.type as EnvironmentResponseDto['type'],
      apiKeyPrefix: environment.apiKeyPrefix,
      isDefault: environment.isDefault,
      settings: environment.settings as Record<string, unknown> | null,
      createdAt: environment.createdAt.toISOString(),
      updatedAt: environment.updatedAt.toISOString(),
    };
  }
}
