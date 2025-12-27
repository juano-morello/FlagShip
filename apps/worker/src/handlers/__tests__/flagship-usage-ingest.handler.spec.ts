/**
 * FlagShip Usage Ingest Handler Tests
 * TDD: Tests written FIRST before implementation
 */

import { Job } from 'bullmq';
import {
  handleFlagshipUsageIngest,
  FlagshipUsageIngestJobData,
} from '../flagship-usage-ingest.handler';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  flagshipUsageMetrics: {},
  eq: jest.fn(),
  and: jest.fn(),
  lte: jest.fn(),
  gte: jest.fn(),
  sql: jest.fn(),
}));

// Mock the logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    redis: {
      url: 'redis://localhost:6379',
    },
  },
}));

// Mock IORedis for idempotency
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockQuit = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    set: mockSet,
    get: mockGet,
    quit: mockQuit,
    on: jest.fn(),
  }));
});

// Mock shared utilities
jest.mock('@forgestack/shared', () => ({
  ...jest.requireActual('@forgestack/shared'),
  checkIdempotencyKey: jest.fn(),
  calculatePeriodBoundaries: jest.fn(),
}));

describe('handleFlagshipUsageIngest', () => {
  const mockJob = {
    id: 'job-123',
    data: {
      requestId: 'req-123',
      environmentId: 'env-123',
      orgId: 'org-456',
      projectId: 'proj-789',
      events: [
        { metric: 'api_calls', delta: 1 },
        { metric: 'storage_bytes', delta: 1024 },
      ],
      queuedAt: new Date().toISOString(),
    } as FlagshipUsageIngestJobData,
  } as Job<FlagshipUsageIngestJobData>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mocked functions from @forgestack/shared
    const { checkIdempotencyKey, calculatePeriodBoundaries } = require('@forgestack/shared');

    // Mock calculatePeriodBoundaries to return fixed dates
    calculatePeriodBoundaries.mockReturnValue({
      periodStart: new Date('2024-01-01T00:00:00.000Z'),
      periodEnd: new Date('2024-01-31T23:59:59.999Z'),
    });

    // Mock checkIdempotencyKey to return false (not duplicate) by default
    checkIdempotencyKey.mockResolvedValue(false);

    // Mock withServiceContext to execute the callback
    const { withServiceContext } = require('@forgestack/db');
    withServiceContext.mockImplementation(async (_name: string, callback: Function) => {
      return callback({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: '1', currentValue: 1 }]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
      });
    });
  });

  it('should process all events successfully', async () => {
    const result = await handleFlagshipUsageIngest(mockJob);

    expect(result).toEqual({
      success: true,
      processed: 2,
      skipped: 0,
    });
  });

  it('should skip duplicate events with idempotency keys', async () => {
    const { checkIdempotencyKey } = require('@forgestack/shared');

    const jobWithIdempotency = {
      ...mockJob,
      data: {
        ...mockJob.data,
        events: [
          { metric: 'api_calls', delta: 1, idempotencyKey: 'key-1' },
          { metric: 'storage_bytes', delta: 1024, idempotencyKey: 'key-2' },
        ],
      },
    } as Job<FlagshipUsageIngestJobData>;

    // First event is duplicate, second is new
    checkIdempotencyKey.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await handleFlagshipUsageIngest(jobWithIdempotency);

    expect(result).toEqual({
      success: true,
      processed: 1,
      skipped: 1,
    });
  });

  it('should handle empty events array', async () => {
    const emptyJob = {
      ...mockJob,
      data: {
        ...mockJob.data,
        events: [],
      },
    } as Job<FlagshipUsageIngestJobData>;

    const result = await handleFlagshipUsageIngest(emptyJob);

    expect(result).toEqual({
      success: true,
      processed: 0,
      skipped: 0,
    });
  });

  it('should throw on database errors to trigger retry', async () => {
    const { withServiceContext } = require('@forgestack/db');
    withServiceContext.mockRejectedValueOnce(new Error('Database connection failed'));

    await expect(handleFlagshipUsageIngest(mockJob)).rejects.toThrow(
      'Database connection failed',
    );
  });
});

