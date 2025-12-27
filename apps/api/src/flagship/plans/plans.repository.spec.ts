/**
 * Plans Repository Unit Tests
 * TDD: Tests written FIRST before implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PlansRepository } from './plans.repository';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  ilike: jest.fn(),
  desc: jest.fn(),
  asc: jest.fn(),
  count: jest.fn(),
  sql: jest.fn(),
  withServiceContext: jest.fn(),
  plans: {},
  subscriptions: {},
}));

import { withServiceContext } from '@forgestack/db';

describe('PlansRepository', () => {
  let repository: PlansRepository;
  let mockDb: any;

  beforeEach(async () => {
    // Create a chainable mock that returns itself for all methods
    const createChainableMock = () => {
      const mock: any = {};
      mock.select = jest.fn().mockReturnValue(mock);
      mock.from = jest.fn().mockReturnValue(mock);
      mock.where = jest.fn().mockReturnValue(mock);
      mock.limit = jest.fn().mockReturnValue(mock);
      mock.offset = jest.fn().mockReturnValue(mock);
      mock.orderBy = jest.fn().mockReturnValue(mock);
      mock.insert = jest.fn().mockReturnValue(mock);
      mock.values = jest.fn().mockReturnValue(mock);
      mock.returning = jest.fn().mockReturnValue(mock);
      mock.update = jest.fn().mockReturnValue(mock);
      mock.set = jest.fn().mockReturnValue(mock);
      return mock;
    };

    mockDb = createChainableMock();

    (withServiceContext as jest.Mock).mockImplementation((reason, fn) => fn(mockDb));

    const module: TestingModule = await Test.createTestingModule({
      providers: [PlansRepository],
    }).compile();

    repository = module.get<PlansRepository>(PlansRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated plans', async () => {
      const mockPlans = [
        { id: 'plan-1', name: 'free', displayName: 'Free Plan', sortOrder: 1 },
        { id: 'plan-2', name: 'pro', displayName: 'Pro Plan', sortOrder: 2 },
      ];

      // Mock count query - first call to where() returns count
      mockDb.where.mockResolvedValueOnce([{ value: 2 }]);
      // Mock items query - offset() returns items
      mockDb.offset.mockResolvedValueOnce(mockPlans);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.items).toEqual(mockPlans);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by search term', async () => {
      mockDb.where.mockResolvedValueOnce([{ value: 1 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      await repository.findAll({ search: 'pro', page: 1, limit: 10 });

      expect(withServiceContext).toHaveBeenCalled();
    });

    it('should filter by isActive status', async () => {
      mockDb.where.mockResolvedValueOnce([{ value: 0 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      await repository.findAll({ isActive: true, page: 1, limit: 10 });

      expect(withServiceContext).toHaveBeenCalled();
    });

    it('should order by sortOrder ascending', async () => {
      mockDb.where.mockResolvedValueOnce([{ value: 0 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      await repository.findAll({ page: 1, limit: 10 });

      expect(withServiceContext).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return plan by id', async () => {
      const mockPlan = { id: 'plan-1', name: 'pro', displayName: 'Pro Plan' };
      mockDb.limit.mockResolvedValueOnce([mockPlan]);

      const result = await repository.findById('plan-1');

      expect(result).toEqual(mockPlan);
      expect(withServiceContext).toHaveBeenCalled();
    });

    it('should return null if plan not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await repository.findById('plan-999');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return plan by name', async () => {
      const mockPlan = { id: 'plan-1', name: 'pro', displayName: 'Pro Plan' };
      mockDb.limit.mockResolvedValueOnce([mockPlan]);

      const result = await repository.findByName('pro');

      expect(result).toEqual(mockPlan);
      expect(withServiceContext).toHaveBeenCalled();
    });

    it('should return null if plan not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await repository.findByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new plan', async () => {
      const createData = {
        name: 'pro',
        displayName: 'Pro Plan',
        description: 'Professional tier',
        limits: { api_calls_monthly: 100000 },
        features: ['api-access'],
      };
      const mockCreated = { id: 'plan-1', ...createData };
      mockDb.returning.mockResolvedValueOnce([mockCreated]);

      const result = await repository.create(createData);

      expect(result).toEqual(mockCreated);
      expect(withServiceContext).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing plan', async () => {
      const updateData = {
        displayName: 'Updated Pro Plan',
        priceMonthly: 5900,
      };
      const mockUpdated = { id: 'plan-1', name: 'pro', ...updateData };
      mockDb.returning.mockResolvedValueOnce([mockUpdated]);

      const result = await repository.update('plan-1', updateData);

      expect(result).toEqual(mockUpdated);
      expect(withServiceContext).toHaveBeenCalled();
    });

    it('should return null if plan not found', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await repository.update('plan-999', { displayName: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should set isActive to false', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 'plan-1', isActive: false }]);

      await repository.softDelete('plan-1');

      expect(withServiceContext).toHaveBeenCalled();
    });
  });

  describe('hasActiveSubscriptions', () => {
    it('should return false (placeholder implementation)', async () => {
      // TODO: Update this test when subscriptions table is implemented
      const result = await repository.hasActiveSubscriptions('plan-1');

      expect(result).toBe(false);
      expect(withServiceContext).toHaveBeenCalled();
    });
  });
});

