/**
 * Audit Event Response DTO
 * Response shape for audit event endpoints
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from './audit-query.dto';

/**
 * Actor type enum
 */
export enum ActorType {
  USER = 'user',
  API_KEY = 'api_key',
  SYSTEM = 'system',
}

/**
 * Audit Event Response DTO
 */
export class AuditEventDto {
  @ApiProperty({ description: 'Audit event ID' })
  id!: string;

  @ApiProperty({ description: 'Action performed', enum: AuditAction })
  action!: string;

  @ApiPropertyOptional({ description: 'Actor ID (user ID or API key ID)' })
  actorId!: string | null;

  @ApiPropertyOptional({ description: 'Actor email' })
  actorEmail!: string | null;

  @ApiProperty({ description: 'Actor type', enum: ActorType })
  actorType!: string;

  @ApiProperty({ description: 'Resource type', example: 'feature' })
  resourceType!: string;

  @ApiPropertyOptional({ description: 'Resource ID' })
  resourceId!: string | null;

  @ApiPropertyOptional({ description: 'Resource name' })
  resourceName!: string | null;

  @ApiPropertyOptional({
    description: 'State changes (before/after)',
    example: {
      before: { enabled: false },
      after: { enabled: true },
    },
  })
  changes!: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { requestId: 'req-123', ipAddress: '192.168.1.1' },
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ description: 'Event timestamp (ISO 8601)' })
  createdAt!: string;
}

/**
 * Paginated Audit Events Response DTO
 */
export class PaginatedAuditEventsDto {
  @ApiProperty({ description: 'Audit event items', type: [AuditEventDto] })
  items!: AuditEventDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages!: number;
}

