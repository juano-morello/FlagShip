/**
 * Plans Controller Unit Tests
 * TDD: Tests written FIRST before implementation
 */

import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto, QueryPlansDto } from './dto';

describe('PlansController', () => {
  let controller: PlansController;
  let service: jest.Mocked<PlansService>;

  const mockContext = {
    environmentId: 'env-1',
    projectId: 'proj-1',
    orgId: 'org-1',
    environmentType: 'development' as const,
  };

  const mockPlan = {
    id: 'plan-1',
    name: 'pro',
    displayName: 'Pro Plan',
    description: 'Professional tier',
    limits: { api_calls_monthly: 100000 },
    features: ['api-access', 'analytics'],
    priceMonthly: 4900,
    priceYearly: 49000,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeMeteredPriceId: null,
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    // Direct instantiation to avoid guard dependency issues
    service = {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<PlansService>;

    controller = new PlansController(service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated plans', async () => {
      const mockResult = {
        items: [mockPlan],
        total: 1,
        page: 1,
        limit: 10,
      };
      service.list.mockResolvedValue(mockResult);

      const query: QueryPlansDto = { page: 1, limit: 10 };
      const result = await controller.list(mockContext, query);

      expect(result).toEqual(mockResult);
      expect(service.list).toHaveBeenCalledWith(mockContext, query);
    });

    it('should support search filter', async () => {
      const mockResult = {
        items: [mockPlan],
        total: 1,
        page: 1,
        limit: 10,
      };
      service.list.mockResolvedValue(mockResult);

      const query: QueryPlansDto = { search: 'pro', page: 1, limit: 10 };
      const result = await controller.list(mockContext, query);

      expect(result).toEqual(mockResult);
      expect(service.list).toHaveBeenCalledWith(mockContext, query);
    });

    it('should support isActive filter', async () => {
      const mockResult = {
        items: [mockPlan],
        total: 1,
        page: 1,
        limit: 10,
      };
      service.list.mockResolvedValue(mockResult);

      const query: QueryPlansDto = { isActive: true, page: 1, limit: 10 };
      const result = await controller.list(mockContext, query);

      expect(result).toEqual(mockResult);
      expect(service.list).toHaveBeenCalledWith(mockContext, query);
    });
  });

  describe('get', () => {
    it('should return a single plan by id', async () => {
      service.get.mockResolvedValue(mockPlan);

      const result = await controller.get(mockContext, 'plan-1');

      expect(result).toEqual(mockPlan);
      expect(service.get).toHaveBeenCalledWith(mockContext, 'plan-1');
    });
  });

  describe('create', () => {
    it('should create a new plan', async () => {
      const createDto: CreatePlanDto = {
        name: 'pro',
        displayName: 'Pro Plan',
        description: 'Professional tier',
        limits: { api_calls_monthly: 100000 },
        features: ['api-access'],
        priceMonthly: 4900,
        priceYearly: 49000,
        sortOrder: 2,
      };
      service.create.mockResolvedValue(mockPlan);

      const result = await controller.create(mockContext, createDto);

      expect(result).toEqual(mockPlan);
      expect(service.create).toHaveBeenCalledWith(mockContext, createDto);
    });
  });

  describe('update', () => {
    it('should update an existing plan', async () => {
      const updateDto: UpdatePlanDto = {
        displayName: 'Updated Pro Plan',
        priceMonthly: 5900,
      };
      const updatedPlan = { ...mockPlan, ...updateDto };
      service.update.mockResolvedValue(updatedPlan);

      const result = await controller.update(mockContext, 'plan-1', updateDto);

      expect(result).toEqual(updatedPlan);
      expect(service.update).toHaveBeenCalledWith(mockContext, 'plan-1', updateDto);
    });
  });

  describe('delete', () => {
    it('should soft delete a plan', async () => {
      service.softDelete.mockResolvedValue(undefined);

      await controller.delete(mockContext, 'plan-1');

      expect(service.softDelete).toHaveBeenCalledWith(mockContext, 'plan-1');
    });
  });
});

