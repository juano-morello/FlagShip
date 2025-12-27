/**
 * Audit Service
 * Business logic for FlagShip audit events
 */

import { Injectable, Logger } from '@nestjs/common';
import type { FlagshipAuditEvent } from '@forgestack/db';
import type { FlagshipContext } from '../guards/environment.guard';
import { QueueService } from '../../queue/queue.service';
import { AuditRepository } from './audit.repository';
import { AuditQueryDto, AuditExportDto, ExportFormat } from './dto';
import { PaginatedAuditEventsDto, AuditEventDto } from './dto';

/**
 * Audit actor types
 */
export type AuditActorType = 'user' | 'api_key' | 'system';

/**
 * Audit event data structure
 */
export interface AuditEventData {
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Audit context for logging
 */
export interface AuditContext {
  orgId: string;
  environmentId: string | null;
  actorId?: string;
  actorType: AuditActorType;
  actorName?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Complete audit log event for queue
 */
export interface AuditLogEvent extends AuditContext, AuditEventData {}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly auditRepository: AuditRepository,
  ) {}

  /**
   * Queue an audit log event for async processing.
   * IMPORTANT: This method never throws - logging failures should not affect main operations.
   */
  async emit(context: AuditContext, event: AuditEventData): Promise<void> {
    try {
      const auditEvent: AuditLogEvent = {
        ...context,
        ...event,
      };

      await this.queueService.addJob('flagship-audit', auditEvent, {
        delay: 0,
      });

      this.logger.debug(
        `Queued FlagShip audit event: ${event.action} ${event.resourceType} in org ${context.orgId}`,
      );
    } catch (error) {
      // Log error but don't throw - audit logging should never break operations
      this.logger.error('Failed to queue FlagShip audit event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        event,
      });
    }
  }

  /**
   * List audit events with pagination and filtering
   */
  async list(ctx: FlagshipContext, query: AuditQueryDto): Promise<PaginatedAuditEventsDto> {
    this.logger.debug(`Listing audit events for org ${ctx.orgId}`);

    const result = await this.auditRepository.findAll(ctx.orgId, {
      action: query.action,
      actorEmail: query.actorEmail,
      resourceType: query.resourceType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page || 1,
      limit: query.limit || 20,
    });

    return {
      items: result.items.map(this.toResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  /**
   * Export audit events to CSV or JSON
   */
  async export(ctx: FlagshipContext, query: AuditExportDto): Promise<string> {
    this.logger.debug(`Exporting audit events for org ${ctx.orgId} as ${query.format || 'csv'}`);

    const events = await this.auditRepository.findAllForExport(ctx.orgId, {
      action: query.action,
      actorEmail: query.actorEmail,
      resourceType: query.resourceType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    const format = query.format || ExportFormat.CSV;

    if (format === ExportFormat.JSON) {
      return JSON.stringify(events.map(this.toResponseDto), null, 2);
    }

    // CSV format
    return this.convertToCSV(events);
  }

  /**
   * Convert audit events to CSV format
   */
  private convertToCSV(events: FlagshipAuditEvent[]): string {
    if (events.length === 0) {
      return 'id,action,actorEmail,actorType,resourceType,resourceId,resourceName,createdAt\n';
    }

    const headers = 'id,action,actorEmail,actorType,resourceType,resourceId,resourceName,createdAt\n';
    const rows = events.map((event) => {
      return [
        event.id,
        event.action,
        event.actorEmail || '',
        event.actorType,
        event.resourceType,
        event.resourceId || '',
        event.resourceName || '',
        event.createdAt.toISOString(),
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(',');
    });

    return headers + rows.join('\n');
  }

  /**
   * Map database entity to response DTO
   */
  private toResponseDto(event: FlagshipAuditEvent): AuditEventDto {
    return {
      id: event.id,
      action: event.action,
      actorId: event.actorId,
      actorEmail: event.actorEmail,
      actorType: event.actorType,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      resourceName: event.resourceName,
      changes: event.changes as { before?: Record<string, unknown>; after?: Record<string, unknown> } | null,
      metadata: event.metadata as Record<string, unknown> | null,
      createdAt: event.createdAt.toISOString(),
    };
  }
}

