/**
 * Audit Repository Unit Tests
 * Tests MUST be written BEFORE implementation (TDD)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditRepository } from '../audit.repository';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  ilike: jest.fn(),
  desc: jest.fn(),
  count: jest.fn(),
  withServiceContext: jest.fn(),
  flagshipAuditEvents: {},
}));

import { withServiceContext } from '@forgestack/db';

describe('AuditRepository', () => {
  let repository: AuditRepository;
  let mockDb: any;

  beforeEach(async () => {
    const createMockChain = () => ({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    });

    mockDb = createMockChain();

    (withServiceContext as jest.Mock).mockImplementation((reason, fn) => fn(mockDb));

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditRepository],
    }).compile();

    repository = module.get<AuditRepository>(AuditRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an audit event', async () => {
      const eventData = {
        orgId: 'org-123',
        environmentId: 'env-123',
        actorId: 'user-123',
        actorType: 'user' as const,
        actorEmail: 'test@example.com',
        action: 'feature.created',
        resourceType: 'feature',
        resourceId: 'feat-123',
        resourceName: 'test-feature',
        changes: { after: { key: 'test' } },
        metadata: { requestId: 'req-123' },
      };

      const expectedEvent = { id: 'audit-123', ...eventData, createdAt: new Date() };
      mockDb.returning.mockResolvedValue([expectedEvent]);

      const result = await repository.create(eventData);

      expect(withServiceContext).toHaveBeenCalledWith(
        'AuditRepository.create',
        expect.any(Function),
      );
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(eventData);
      expect(result).toEqual(expectedEvent);
    });
  });

  describe('findAll', () => {
    it('should return paginated audit events', async () => {
      const events = [
        { id: '1', action: 'feature.created', createdAt: new Date() },
        { id: '2', action: 'feature.updated', createdAt: new Date() },
      ];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);
      mockDb.offset.mockResolvedValue(events);

      // Mock count query
      const countMockDb = createMockChain();
      countMockDb.select.mockReturnValue(countMockDb);
      countMockDb.from.mockReturnValue(countMockDb);
      countMockDb.where.mockResolvedValue([{ count: 2 }]);

      (withServiceContext as jest.Mock)
        .mockImplementationOnce((reason, fn) => fn(mockDb))
        .mockImplementationOnce((reason, fn) => fn(countMockDb));

      const result = await repository.findAll('org-123', {
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(events);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by action', async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);
      mockDb.offset.mockResolvedValue([]);

      const countMockDb = createMockChain();
      countMockDb.select.mockReturnValue(countMockDb);
      countMockDb.from.mockReturnValue(countMockDb);
      countMockDb.where.mockResolvedValue([{ count: 0 }]);

      (withServiceContext as jest.Mock)
        .mockImplementationOnce((reason, fn) => fn(mockDb))
        .mockImplementationOnce((reason, fn) => fn(countMockDb));

      await repository.findAll('org-123', {
        action: 'feature.created',
        page: 1,
        limit: 10,
      });

      expect(mockDb.where).toHaveBeenCalled();
    });
  });
});

function createMockChain() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
  };
}

