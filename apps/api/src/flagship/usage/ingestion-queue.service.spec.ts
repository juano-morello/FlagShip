/**
 * Ingestion Queue Service Tests
 * TDD: Tests written FIRST before implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { IngestionQueueService } from './ingestion-queue.service';
import { QueueService } from '../../queue/queue.service';
import type { UsageEventDto } from './dto/ingest.dto';
import type { UsageIngestJobData } from './dto/usage-ingest-job.dto';
import { QUEUE_NAMES } from '@forgestack/shared';

describe('IngestionQueueService', () => {
  let service: IngestionQueueService;
  let queueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    const mockQueueService = {
      addJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionQueueService,
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<IngestionQueueService>(IngestionQueueService);
    queueService = module.get(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueue', () => {
    const mockContext = {
      environmentId: 'env_123',
      orgId: 'org_456',
      projectId: 'proj_789',
    };

    const mockEvents: UsageEventDto[] = [
      { metric: 'api_calls', delta: 1 },
      { metric: 'storage_bytes', delta: 1024, idempotencyKey: 'req_abc' },
    ];

    it('should enqueue job with correct queue name', async () => {
      const mockJob = { id: 'job_123' };
      queueService.addJob.mockResolvedValue(mockJob as never);

      await service.enqueue(mockContext, mockEvents, 'req_123');

      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.FLAGSHIP_USAGE_INGEST,
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should include all context fields in job data', async () => {
      const mockJob = { id: 'job_123' };
      queueService.addJob.mockResolvedValue(mockJob as never);

      await service.enqueue(mockContext, mockEvents, 'req_123');

      const jobData = queueService.addJob.mock.calls[0][1] as UsageIngestJobData;
      expect(jobData).toMatchObject({
        requestId: 'req_123',
        environmentId: 'env_123',
        orgId: 'org_456',
        projectId: 'proj_789',
        events: mockEvents,
      });
      expect(jobData.queuedAt).toBeDefined();
    });

    it('should configure job with retry policy and jitter', async () => {
      const mockJob = { id: 'job_123' };
      queueService.addJob.mockResolvedValue(mockJob as never);

      await service.enqueue(mockContext, mockEvents, 'req_123');

      const jobOptions = queueService.addJob.mock.calls[0][2];
      expect(jobOptions.attempts).toBe(3);
      expect(typeof jobOptions.backoff).toBe('object');
      expect((jobOptions.backoff as any).type).toBe('exponential');
      // Delay should be between 1000ms and 1200ms (with jitter)
      expect((jobOptions.backoff as any).delay).toBeGreaterThanOrEqual(1000);
      expect((jobOptions.backoff as any).delay).toBeLessThanOrEqual(1200);
      expect(jobOptions.removeOnComplete).toBe(100);
      expect(jobOptions.removeOnFail).toBe(false); // Changed for DLQ routing
    });

    it('should return job ID', async () => {
      const mockJob = { id: 'job_xyz' };
      queueService.addJob.mockResolvedValue(mockJob as never);

      const result = await service.enqueue(mockContext, mockEvents, 'req_123');

      expect(result.jobId).toBe('job_xyz');
    });

    it('should return queued timestamp', async () => {
      const mockJob = { id: 'job_123' };
      queueService.addJob.mockResolvedValue(mockJob as never);

      const beforeEnqueue = new Date();
      const result = await service.enqueue(mockContext, mockEvents, 'req_123');
      const afterEnqueue = new Date();

      expect(result.queuedAt).toBeDefined();
      const queuedAt = new Date(result.queuedAt);
      expect(queuedAt.getTime()).toBeGreaterThanOrEqual(beforeEnqueue.getTime());
      expect(queuedAt.getTime()).toBeLessThanOrEqual(afterEnqueue.getTime());
    });

    it('should handle empty events array', async () => {
      const mockJob = { id: 'job_123' };
      queueService.addJob.mockResolvedValue(mockJob as never);

      await service.enqueue(mockContext, [], 'req_123');

      const jobData = queueService.addJob.mock.calls[0][1] as UsageIngestJobData;
      expect(jobData.events).toEqual([]);
    });

    it('should propagate queue service errors', async () => {
      const error = new Error('Redis connection failed');
      queueService.addJob.mockRejectedValue(error);

      await expect(service.enqueue(mockContext, mockEvents, 'req_123')).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });
});

