/**
 * Features Controller
 * REST API endpoints for FlagShip feature management
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
import { FeaturesService } from './features.service';
import {
  CreateFeatureDto,
  UpdateFeatureDto,
  QueryFeaturesDto,
  FeatureResponseDto,
  PaginatedFeaturesDto,
} from './dto';

@ApiTags('FlagShip Features')
@ApiSecurity('api-key')
@Controller({ path: 'v1/admin/features', version: '' })
@UseGuards(ApiKeyGuard, EnvironmentGuard)
export class FeaturesController {
  private readonly logger = new Logger(FeaturesController.name);

  constructor(private readonly featuresService: FeaturesService) {}

  /**
   * GET /v1/admin/features
   * List features for the current project
   */
  @Get()
  @RequireScopes('features:read')
  @ApiOperation({
    summary: 'List features',
    description: 'List all features for the current project with pagination and filtering',
  })
  @ApiHeader({
    name: 'X-Environment',
    description: 'Environment ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of features',
    type: PaginatedFeaturesDto,
  })
  async list(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Query() query: QueryFeaturesDto,
  ): Promise<PaginatedFeaturesDto> {
    this.logger.debug(`GET /v1/admin/features for project=${ctx.projectId}`);
    return this.featuresService.list(ctx, query);
  }

  /**
   * GET /v1/admin/features/:id
   * Get a single feature by ID
   */
  @Get(':id')
  @RequireScopes('features:read')
  @ApiOperation({
    summary: 'Get feature',
    description: 'Get a single feature by ID with its rules',
  })
  @ApiParam({ name: 'id', description: 'Feature ID' })
  @ApiResponse({ status: 200, description: 'Feature details', type: FeatureResponseDto })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async get(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
  ): Promise<FeatureResponseDto> {
    this.logger.debug(`GET /v1/admin/features/${id}`);
    return this.featuresService.get(ctx, id);
  }

  /**
   * POST /v1/admin/features
   * Create a new feature
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('features:write')
  @ApiOperation({
    summary: 'Create feature',
    description: 'Create a new feature flag',
  })
  @ApiResponse({ status: 201, description: 'Feature created', type: FeatureResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 409, description: 'Feature key already exists' })
  async create(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Body() dto: CreateFeatureDto,
  ): Promise<FeatureResponseDto> {
    this.logger.debug(`POST /v1/admin/features - key=${dto.key}`);
    return this.featuresService.create(ctx, dto);
  }

  /**
   * PATCH /v1/admin/features/:id
   * Update an existing feature
   */
  @Patch(':id')
  @RequireScopes('features:write')
  @ApiOperation({
    summary: 'Update feature',
    description: 'Update an existing feature',
  })
  @ApiParam({ name: 'id', description: 'Feature ID' })
  @ApiResponse({ status: 200, description: 'Feature updated', type: FeatureResponseDto })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async update(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
    @Body() dto: UpdateFeatureDto,
  ): Promise<FeatureResponseDto> {
    this.logger.debug(`PATCH /v1/admin/features/${id}`);
    return this.featuresService.update(ctx, id, dto);
  }

  /**
   * DELETE /v1/admin/features/:id
   * Soft delete a feature (sets enabled=false)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireScopes('features:write')
  @ApiOperation({
    summary: 'Delete feature',
    description: 'Soft delete a feature by disabling it',
  })
  @ApiParam({ name: 'id', description: 'Feature ID' })
  @ApiResponse({ status: 200, description: 'Feature deleted', type: FeatureResponseDto })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async delete(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
  ): Promise<FeatureResponseDto> {
    this.logger.debug(`DELETE /v1/admin/features/${id}`);
    return this.featuresService.update(ctx, id, { enabled: false });
  }
}

