/**
 * Ingestion Controller Unit Tests
 * Updated for async queue-based ingestion
 */

import { IngestionController } from './ingestion.controller';
import { IngestionQueueService } from './ingestion-queue.service';
import type { FlagshipContext } from '../guards/environment.guard';
import type { IngestRequestDto, AsyncIngestResponseDto } from './dto/ingest.dto';

describe('IngestionController', () => {
  let controller: IngestionController;
  let ingestionQueueService: jest.Mocked<IngestionQueueService>;

  const mockContext: FlagshipContext = {
    environmentId: 'env-123',
    orgId: 'org-123',
    projectId: 'project-123',
    environmentType: 'development',
  };

  const mockEnqueueResult = {
    jobId: 'job-123',
    queuedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    ingestionQueueService = {
      enqueue: jest.fn().mockResolvedValue(mockEnqueueResult),
    } as unknown as jest.Mocked<IngestionQueueService>;

    controller = new IngestionController(ingestionQueueService);
  });

  describe('ingest (async with queue)', () => {
    it('should enqueue events and return 202 Accepted response', async () => {
      const dto: IngestRequestDto = {
        events: [
          { metric: 'api_calls', delta: 1 },
          { metric: 'storage_bytes', delta: 1024 },
        ],
      };

      const result = await controller.ingest(dto, mockContext);

      expect(ingestionQueueService.enqueue).toHaveBeenCalledWith(
        {
          projectId: mockContext.projectId,
          environmentId: mockContext.environmentId,
          orgId: mockContext.orgId,
        },
        dto.events,
        expect.any(String), // requestId
      );
      expect(result.status).toBe('queued');
      expect(result.eventCount).toBe(2);
      expect(result.jobId).toBe('job-123');
    });

    it('should generate unique requestId for each request', async () => {
      const dto: IngestRequestDto = {
        events: [{ metric: 'api_calls', delta: 1 }],
      };

      await controller.ingest(dto, mockContext);
      const firstRequestId = ingestionQueueService.enqueue.mock.calls[0][2];

      await controller.ingest(dto, mockContext);
      const secondRequestId = ingestionQueueService.enqueue.mock.calls[1][2];

      expect(firstRequestId).not.toBe(secondRequestId);
    });

    it('should return queuedAt timestamp', async () => {
      const dto: IngestRequestDto = {
        events: [{ metric: 'api_calls', delta: 1 }],
      };

      const result = await controller.ingest(dto, mockContext);

      expect(result.queuedAt).toBeDefined();
      expect(typeof result.queuedAt).toBe('string');
    });

    it('should include jobId in response', async () => {
      const dto: IngestRequestDto = {
        events: [{ metric: 'api_calls', delta: 1 }],
      };

      const result = await controller.ingest(dto, mockContext);

      expect(result.jobId).toBe('job-123');
    });

    it('should handle empty events array', async () => {
      const dto: IngestRequestDto = {
        events: [],
      };

      const result = await controller.ingest(dto, mockContext);

      expect(result.eventCount).toBe(0);
      expect(ingestionQueueService.enqueue).toHaveBeenCalledWith(
        expect.any(Object),
        [],
        expect.any(String),
      );
    });
  });
});

