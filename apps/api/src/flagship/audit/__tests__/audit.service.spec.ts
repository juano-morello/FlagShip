/**
 * Audit Service Unit Tests
 * Tests MUST be written BEFORE implementation (TDD)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditService } from '../audit.service';
import { AuditRepository } from '../audit.repository';
import { QueueService } from '../../../queue/queue.service';

describe('AuditService', () => {
  let service: AuditService;
  let queueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: QueueService,
          useValue: {
            addJob: jest.fn(),
          },
        },
        {
          provide: AuditRepository,
          useValue: {
            findAll: jest.fn(),
            findAllForExport: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    queueService = module.get(QueueService);

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emit', () => {
    it('should queue an audit event', async () => {
      const context = {
        orgId: 'org-123',
        environmentId: 'env-123',
        actorId: 'user-123',
        actorType: 'user' as const,
        actorEmail: 'test@example.com',
      };

      const event = {
        action: 'feature.created',
        resourceType: 'feature',
        resourceId: 'feat-123',
        resourceName: 'test-feature',
        changes: {
          after: { key: 'test-feature', enabled: true },
        },
      };

      await service.emit(context, event);

      expect(queueService.addJob).toHaveBeenCalledWith(
        'flagship-audit',
        expect.objectContaining({
          ...context,
          ...event,
        }),
        expect.any(Object),
      );
    });

    it('should not throw on queue error', async () => {
      queueService.addJob.mockRejectedValueOnce(new Error('Queue error'));

      const context = {
        orgId: 'org-123',
        environmentId: 'env-123',
        actorId: 'user-123',
        actorType: 'user' as const,
      };

      const event = {
        action: 'feature.created',
        resourceType: 'feature',
      };

      await expect(service.emit(context, event)).resolves.not.toThrow();
    });

    it('should include metadata in queued event', async () => {
      const context = {
        orgId: 'org-123',
        environmentId: 'env-123',
        actorId: 'api-key-123',
        actorType: 'api_key' as const,
      };

      const event = {
        action: 'environment.updated',
        resourceType: 'environment',
        resourceId: 'env-123',
        metadata: {
          requestId: 'req-xyz',
          ipAddress: '192.168.1.1',
        },
      };

      await service.emit(context, event);

      expect(queueService.addJob).toHaveBeenCalledWith(
        'flagship-audit',
        expect.objectContaining({
          metadata: event.metadata,
        }),
        expect.any(Object),
      );
    });

    it('should handle system actor type', async () => {
      const context = {
        orgId: 'org-123',
        environmentId: null,
        actorId: null,
        actorType: 'system' as const,
      };

      const event = {
        action: 'plan.created',
        resourceType: 'plan',
        resourceId: 'plan-123',
      };

      await service.emit(context, event);

      expect(queueService.addJob).toHaveBeenCalledWith(
        'flagship-audit',
        expect.objectContaining({
          actorType: 'system',
          actorId: null,
        }),
        expect.any(Object),
      );
    });
  });
});

