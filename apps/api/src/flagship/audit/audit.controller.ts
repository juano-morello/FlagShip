/**
 * Audit Controller
 * REST API endpoints for FlagShip audit events
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ApiKeyGuard } from '../../api-keys/api-key.guard';
import { RequireScopes } from '../../api-keys/require-scopes.decorator';
import { EnvironmentGuard, FlagshipContext } from '../guards/environment.guard';
import { CurrentEnvironment } from '../decorators/flagship-context.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto, AuditExportDto, ExportFormat } from './dto';
import { PaginatedAuditEventsDto } from './dto';

@ApiTags('FlagShip Audit')
@ApiSecurity('api-key')
@Controller({ path: 'v1/admin/audit', version: '' })
@UseGuards(ApiKeyGuard, EnvironmentGuard)
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /v1/admin/audit
   * List audit events for the current organization
   */
  @Get()
  @RequireScopes('audit:read')
  @ApiOperation({
    summary: 'List audit events',
    description: 'List all FlagShip audit events for the organization with pagination and filtering',
  })
  @ApiHeader({
    name: 'X-Environment',
    description: 'Environment ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of audit events',
    type: PaginatedAuditEventsDto,
  })
  async list(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Query() query: AuditQueryDto,
  ): Promise<PaginatedAuditEventsDto> {
    this.logger.debug(`GET /v1/admin/audit for org=${ctx.orgId}`);
    return this.auditService.list(ctx, query);
  }

  /**
   * GET /v1/admin/audit/export
   * Export audit events to CSV or JSON
   */
  @Get('export')
  @RequireScopes('audit:read')
  @ApiOperation({
    summary: 'Export audit events',
    description: 'Export audit events to CSV or JSON format',
  })
  @ApiHeader({
    name: 'X-Environment',
    description: 'Environment ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Exported audit events',
    content: {
      'text/csv': {
        schema: { type: 'string' },
      },
      'application/json': {
        schema: { type: 'string' },
      },
    },
  })
  async export(
    @CurrentEnvironment() ctx: FlagshipContext,
    @Query() query: AuditExportDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    this.logger.debug(`GET /v1/admin/audit/export for org=${ctx.orgId} format=${query.format || 'csv'}`);

    // Set dynamic headers based on format
    const format = query.format || ExportFormat.CSV;
    if (format === ExportFormat.JSON) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-events.json"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-events.csv"');
    }

    return this.auditService.export(ctx, query);
  }
}

