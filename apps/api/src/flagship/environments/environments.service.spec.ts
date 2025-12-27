/**
 * Environments Service Tests
 * TDD: Tests written FIRST before implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsRepository } from './environments.repository';
import { ActivitiesService } from '../../activities/activities.service';
import { AuditService } from '../audit/audit.service';
import { FlagshipContext } from '../guards/environment.guard';
import { EnvironmentType } from './dto';
import type { Environment } from '@forgestack/db';

describe('EnvironmentsService', () => {
  let service: EnvironmentsService;
  let repository: jest.Mocked<EnvironmentsRepository>;
  let activitiesService: jest.Mocked<ActivitiesService>;
  let auditService: jest.Mocked<AuditService>;

  const mockFlagshipContext: FlagshipContext = {
    environmentId: 'env-123',
    projectId: 'proj-123',
    orgId: 'org-123',
    environmentType: 'staging',
  };

  const mockEnvironment: Environment = {
    id: 'env-456',
    projectId: 'proj-123',
    name: 'Staging',
    type: 'staging',
    apiKeyPrefix: 'fsk_staging_',
    isDefault: false,
    settings: { debugMode: true },
    createdAt: new Date('2024-12-26T10:00:00.000Z'),
    updatedAt: new Date('2024-12-26T10:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentsService,
        {
          provide: EnvironmentsRepository,
          useValue: {
            findById: jest.fn(),
            findByProjectId: jest.fn(),
            findByProjectAndType: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
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

    service = module.get<EnvironmentsService>(EnvironmentsService);
    repository = module.get(EnvironmentsRepository);
    activitiesService = module.get(ActivitiesService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return paginated list of environments', async () => {
      const query = { page: 1, limit: 10 };
      const mockEnvs = [mockEnvironment];

      repository.findByProjectId.mockResolvedValue(mockEnvs);

      const result = await service.list(mockFlagshipContext, query);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(repository.findByProjectId).toHaveBeenCalledWith(mockFlagshipContext.projectId);
    });

    it('should filter by search term', async () => {
      const query = { search: 'staging', page: 1, limit: 10 };
      const mockEnvs = [mockEnvironment];

      repository.findByProjectId.mockResolvedValue(mockEnvs);

      const result = await service.list(mockFlagshipContext, query);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toContain('Staging');
    });

    it('should filter by type', async () => {
      const query = { type: EnvironmentType.STAGING, page: 1, limit: 10 };
      const mockEnvs = [mockEnvironment];

      repository.findByProjectId.mockResolvedValue(mockEnvs);

      const result = await service.list(mockFlagshipContext, query);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe(EnvironmentType.STAGING);
    });

    it('should filter by isDefault', async () => {
      const query = { isDefault: true, page: 1, limit: 10 };
      const defaultEnv = { ...mockEnvironment, isDefault: true };

      repository.findByProjectId.mockResolvedValue([defaultEnv]);

      const result = await service.list(mockFlagshipContext, query);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isDefault).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const query = { page: 2, limit: 5 };
      const mockEnvs = Array(10).fill(null).map((_, i) => ({
        ...mockEnvironment,
        id: `env-${i}`,
        name: `Environment ${i}`,
      }));

      repository.findByProjectId.mockResolvedValue(mockEnvs);

      const result = await service.list(mockFlagshipContext, query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(10);
      expect(result.items).toHaveLength(5);
    });
  });

  describe('get', () => {
    it('should return environment by ID', async () => {
      repository.findById.mockResolvedValue(mockEnvironment);

      const result = await service.get(mockFlagshipContext, 'env-456');

      expect(result.id).toBe('env-456');
      expect(repository.findById).toHaveBeenCalledWith('env-456');
    });

    it('should throw NotFoundException when environment not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.get(mockFlagshipContext, 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when environment belongs to different project', async () => {
      const otherProjectEnv = { ...mockEnvironment, projectId: 'other-proj' };
      repository.findById.mockResolvedValue(otherProjectEnv);

      await expect(service.get(mockFlagshipContext, 'env-456')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create environment with all fields', async () => {
      const dto = {
        name: 'Production',
        type: EnvironmentType.PRODUCTION,
        apiKeyPrefix: 'fsk_prod_',
        isDefault: true,
        settings: { logLevel: 'info' },
      };

      const newEnv = {
        ...mockEnvironment,
        ...dto,
        id: 'env-new',
        projectId: mockFlagshipContext.projectId,
      };

      repository.findByProjectAndType.mockResolvedValue(null);
      repository.findByProjectId.mockResolvedValue([]); // For unsetOtherDefaults
      repository.create.mockResolvedValue(newEnv);

      const result = await service.create(mockFlagshipContext, dto);

      expect(result.id).toBe('env-new');
      expect(result.name).toBe('Production');
      expect(repository.findByProjectAndType).toHaveBeenCalledWith(mockFlagshipContext.projectId, EnvironmentType.PRODUCTION);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        projectId: mockFlagshipContext.projectId,
        name: dto.name,
        type: dto.type,
        apiKeyPrefix: dto.apiKeyPrefix,
        isDefault: dto.isDefault,
        settings: dto.settings,
      }));
      expect(activitiesService.create).toHaveBeenCalledWith(expect.objectContaining({
        orgId: mockFlagshipContext.orgId,
        type: 'flagship.environment.created',
      }));
    });

    it('should auto-generate apiKeyPrefix if not provided', async () => {
      const dto = {
        name: 'Development',
        type: EnvironmentType.DEVELOPMENT,
      };

      const newEnv = {
        ...mockEnvironment,
        ...dto,
        id: 'env-dev',
        apiKeyPrefix: 'fsk_development_',
        isDefault: false,
        settings: null,
      };

      repository.findByProjectAndType.mockResolvedValue(null);
      repository.create.mockResolvedValue(newEnv);

      const result = await service.create(mockFlagshipContext, dto);

      expect(result.apiKeyPrefix).toBe('fsk_development_');
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        apiKeyPrefix: 'fsk_development_',
      }));
    });

    it('should throw ConflictException when type already exists', async () => {
      const dto = {
        name: 'Staging',
        type: EnvironmentType.STAGING,
      };

      repository.findByProjectAndType.mockResolvedValue(mockEnvironment);

      await expect(service.create(mockFlagshipContext, dto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should unset other defaults when creating with isDefault=true', async () => {
      const dto = {
        name: 'Production',
        type: EnvironmentType.PRODUCTION,
        isDefault: true,
      };

      const existingDefault = { ...mockEnvironment, isDefault: true };
      const newEnv = {
        ...mockEnvironment,
        ...dto,
        id: 'env-new',
        apiKeyPrefix: 'fsk_production_',
      };

      repository.findByProjectAndType.mockResolvedValue(null);
      repository.findByProjectId.mockResolvedValue([existingDefault]);
      repository.update.mockResolvedValue({ ...existingDefault, isDefault: false });
      repository.create.mockResolvedValue(newEnv);

      const result = await service.create(mockFlagshipContext, dto);

      expect(result.isDefault).toBe(true);
      expect(repository.update).toHaveBeenCalledWith(existingDefault.id, { isDefault: false });
    });
  });

  describe('update', () => {
    it('should update environment fields', async () => {
      const dto = {
        name: 'Staging Environment',
        settings: { debugMode: false },
      };

      const updatedEnv = {
        ...mockEnvironment,
        ...dto,
        updatedAt: new Date('2024-12-26T11:00:00.000Z'),
      };

      repository.findById.mockResolvedValue(mockEnvironment);
      repository.update.mockResolvedValue(updatedEnv);

      const result = await service.update(mockFlagshipContext, 'env-456', dto);

      expect(result.name).toBe('Staging Environment');
      expect(result.settings).toEqual({ debugMode: false });
      expect(repository.update).toHaveBeenCalledWith('env-456', dto);
      expect(activitiesService.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'flagship.environment.updated',
      }));
    });

    it('should unset other defaults when updating isDefault to true', async () => {
      const dto = { isDefault: true };

      const existingDefault = { ...mockEnvironment, id: 'env-other', isDefault: true };
      const updatedEnv = { ...mockEnvironment, isDefault: true };

      repository.findById.mockResolvedValue(mockEnvironment);
      repository.findByProjectId.mockResolvedValue([existingDefault, mockEnvironment]);
      repository.update.mockResolvedValueOnce({ ...existingDefault, isDefault: false });
      repository.update.mockResolvedValueOnce(updatedEnv);

      const result = await service.update(mockFlagshipContext, 'env-456', dto);

      expect(result.isDefault).toBe(true);
      expect(repository.update).toHaveBeenCalledWith('env-other', { isDefault: false });
      expect(repository.update).toHaveBeenCalledWith('env-456', dto);
    });

    it('should throw NotFoundException when environment not found', async () => {
      const dto = { name: 'Updated Name' };

      repository.findById.mockResolvedValue(null);

      await expect(service.update(mockFlagshipContext, 'invalid-id', dto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when environment belongs to different project', async () => {
      const dto = { name: 'Updated Name' };
      const otherProjectEnv = { ...mockEnvironment, projectId: 'other-proj' };

      repository.findById.mockResolvedValue(otherProjectEnv);

      await expect(service.update(mockFlagshipContext, 'env-456', dto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete environment', async () => {
      const otherEnv = { ...mockEnvironment, id: 'env-other', type: 'production' as const };

      repository.findById.mockResolvedValue(mockEnvironment);
      repository.findByProjectId.mockResolvedValue([mockEnvironment, otherEnv]);
      repository.update.mockResolvedValue({ ...mockEnvironment, updatedAt: new Date() });

      await service.delete(mockFlagshipContext, 'env-456');

      expect(repository.update).toHaveBeenCalledWith('env-456', expect.objectContaining({
        isDefault: false,
      }));
      expect(activitiesService.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'flagship.environment.deleted',
      }));
    });

    it('should throw BadRequestException when deleting last environment', async () => {
      repository.findById.mockResolvedValue(mockEnvironment);
      repository.findByProjectId.mockResolvedValue([mockEnvironment]);

      await expect(service.delete(mockFlagshipContext, 'env-456')).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting default environment without reassignment', async () => {
      const defaultEnv = { ...mockEnvironment, isDefault: true };
      const otherEnv = { ...mockEnvironment, id: 'env-other', isDefault: false };

      repository.findById.mockResolvedValue(defaultEnv);
      repository.findByProjectId.mockResolvedValue([defaultEnv, otherEnv]);

      await expect(service.delete(mockFlagshipContext, 'env-456')).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when environment not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete(mockFlagshipContext, 'invalid-id')).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when environment belongs to different project', async () => {
      const otherProjectEnv = { ...mockEnvironment, projectId: 'other-proj' };

      repository.findById.mockResolvedValue(otherProjectEnv);

      await expect(service.delete(mockFlagshipContext, 'env-456')).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});

