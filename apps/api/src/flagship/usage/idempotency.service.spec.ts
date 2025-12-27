/**
 * Idempotency Service Unit Tests (TDD - Tests First)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let mockRedis: {
    set: jest.Mock;
    get: jest.Mock;
    quit: jest.Mock;
  };

  beforeEach(async () => {
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      quit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('redis://localhost:6379'),
          },
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    // Inject mock Redis
    (service as any).redis = mockRedis;
  });

  describe('checkAndSet', () => {
    it('should return false for new key (not a duplicate)', async () => {
      // NX returns 'OK' when key was set (didn't exist)
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.checkAndSet('env-123', 'key-abc');

      expect(result).toBe(false); // Not a duplicate
      expect(mockRedis.set).toHaveBeenCalledWith(
        'idempotency:env-123:key-abc',
        expect.any(String),
        'EX',
        86400, // 24 hours in seconds
        'NX',
      );
    });

    it('should return true for existing key (is a duplicate)', async () => {
      // NX returns null when key already exists
      mockRedis.set.mockResolvedValue(null);

      const result = await service.checkAndSet('env-123', 'key-abc');

      expect(result).toBe(true); // Is a duplicate
    });

    it('should use correct key format with environment scope', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await service.checkAndSet('env-456', 'unique-key');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'idempotency:env-456:unique-key',
        expect.any(String),
        'EX',
        86400,
        'NX',
      );
    });

    it('should store timestamp as value', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await service.checkAndSet('env-123', 'key-abc');

      const storedValue = mockRedis.set.mock.calls[0][1];
      // Value should be an ISO timestamp
      expect(() => new Date(storedValue)).not.toThrow();
    });
  });

  describe('isProcessed', () => {
    it('should return true if key exists', async () => {
      mockRedis.get.mockResolvedValue('2024-01-15T10:30:00Z');

      const result = await service.isProcessed('env-123', 'key-abc');

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('idempotency:env-123:key-abc');
    });

    it('should return false if key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.isProcessed('env-123', 'key-abc');

      expect(result).toBe(false);
    });
  });

  describe('when Redis is not configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          IdempotencyService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(null), // No Redis URL
            },
          },
        ],
      }).compile();

      service = module.get<IdempotencyService>(IdempotencyService);
    });

    it('should return false for checkAndSet (allow processing)', async () => {
      const result = await service.checkAndSet('env-123', 'key-abc');
      expect(result).toBe(false);
    });

    it('should return false for isProcessed', async () => {
      const result = await service.isProcessed('env-123', 'key-abc');
      expect(result).toBe(false);
    });
  });
});

