/**
 * Plans Controller
 * REST API endpoints for plan management
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
import { PlansService } from './plans.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  QueryPlansDto,
  PlanResponseDto,
  PaginatedPlansDto,
} from './dto';

@ApiTags('FlagShip Plans')
@ApiSecurity('api-key')
@Controller({ path: 'v1/admin/plans', version: '' })
@UseGuards(ApiKeyGuard, EnvironmentGuard)
export class PlansController {
  private readonly logger = new Logger(PlansController.name);

  constructor(private readonly plansService: PlansService) {}

  /**
   * GET /v1/admin/plans
   * List plans with pagination and filtering
   */
  @Get()
  @RequireScopes('plans:read')
  @ApiOperation({
    summary: 'List plans',
    description: 'List all plans with pagination and filtering',
  })
  @ApiHeader({
    name: 'X-Environment',
    description: 'Environment ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of plans',
    type: PaginatedPlansDto,
  })
  async list(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Query() query: QueryPlansDto,
  ): Promise<PaginatedPlansDto> {
    this.logger.debug(`GET /v1/admin/plans`);
    return this.plansService.list(ctx, query);
  }

  /**
   * GET /v1/admin/plans/:id
   * Get a single plan by ID
   */
  @Get(':id')
  @RequireScopes('plans:read')
  @ApiOperation({
    summary: 'Get plan',
    description: 'Get a single plan by ID',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan details', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async get(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
  ): Promise<PlanResponseDto> {
    this.logger.debug(`GET /v1/admin/plans/${id}`);
    return this.plansService.get(ctx, id);
  }

  /**
   * POST /v1/admin/plans
   * Create a new plan
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('plans:write')
  @ApiOperation({
    summary: 'Create plan',
    description: 'Create a new subscription plan',
  })
  @ApiResponse({ status: 201, description: 'Plan created', type: PlanResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 409, description: 'Plan name already exists' })
  async create(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Body() dto: CreatePlanDto,
  ): Promise<PlanResponseDto> {
    this.logger.debug(`POST /v1/admin/plans - name=${dto.name}`);
    return this.plansService.create(ctx, dto);
  }

  /**
   * PATCH /v1/admin/plans/:id
   * Update an existing plan
   */
  @Patch(':id')
  @RequireScopes('plans:write')
  @ApiOperation({
    summary: 'Update plan',
    description: 'Update an existing plan',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan updated', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async update(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    this.logger.debug(`PATCH /v1/admin/plans/${id}`);
    return this.plansService.update(ctx, id, dto);
  }

  /**
   * DELETE /v1/admin/plans/:id
   * Soft delete a plan (sets isActive=false)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireScopes('plans:write')
  @ApiOperation({
    summary: 'Delete plan',
    description: 'Soft delete a plan by setting isActive to false',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 204, description: 'Plan deleted' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Plan has active subscriptions' })
  async delete(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Param('id') id: string,
  ): Promise<void> {
    this.logger.debug(`DELETE /v1/admin/plans/${id}`);
    return this.plansService.softDelete(ctx, id);
  }
}

