/**
 * Features Controller Unit Tests
 */

import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { CreateFeatureDto, UpdateFeatureDto, FeatureType } from './dto';

describe('FeaturesController', () => {
  let controller: FeaturesController;
  let service: jest.Mocked<FeaturesService>;

  const mockContext = {
    environmentId: 'env-1',
    projectId: 'proj-1',
    orgId: 'org-1',
    environmentType: 'development' as const,
  };

  const mockFeature = {
    id: '1',
    projectId: 'proj-1',
    key: 'test_feature',
    name: 'Test Feature',
    description: null,
    type: FeatureType.BOOLEAN,
    defaultValue: false,
    enabled: true,
    metadata: null,
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
    } as unknown as jest.Mocked<FeaturesService>;

    controller = new FeaturesController(service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated features', async () => {
      const mockResult = {
        items: [mockFeature],
        total: 1,
        page: 1,
        limit: 10,
      };
      service.list.mockResolvedValue(mockResult);

      const result = await controller.list(mockContext, { page: 1, limit: 10 });

      expect(result).toEqual(mockResult);
      expect(service.list).toHaveBeenCalledWith(mockContext, { page: 1, limit: 10 });
    });
  });

  describe('get', () => {
    it('should return a single feature', async () => {
      service.get.mockResolvedValue(mockFeature);

      const result = await controller.get(mockContext, '1');

      expect(result).toEqual(mockFeature);
      expect(service.get).toHaveBeenCalledWith(mockContext, '1');
    });
  });

  describe('create', () => {
    it('should create a new feature', async () => {
      const createDto: CreateFeatureDto = {
        key: 'new_feature',
        name: 'New Feature',
        type: FeatureType.BOOLEAN,
        defaultValue: false,
      };
      service.create.mockResolvedValue(mockFeature);

      const result = await controller.create(mockContext, createDto);

      expect(result).toEqual(mockFeature);
      expect(service.create).toHaveBeenCalledWith(mockContext, createDto);
    });
  });

  describe('update', () => {
    it('should update an existing feature', async () => {
      const updateDto: UpdateFeatureDto = {
        name: 'Updated Name',
        enabled: false,
      };
      const updatedFeature = { ...mockFeature, ...updateDto };
      service.update.mockResolvedValue(updatedFeature);

      const result = await controller.update(mockContext, '1', updateDto);

      expect(result).toEqual(updatedFeature);
      expect(service.update).toHaveBeenCalledWith(mockContext, '1', updateDto);
    });
  });

  describe('delete', () => {
    it('should soft delete a feature', async () => {
      const deletedFeature = { ...mockFeature, enabled: false };
      service.update.mockResolvedValue(deletedFeature);

      const result = await controller.delete(mockContext, '1');

      expect(result).toEqual(deletedFeature);
      expect(service.update).toHaveBeenCalledWith(mockContext, '1', { enabled: false });
    });
  });
});

