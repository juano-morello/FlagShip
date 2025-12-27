/**
 * Audit Repository
 * Data access layer for FlagShip audit events
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  flagshipAuditEvents,
  NewFlagshipAuditEvent,
  FlagshipAuditEvent,
  withServiceContext,
  eq,
  and,
  gte,
  lte,
  ilike,
  desc,
  count,
} from '@forgestack/db';

export interface FindAllOptions {
  action?: string;
  actorEmail?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditEvents {
  items: FlagshipAuditEvent[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  /**
   * Create a new audit event (append-only)
   * Uses service context to bypass RLS for worker processing
   */
  async create(data: NewFlagshipAuditEvent): Promise<FlagshipAuditEvent> {
    this.logger.debug(`Creating audit event: ${data.action} ${data.resourceType}`);

    return withServiceContext('AuditRepository.create', async (tx) => {
      const [event] = await tx
        .insert(flagshipAuditEvents)
        .values(data)
        .returning();

      return event;
    });
  }

  /**
   * Find all audit events with filters and pagination
   */
  async findAll(orgId: string, options: FindAllOptions): Promise<PaginatedAuditEvents> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    this.logger.debug(`Finding audit events for org ${orgId} with filters`, options);

    // Build where conditions
    const conditions = [eq(flagshipAuditEvents.orgId, orgId)];

    if (options.action) {
      conditions.push(eq(flagshipAuditEvents.action, options.action));
    }

    if (options.actorEmail) {
      conditions.push(ilike(flagshipAuditEvents.actorEmail, `%${options.actorEmail}%`));
    }

    if (options.resourceType) {
      conditions.push(eq(flagshipAuditEvents.resourceType, options.resourceType));
    }

    if (options.dateFrom) {
      conditions.push(gte(flagshipAuditEvents.createdAt, new Date(options.dateFrom)));
    }

    if (options.dateTo) {
      conditions.push(lte(flagshipAuditEvents.createdAt, new Date(options.dateTo)));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Fetch items
    const items = await withServiceContext('AuditRepository.findAll', async (tx) => {
      return tx
        .select()
        .from(flagshipAuditEvents)
        .where(whereClause)
        .orderBy(desc(flagshipAuditEvents.createdAt))
        .limit(limit)
        .offset(offset);
    });

    // Fetch total count
    const totalResult = await withServiceContext('AuditRepository.count', async (tx) => {
      return tx
        .select({ count: count() })
        .from(flagshipAuditEvents)
        .where(whereClause);
    });

    const total = totalResult[0]?.count || 0;

    return {
      items,
      total: Number(total),
      page,
      limit,
    };
  }

  /**
   * Find all audit events for export (no pagination)
   */
  async findAllForExport(orgId: string, options: Omit<FindAllOptions, 'page' | 'limit'>): Promise<FlagshipAuditEvent[]> {
    this.logger.debug(`Finding audit events for export for org ${orgId}`);

    // Build where conditions (same as findAll)
    const conditions = [eq(flagshipAuditEvents.orgId, orgId)];

    if (options.action) {
      conditions.push(eq(flagshipAuditEvents.action, options.action));
    }

    if (options.actorEmail) {
      conditions.push(ilike(flagshipAuditEvents.actorEmail, `%${options.actorEmail}%`));
    }

    if (options.resourceType) {
      conditions.push(eq(flagshipAuditEvents.resourceType, options.resourceType));
    }

    if (options.dateFrom) {
      conditions.push(gte(flagshipAuditEvents.createdAt, new Date(options.dateFrom)));
    }

    if (options.dateTo) {
      conditions.push(lte(flagshipAuditEvents.createdAt, new Date(options.dateTo)));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    return withServiceContext('AuditRepository.findAllForExport', async (tx) => {
      return tx
        .select()
        .from(flagshipAuditEvents)
        .where(whereClause)
        .orderBy(desc(flagshipAuditEvents.createdAt));
    });
  }
}

