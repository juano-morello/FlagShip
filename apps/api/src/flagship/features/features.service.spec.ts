/**
 * Features Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { FeaturesRepository } from './features.repository';
import { ActivitiesService } from '../../activities/activities.service';
import { AuditService } from '../audit/audit.service';
import { CreateFeatureDto, UpdateFeatureDto, FeatureType } from './dto';

describe('FeaturesService', () => {
  let service: FeaturesService;
  let repository: jest.Mocked<FeaturesRepository>;
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
        FeaturesService,
        {
          provide: FeaturesRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByKey: jest.fn(),
            findRulesForFeature: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
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

    service = module.get<FeaturesService>(FeaturesService);
    repository = module.get(FeaturesRepository) as jest.Mocked<FeaturesRepository>;
    activitiesService = module.get(ActivitiesService) as jest.Mocked<ActivitiesService>;
    auditService = module.get(AuditService) as jest.Mocked<AuditService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated features', async () => {
      const mockResult = {
        items: [{
          id: '1',
          key: 'feature1',
          name: 'Feature 1',
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
      expect(repository.findAll).toHaveBeenCalledWith('proj-1', { page: 1, limit: 10 });
    });
  });

  describe('get', () => {
    it('should return feature with rules', async () => {
      const mockFeature = {
        id: '1',
        key: 'feature1',
        name: 'Feature 1',
        projectId: 'proj-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockRules = [{
        id: 'rule-1',
        featureId: '1',
        ruleType: 'override',
        value: {},
        priority: 100,
        enabled: true,
      }];
      repository.findById.mockResolvedValue(mockFeature as any);
      repository.findRulesForFeature.mockResolvedValue(mockRules as any);

      const result = await service.get(mockContext, '1');

      expect(result.id).toBe('1');
      expect(result.rules).toHaveLength(1);
      expect(repository.findById).toHaveBeenCalledWith('1', 'proj-1');
      expect(repository.findRulesForFeature).toHaveBeenCalledWith('1', 'env-1');
    });

    it('should throw NotFoundException if feature not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.get(mockContext, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateFeatureDto = {
      key: 'new_feature',
      name: 'New Feature',
      type: FeatureType.BOOLEAN,
      defaultValue: false,
    };

    it('should create a new feature', async () => {
      const mockCreated = {
        id: '1',
        ...createDto,
        projectId: 'proj-1',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.findByKey.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCreated as any);

      const result = await service.create(mockContext, createDto);

      expect(result.id).toBe('1');
      expect(result.key).toBe('new_feature');
      expect(repository.findByKey).toHaveBeenCalledWith('proj-1', 'new_feature');
      expect(repository.create).toHaveBeenCalledWith({
        projectId: 'proj-1',
        key: 'new_feature',
        name: 'New Feature',
        type: 'boolean',
        defaultValue: false,
        enabled: true,
        description: null,
        metadata: null,
      });
      expect(activitiesService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if key already exists', async () => {
      repository.findByKey.mockResolvedValue({ id: '1', key: 'new_feature' } as any);

      await expect(service.create(mockContext, createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateFeatureDto = {
      name: 'Updated Name',
      enabled: false,
    };

    it('should update an existing feature', async () => {
      const mockUpdated = {
        id: '1',
        ...updateDto,
        key: 'feature1',
        projectId: 'proj-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.update.mockResolvedValue(mockUpdated as any);

      const result = await service.update(mockContext, '1', updateDto);

      expect(result.id).toBe('1');
      expect(result.name).toBe('Updated Name');
      expect(repository.update).toHaveBeenCalledWith('1', 'proj-1', updateDto);
      expect(activitiesService.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if feature not found', async () => {
      repository.update.mockResolvedValue(null);

      await expect(service.update(mockContext, '999', updateDto)).rejects.toThrow(NotFoundException);
    });
  });
});

