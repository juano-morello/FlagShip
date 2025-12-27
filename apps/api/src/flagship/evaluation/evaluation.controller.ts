/**
 * Evaluation Controller
 * REST API endpoint for the FlagShip control plane evaluation
 */

import {
  Controller,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../api-keys/api-key.guard';
import { RequireScopes } from '../../api-keys/require-scopes.decorator';
import { EnvironmentGuard, FlagshipContext } from '../guards/environment.guard';
import { CurrentEnvironment } from '../decorators/flagship-context.decorator';
import { EvaluationService } from './evaluation.service';
import { EvaluateRequestDto, EvaluateResponseDto } from './dto';

@ApiTags('FlagShip Evaluation')
@ApiSecurity('api-key')
@Controller({ path: 'v1/evaluate', version: '' })
@UseGuards(ApiKeyGuard, EnvironmentGuard)
export class EvaluationController {
  private readonly logger = new Logger(EvaluationController.name);

  constructor(private readonly evaluationService: EvaluationService) {}

  /**
   * POST /v1/evaluate
   * Evaluate features and limits for the current environment
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @RequireScopes('evaluate:read')
  @ApiOperation({
    summary: 'Evaluate features and limits',
    description:
      'Evaluate feature flags and usage limits for the specified environment. ' +
      'This is the primary endpoint for client applications to check access.',
  })
  @ApiHeader({
    name: 'X-Environment',
    description: 'Environment ID to evaluate against',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluation results',
    type: EvaluateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 403, description: 'Missing required scope' })
  async evaluate(
    @Body() dto: EvaluateRequestDto,
    @CurrentEnvironment() ctx: FlagshipContext,
  ): Promise<EvaluateResponseDto> {
    this.logger.debug(
      `POST /v1/evaluate for env=${ctx.environmentId}, project=${ctx.projectId}`,
    );

    return this.evaluationService.evaluate(dto, {
      projectId: ctx.projectId,
      environmentId: ctx.environmentId,
      orgId: ctx.orgId,
      // planId would come from the org's subscription - to be implemented
    });
  }
}

