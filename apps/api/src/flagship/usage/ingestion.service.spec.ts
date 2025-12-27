/**
 * Ingestion Service Unit Tests (TDD - Tests First)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { UsageRepository } from './usage.repository';
import { IdempotencyService } from './idempotency.service';
import type { UsageEventDto } from './dto/ingest.dto';

describe('IngestionService', () => {
  let service: IngestionService;
  let usageRepository: jest.Mocked<UsageRepository>;
  let idempotencyService: jest.Mocked<IdempotencyService>;

  const mockContext = {
    environmentId: 'env-123',
    orgId: 'org-123',
    projectId: 'project-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: UsageRepository,
          useValue: {
            incrementUsage: jest.fn(),
            getCurrentUsage: jest.fn(),
            getLimit: jest.fn(),
          },
        },
        {
          provide: IdempotencyService,
          useValue: {
            checkAndSet: jest.fn().mockResolvedValue(false), // Default: not a duplicate
            isProcessed: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    usageRepository = module.get(UsageRepository);
    idempotencyService = module.get(IdempotencyService);
  });

  describe('ingest', () => {
    it('should return response with requestId and processedAt', async () => {
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 1 });

      const result = await service.ingest(
        [{ metric: 'api_calls', delta: 1 }],
        mockContext,
      );

      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('processedAt');
      expect(result.requestId).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should accept valid events and increment usage', async () => {
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 5 });

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1 },
        { metric: 'storage_bytes', delta: 1024 },
      ];

      const result = await service.ingest(events, mockContext);

      expect(result.accepted).toBe(2);
      expect(result.rejected).toBe(0);
      expect(usageRepository.incrementUsage).toHaveBeenCalledTimes(2);
    });

    it('should reject events with invalid timestamp (future > 1 hour)', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // 2 hours in future

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1, timestamp: futureDate.toISOString() },
      ];

      const result = await service.ingest(events, mockContext);

      expect(result.accepted).toBe(0);
      expect(result.rejected).toBe(1);
      expect(result.errors?.[0].reason).toContain('future');
    });

    it('should reject events with timestamp too far in past (> 7 days)', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1, timestamp: pastDate.toISOString() },
      ];

      const result = await service.ingest(events, mockContext);

      expect(result.accepted).toBe(0);
      expect(result.rejected).toBe(1);
      expect(result.errors?.[0].reason).toContain('past');
    });

    it('should accept events with valid timestamp within range', async () => {
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 1 });
      const validDate = new Date();
      validDate.setMinutes(validDate.getMinutes() - 30); // 30 minutes ago

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1, timestamp: validDate.toISOString() },
      ];

      const result = await service.ingest(events, mockContext);

      expect(result.accepted).toBe(1);
      expect(result.rejected).toBe(0);
    });

    it('should handle negative delta (decrement)', async () => {
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 5 });

      const events: UsageEventDto[] = [
        { metric: 'storage_bytes', delta: -1024 },
      ];

      const result = await service.ingest(events, mockContext);

      expect(result.accepted).toBe(1);
      expect(usageRepository.incrementUsage).toHaveBeenCalledWith(
        mockContext.environmentId,
        mockContext.orgId,
        'storage_bytes',
        -1024,
        expect.any(Date),
      );
    });

    it('should return usage summary when requested', async () => {
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 100 });
      usageRepository.getLimit.mockResolvedValue({
        id: 'limit-1',
        limitValue: 1000,
        enforcement: 'hard',
      } as any);

      const events: UsageEventDto[] = [{ metric: 'api_calls', delta: 1 }];

      const result = await service.ingest(events, mockContext, {
        includeSummary: true,
      });

      expect(result.summary).toBeDefined();
      expect(result.summary?.api_calls).toEqual({
        current: 100,
        limit: 1000,
        remaining: 900,
      });
    });
  });

  describe('idempotency', () => {
    it('should check idempotency when key is provided', async () => {
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 1 });

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1, idempotencyKey: 'key-123' },
      ];

      await service.ingest(events, mockContext);

      expect(idempotencyService.checkAndSet).toHaveBeenCalledWith(
        mockContext.environmentId,
        'key-123',
      );
    });

    it('should skip duplicate events (already processed)', async () => {
      idempotencyService.checkAndSet.mockResolvedValue(true); // Is a duplicate

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1, idempotencyKey: 'duplicate-key' },
      ];

      const result = await service.ingest(events, mockContext);

      // Event was skipped, not counted as accepted or rejected
      expect(usageRepository.incrementUsage).not.toHaveBeenCalled();
      expect(result.accepted).toBe(0);
      expect(result.rejected).toBe(0);
    });

    it('should process new events (not duplicates)', async () => {
      idempotencyService.checkAndSet.mockResolvedValue(false); // Not a duplicate
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 1 });

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1, idempotencyKey: 'new-key' },
      ];

      const result = await service.ingest(events, mockContext);

      expect(usageRepository.incrementUsage).toHaveBeenCalled();
      expect(result.accepted).toBe(1);
    });

    it('should not check idempotency when no key provided', async () => {
      usageRepository.incrementUsage.mockResolvedValue({ currentValue: 1 });

      const events: UsageEventDto[] = [
        { metric: 'api_calls', delta: 1 }, // No idempotencyKey
      ];

      await service.ingest(events, mockContext);

      expect(idempotencyService.checkAndSet).not.toHaveBeenCalled();
      expect(usageRepository.incrementUsage).toHaveBeenCalled();
    });
  });
});

