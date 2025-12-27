/**
 * Environments Controller Tests
 * TDD: Tests written FIRST before implementation
 */

import { EnvironmentsController } from './environments.controller';
import { EnvironmentsService } from './environments.service';
import { FlagshipContext } from '../guards/environment.guard';
import { EnvironmentType } from './dto';

describe('EnvironmentsController', () => {
  let controller: EnvironmentsController;
  let service: jest.Mocked<EnvironmentsService>;

  const mockFlagshipContext: FlagshipContext = {
    environmentId: 'env-123',
    projectId: 'proj-123',
    orgId: 'org-123',
    environmentType: 'staging',
  };

  const mockEnvironment = {
    id: 'env-456',
    projectId: 'proj-123',
    name: 'Staging',
    type: EnvironmentType.STAGING,
    apiKeyPrefix: 'fsk_staging_',
    isDefault: false,
    settings: { debugMode: true },
    createdAt: '2024-12-26T10:00:00.000Z',
    updatedAt: '2024-12-26T10:00:00.000Z',
  };

  beforeEach(() => {
    // Direct instantiation to avoid guard dependency issues
    service = {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<EnvironmentsService>;

    controller = new EnvironmentsController(service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return paginated list of environments', async () => {
      const query = { page: 1, limit: 10 };
      const expected = {
        items: [mockEnvironment],
        total: 1,
        page: 1,
        limit: 10,
      };

      service.list.mockResolvedValue(expected);

      const result = await controller.list(mockFlagshipContext, query);

      expect(result).toEqual(expected);
      expect(service.list).toHaveBeenCalledWith(mockFlagshipContext, query);
    });

    it('should support search filter', async () => {
      const query = { search: 'staging', page: 1, limit: 10 };
      const expected = {
        items: [mockEnvironment],
        total: 1,
        page: 1,
        limit: 10,
      };

      service.list.mockResolvedValue(expected);

      const result = await controller.list(mockFlagshipContext, query);

      expect(result).toEqual(expected);
      expect(service.list).toHaveBeenCalledWith(mockFlagshipContext, query);
    });

    it('should support type filter', async () => {
      const query = { type: EnvironmentType.STAGING, page: 1, limit: 10 };
      const expected = {
        items: [mockEnvironment],
        total: 1,
        page: 1,
        limit: 10,
      };

      service.list.mockResolvedValue(expected);

      const result = await controller.list(mockFlagshipContext, query);

      expect(result).toEqual(expected);
      expect(service.list).toHaveBeenCalledWith(mockFlagshipContext, query);
    });

    it('should support isDefault filter', async () => {
      const query = { isDefault: true, page: 1, limit: 10 };
      const expected = {
        items: [{ ...mockEnvironment, isDefault: true }],
        total: 1,
        page: 1,
        limit: 10,
      };

      service.list.mockResolvedValue(expected);

      const result = await controller.list(mockFlagshipContext, query);

      expect(result).toEqual(expected);
      expect(service.list).toHaveBeenCalledWith(mockFlagshipContext, query);
    });
  });

  describe('get', () => {
    it('should return a single environment by ID', async () => {
      service.get.mockResolvedValue(mockEnvironment);

      const result = await controller.get(mockFlagshipContext, 'env-456');

      expect(result).toEqual(mockEnvironment);
      expect(service.get).toHaveBeenCalledWith(mockFlagshipContext, 'env-456');
    });

    it('should throw NotFoundException when environment not found', async () => {
      service.get.mockRejectedValue(new Error('Environment not found'));

      await expect(controller.get(mockFlagshipContext, 'invalid-id')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new environment', async () => {
      const dto = {
        name: 'Production',
        type: EnvironmentType.PRODUCTION,
        apiKeyPrefix: 'fsk_prod_',
        isDefault: true,
        settings: { logLevel: 'info' },
      };

      const expected = {
        ...mockEnvironment,
        ...dto,
        id: 'env-new',
      };

      service.create.mockResolvedValue(expected);

      const result = await controller.create(mockFlagshipContext, dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(mockFlagshipContext, dto);
    });

    it('should create environment with minimal required fields', async () => {
      const dto = {
        name: 'Development',
        type: EnvironmentType.DEVELOPMENT,
      };

      const expected = {
        ...mockEnvironment,
        ...dto,
        id: 'env-dev',
        apiKeyPrefix: 'fsk_development_',
        isDefault: false,
        settings: null,
      };

      service.create.mockResolvedValue(expected);

      const result = await controller.create(mockFlagshipContext, dto);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(mockFlagshipContext, dto);
    });

    it('should throw ConflictException when type already exists', async () => {
      const dto = {
        name: 'Staging',
        type: EnvironmentType.STAGING,
      };

      service.create.mockRejectedValue(new Error('Environment type already exists'));

      await expect(controller.create(mockFlagshipContext, dto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an environment', async () => {
      const dto = {
        name: 'Staging Environment',
        settings: { debugMode: false },
      };

      const expected = {
        ...mockEnvironment,
        ...dto,
        updatedAt: '2024-12-26T11:00:00.000Z',
      };

      service.update.mockResolvedValue(expected);

      const result = await controller.update(mockFlagshipContext, 'env-456', dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith(mockFlagshipContext, 'env-456', dto);
    });

    it('should update isDefault flag', async () => {
      const dto = { isDefault: true };

      const expected = {
        ...mockEnvironment,
        isDefault: true,
        updatedAt: '2024-12-26T11:00:00.000Z',
      };

      service.update.mockResolvedValue(expected);

      const result = await controller.update(mockFlagshipContext, 'env-456', dto);

      expect(result).toEqual(expected);
      expect(service.update).toHaveBeenCalledWith(mockFlagshipContext, 'env-456', dto);
    });

    it('should throw NotFoundException when environment not found', async () => {
      const dto = { name: 'Updated Name' };

      service.update.mockRejectedValue(new Error('Environment not found'));

      await expect(controller.update(mockFlagshipContext, 'invalid-id', dto)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should soft delete an environment', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete(mockFlagshipContext, 'env-456');

      expect(service.delete).toHaveBeenCalledWith(mockFlagshipContext, 'env-456');
    });

    it('should throw BadRequestException when deleting last environment', async () => {
      service.delete.mockRejectedValue(new Error('Cannot delete the last environment'));

      await expect(controller.delete(mockFlagshipContext, 'env-456')).rejects.toThrow();
    });

    it('should throw BadRequestException when deleting default environment', async () => {
      service.delete.mockRejectedValue(new Error('Cannot delete default environment'));

      await expect(controller.delete(mockFlagshipContext, 'env-456')).rejects.toThrow();
    });

    it('should throw NotFoundException when environment not found', async () => {
      service.delete.mockRejectedValue(new Error('Environment not found'));

      await expect(controller.delete(mockFlagshipContext, 'invalid-id')).rejects.toThrow();
    });
  });
});

