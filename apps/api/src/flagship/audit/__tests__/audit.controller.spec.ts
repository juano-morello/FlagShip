/**
 * Audit Controller Unit Tests
 * Tests MUST be written BEFORE implementation (TDD)
 */

import { Logger } from '@nestjs/common';
import { AuditController } from '../audit.controller';
import { AuditService } from '../audit.service';
import { AuditAction, ExportFormat } from '../dto';
import type { FlagshipContext } from '../../guards/environment.guard';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  const mockContext: FlagshipContext = {
    environmentId: 'env-123',
    environmentType: 'production',
    projectId: 'proj-123',
    orgId: 'org-123',
  };

  beforeEach(() => {
    // Direct instantiation to avoid guard dependency issues
    service = {
      list: jest.fn(),
      export: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    controller = new AuditController(service);

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/admin/audit', () => {
    it('should return paginated audit events', async () => {
      const mockResponse = {
        items: [
          {
            id: 'audit-1',
            action: 'feature.created',
            actorId: 'user-123',
            actorEmail: 'test@example.com',
            actorType: 'user' as const,
            resourceType: 'feature',
            resourceId: 'feat-123',
            resourceName: 'test-feature',
            changes: null,
            metadata: null,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      service.list.mockResolvedValue(mockResponse);

      const result = await controller.list(mockContext, { page: 1, limit: 20 });

      expect(service.list).toHaveBeenCalledWith(mockContext, { page: 1, limit: 20 });
      expect(result).toEqual(mockResponse);
    });

    it('should pass query filters to service', async () => {
      const query = {
        page: 2,
        limit: 50,
        action: AuditAction.FEATURE_CREATED,
        actorEmail: 'test@example.com',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        resourceType: 'feature',
      };

      service.list.mockResolvedValue({
        items: [],
        total: 0,
        page: 2,
        limit: 50,
        totalPages: 0,
      });

      await controller.list(mockContext, query);

      expect(service.list).toHaveBeenCalledWith(mockContext, query);
    });
  });

  describe('GET /v1/admin/audit/export', () => {
    const createMockResponse = () => ({
      setHeader: jest.fn(),
    } as unknown as import('express').Response);

    it('should export audit events as CSV', async () => {
      const mockRes = createMockResponse();
      const csvData = 'id,action,actorEmail\naudit-1,feature.created,test@example.com';
      service.export.mockResolvedValue(csvData);

      const result = await controller.export(mockContext, { format: ExportFormat.CSV }, mockRes);

      expect(service.export).toHaveBeenCalledWith(mockContext, { format: ExportFormat.CSV });
      expect(result).toBe(csvData);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="audit-events.csv"');
    });

    it('should export audit events as JSON', async () => {
      const mockRes = createMockResponse();
      const jsonData = JSON.stringify([
        {
          id: 'audit-1',
          action: 'feature.created',
          actorEmail: 'test@example.com',
        },
      ]);
      service.export.mockResolvedValue(jsonData);

      const result = await controller.export(mockContext, { format: ExportFormat.JSON }, mockRes);

      expect(service.export).toHaveBeenCalledWith(mockContext, { format: ExportFormat.JSON });
      expect(result).toBe(jsonData);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="audit-events.json"');
    });

    it('should pass filters to export', async () => {
      const mockRes = createMockResponse();
      const query = {
        format: ExportFormat.CSV,
        action: AuditAction.FEATURE_CREATED,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      };

      service.export.mockResolvedValue('');

      await controller.export(mockContext, query, mockRes);

      expect(service.export).toHaveBeenCalledWith(mockContext, query);
    });
  });
});

