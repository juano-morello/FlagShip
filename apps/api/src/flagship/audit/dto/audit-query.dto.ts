/**
 * Audit Query DTO
 * Query parameters for GET /v1/admin/audit
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Audit action types
 */
export enum AuditAction {
  FEATURE_CREATED = 'feature.created',
  FEATURE_UPDATED = 'feature.updated',
  FEATURE_DELETED = 'feature.deleted',
  FEATURE_TOGGLED = 'feature.toggled',
  ENVIRONMENT_CREATED = 'environment.created',
  ENVIRONMENT_UPDATED = 'environment.updated',
  ENVIRONMENT_DELETED = 'environment.deleted',
  PLAN_CREATED = 'plan.created',
  PLAN_UPDATED = 'plan.updated',
  PLAN_DELETED = 'plan.deleted',
  LIMIT_ENFORCED = 'limit.enforced',
  LIMIT_EXCEEDED = 'limit.exceeded',
}

/**
 * Query Audit Events Request DTO
 */
export class AuditQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by action type',
    enum: AuditAction,
    example: AuditAction.FEATURE_CREATED,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filter by actor email',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  actorEmail?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource type',
    example: 'feature',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

/**
 * Export format enum
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

/**
 * Audit Export Query DTO
 */
export class AuditExportDto extends AuditQueryDto {
  @ApiPropertyOptional({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV,
    default: ExportFormat.CSV,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

