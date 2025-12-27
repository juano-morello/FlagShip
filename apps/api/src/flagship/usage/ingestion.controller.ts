/**
 * Usage Ingestion Controller
 * REST API endpoint for POST /v1/usage/ingest
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
import { randomUUID } from 'crypto';
import { ApiKeyGuard } from '../../api-keys/api-key.guard';
import { RequireScopes } from '../../api-keys/require-scopes.decorator';
import { EnvironmentGuard, FlagshipContext } from '../guards/environment.guard';
import { CurrentEnvironment } from '../decorators/flagship-context.decorator';
import { IngestionQueueService } from './ingestion-queue.service';
import { IngestRequestDto, AsyncIngestResponseDto } from './dto/ingest.dto';

@ApiTags('FlagShip Usage')
@ApiSecurity('api-key')
@Controller({ path: 'v1/usage', version: '' })
@UseGuards(ApiKeyGuard, EnvironmentGuard)
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);

  constructor(private readonly ingestionQueueService: IngestionQueueService) {}

  /**
   * POST /v1/usage/ingest
   * Queue usage events for async processing
   */
  @Post('ingest')
  @HttpCode(HttpStatus.ACCEPTED)
  @RequireScopes('usage:write')
  @ApiOperation({
    summary: 'Ingest usage events (async)',
    description:
      'Queue usage events for async processing. Events are validated immediately ' +
      'and queued for background processing. Returns 202 Accepted with job tracking info.',
  })
  @ApiHeader({
    name: 'X-Environment',
    description: 'Environment ID to record usage for',
    required: true,
  })
  @ApiResponse({
    status: 202,
    description: 'Events queued for processing',
    type: AsyncIngestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 403, description: 'Missing required scope' })
  async ingest(
    @Body() dto: IngestRequestDto,
    @CurrentEnvironment() ctx: FlagshipContext,
  ): Promise<AsyncIngestResponseDto> {
    const requestId = randomUUID();

    this.logger.debug(
      `POST /v1/usage/ingest for env=${ctx.environmentId}, events=${dto.events.length}, requestId=${requestId}`,
    );

    const result = await this.ingestionQueueService.enqueue(
      {
        projectId: ctx.projectId,
        environmentId: ctx.environmentId,
        orgId: ctx.orgId,
      },
      dto.events,
      requestId,
    );

    this.logger.log(
      `Queued ${dto.events.length} events for env=${ctx.environmentId}, jobId=${result.jobId}`,
    );

    return {
      requestId,
      status: 'queued',
      queuedAt: result.queuedAt,
      eventCount: dto.events.length,
      jobId: result.jobId,
    };
  }
}

