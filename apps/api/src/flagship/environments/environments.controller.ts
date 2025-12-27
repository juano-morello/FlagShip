/**
 * Environments Controller
 * REST API endpoints for FlagShip environment management
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../api-keys/api-key.guard';
import { RequireScopes } from '../../api-keys/require-scopes.decorator';
import { EnvironmentGuard, FlagshipContext } from '../guards/environment.guard';
import { CurrentEnvironment } from '../decorators/flagship-context.decorator';
import { EnvironmentsService } from './environments.service';
import {
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
  QueryEnvironmentsDto,
  EnvironmentResponseDto,
  PaginatedEnvironmentsDto,
} from './dto';

@ApiTags('FlagShip Environments')
@ApiSecurity('api-key')
@Controller({ path: 'v1/admin/environments', version: '' })
@UseGuards(ApiKeyGuard, EnvironmentGuard)
export class EnvironmentsController {
  private readonly logger = new Logger(EnvironmentsController.name);

  constructor(private readonly environmentsService: EnvironmentsService) {}

  /**
   * GET /v1/admin/environments
   * List environments for the current project
   */
  @Get()
  @RequireScopes('environments:read')
  @ApiOperation({
    summary: 'List environments',
    description: 'List all environments for the current project with pagination and filtering',
  })
  @ApiHeader({
    name: 'X-Environment',
    description: 'Environment ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of environments',
    type: PaginatedEnvironmentsDto,
  })
  async list(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Query() query: QueryEnvironmentsDto,
  ): Promise<PaginatedEnvironmentsDto> {
    this.logger.debug(`GET /v1/admin/environments for project=${ctx.projectId}`);
    return this.environmentsService.list(ctx, query);
  }

  /**
   * GET /v1/admin/environments/:id
   * Get a single environment by ID
   */
  @Get(':id')
  @RequireScopes('environments:read')
  @ApiOperation({
    summary: 'Get environment',
    description: 'Get a single environment by ID',
  })
  @ApiParam({ name: 'id', description: 'Environment ID' })
  @ApiResponse({ status: 200, description: 'Environment details', type: EnvironmentResponseDto })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  async get(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
  ): Promise<EnvironmentResponseDto> {
    this.logger.debug(`GET /v1/admin/environments/${id}`);
    return this.environmentsService.get(ctx, id);
  }

  /**
   * POST /v1/admin/environments
   * Create a new environment
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('environments:write')
  @ApiOperation({
    summary: 'Create environment',
    description: 'Create a new environment',
  })
  @ApiResponse({ status: 201, description: 'Environment created', type: EnvironmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 409, description: 'Environment type already exists' })
  async create(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Body() dto: CreateEnvironmentDto,
  ): Promise<EnvironmentResponseDto> {
    this.logger.debug(`POST /v1/admin/environments - type=${dto.type}`);
    return this.environmentsService.create(ctx, dto);
  }

  /**
   * PATCH /v1/admin/environments/:id
   * Update an existing environment
   */
  @Patch(':id')
  @RequireScopes('environments:write')
  @ApiOperation({
    summary: 'Update environment',
    description: 'Update an existing environment',
  })
  @ApiParam({ name: 'id', description: 'Environment ID' })
  @ApiResponse({ status: 200, description: 'Environment updated', type: EnvironmentResponseDto })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  async update(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
    @Body() dto: UpdateEnvironmentDto,
  ): Promise<EnvironmentResponseDto> {
    this.logger.debug(`PATCH /v1/admin/environments/${id}`);
    return this.environmentsService.update(ctx, id, dto);
  }

  /**
   * DELETE /v1/admin/environments/:id
   * Soft delete an environment
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireScopes('environments:write')
  @ApiOperation({
    summary: 'Delete environment',
    description: 'Soft delete an environment',
  })
  @ApiParam({ name: 'id', description: 'Environment ID' })
  @ApiResponse({ status: 204, description: 'Environment deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete last or default environment' })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  async delete(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
  ): Promise<void> {
    this.logger.debug(`DELETE /v1/admin/environments/${id}`);
    return this.environmentsService.delete(ctx, id);
  }
}
