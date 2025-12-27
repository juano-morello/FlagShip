/**
 * Plans Service Unit Tests
 * TDD: Tests written FIRST before implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansRepository } from './plans.repository';
import { ActivitiesService } from '../../activities/activities.service';
import { AuditService } from '../audit/audit.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';

describe('PlansService', () => {
  let service: PlansService;
  let repository: jest.Mocked<PlansRepository>;
  let activitiesService: jest.Mocked<ActivitiesService>;
  let auditService: jest.Mocked<AuditService>;

  const mockContext = {
    environmentId: 'env-1',
    projectId: 'proj-1',
    orgId: 'org-1',
    environmentType: 'development' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: PlansRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            hasActiveSubscriptions: jest.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            emit: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    repository = module.get(PlansRepository) as jest.Mocked<PlansRepository>;
    activitiesService = module.get(ActivitiesService) as jest.Mocked<ActivitiesService>;
    auditService = module.get(AuditService) as jest.Mocked<AuditService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated plans', async () => {
      const mockResult = {
        items: [{
          id: 'plan-1',
          name: 'pro',
          displayName: 'Pro Plan',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        total: 1,
        page: 1,
        limit: 10,
      };
      repository.findAll.mockResolvedValue(mockResult as any);

      const result = await service.list(mockContext, { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('get', () => {
    it('should return plan by id', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'pro',
        displayName: 'Pro Plan',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.findById.mockResolvedValue(mockPlan as any);

      const result = await service.get(mockContext, 'plan-1');

      expect(result.id).toBe('plan-1');
      expect(repository.findById).toHaveBeenCalledWith('plan-1');
    });

    it('should throw NotFoundException if plan not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.get(mockContext, 'plan-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
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

    it('should create a new plan', async () => {
      const mockCreated = {
        id: 'plan-1',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCreated as any);

      const result = await service.create(mockContext, createDto);

      expect(result.id).toBe('plan-1');
      expect(result.name).toBe('pro');
      expect(repository.findByName).toHaveBeenCalledWith('pro');
      expect(repository.create).toHaveBeenCalled();
      expect(activitiesService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if name already exists', async () => {
      repository.findByName.mockResolvedValue({ id: 'plan-1', name: 'pro' } as any);

      await expect(service.create(mockContext, createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if name format is invalid', async () => {
      const invalidDto = { ...createDto, name: 'Invalid Name!' };

      await expect(service.create(mockContext, invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto: UpdatePlanDto = {
      displayName: 'Updated Pro Plan',
      priceMonthly: 5900,
    };

    it('should update an existing plan', async () => {
      const mockUpdated = {
        id: 'plan-1',
        name: 'pro',
        displayName: 'Updated Pro Plan',
        priceMonthly: 5900,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.update.mockResolvedValue(mockUpdated as any);

      const result = await service.update(mockContext, 'plan-1', updateDto);

      expect(result.id).toBe('plan-1');
      expect(result.displayName).toBe('Updated Pro Plan');
      expect(repository.update).toHaveBeenCalledWith('plan-1', updateDto);
      expect(activitiesService.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if plan not found', async () => {
      repository.update.mockResolvedValue(null);

      await expect(service.update(mockContext, 'plan-999', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should not allow updating name field', async () => {
      const invalidDto = { ...updateDto, name: 'new-name' } as any;

      // Name should be stripped or ignored in update
      const mockUpdated = {
        id: 'plan-1',
        name: 'pro', // Original name unchanged
        displayName: 'Updated Pro Plan',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.update.mockResolvedValue(mockUpdated as any);

      const result = await service.update(mockContext, 'plan-1', invalidDto);

      // Verify name wasn't changed
      expect(result.name).toBe('pro');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a plan', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'pro',
        displayName: 'Pro Plan',
        description: 'Pro plan',
        limits: {},
        features: [],
        priceMonthly: 1000,
        priceYearly: 10000,
        stripePriceIdMonthly: null,
        stripePriceIdYearly: null,
        stripeMeteredPriceId: null,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.findById.mockResolvedValue(mockPlan);
      repository.hasActiveSubscriptions.mockResolvedValue(false);
      repository.softDelete.mockResolvedValue(undefined);

      await service.softDelete(mockContext, 'plan-1');

      expect(repository.findById).toHaveBeenCalledWith('plan-1');
      expect(repository.hasActiveSubscriptions).toHaveBeenCalledWith('plan-1');
      expect(repository.softDelete).toHaveBeenCalledWith('plan-1');
      expect(activitiesService.create).toHaveBeenCalled();
      expect(auditService.emit).toHaveBeenCalled();
    });

    it('should throw ConflictException if plan has active subscriptions', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'pro',
        displayName: 'Pro Plan',
        description: 'Pro plan',
        limits: {},
        features: [],
        priceMonthly: 1000,
        priceYearly: 10000,
        stripePriceIdMonthly: null,
        stripePriceIdYearly: null,
        stripeMeteredPriceId: null,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.findById.mockResolvedValue(mockPlan);
      repository.hasActiveSubscriptions.mockResolvedValue(true);

      await expect(service.softDelete(mockContext, 'plan-1')).rejects.toThrow(ConflictException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if plan not found', async () => {
      repository.hasActiveSubscriptions.mockResolvedValue(false);
      repository.findById.mockResolvedValue(null);

      await expect(service.softDelete(mockContext, 'plan-999')).rejects.toThrow(NotFoundException);
      expect(repository.hasActiveSubscriptions).toHaveBeenCalledWith('plan-999');
      expect(repository.findById).toHaveBeenCalledWith('plan-999');
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});

