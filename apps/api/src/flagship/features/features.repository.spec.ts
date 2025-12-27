/**
 * Features Repository Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesRepository } from './features.repository';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  ilike: jest.fn(),
  desc: jest.fn(),
  count: jest.fn(),
  inArray: jest.fn(),
  withServiceContext: jest.fn(),
  flagshipFeatures: {},
  flagshipFeatureRules: {},
  flagshipPlanFeatures: {},
  environments: {},
  projects: {},
}));

import { withServiceContext } from '@forgestack/db';

describe('FeaturesRepository', () => {
  let repository: FeaturesRepository;
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
      returning: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    });

    mockDb = createMockChain();

    (withServiceContext as jest.Mock).mockImplementation((reason, fn) => fn(mockDb));

    const module: TestingModule = await Test.createTestingModule({
      providers: [FeaturesRepository],
    }).compile();

    repository = module.get<FeaturesRepository>(FeaturesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated features for a project', async () => {
      const mockFeatures = [
        { id: '1', key: 'feature1', name: 'Feature 1', projectId: 'proj-1' },
        { id: '2', key: 'feature2', name: 'Feature 2', projectId: 'proj-1' },
      ];

      // Mock count query
      mockDb.where.mockResolvedValueOnce([{ value: 2 }]);
      // Mock items query
      mockDb.offset.mockResolvedValueOnce(mockFeatures);

      const result = await repository.findAll('proj-1', { page: 1, limit: 10 });

      expect(result.items).toEqual(mockFeatures);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by search term', async () => {
      mockDb.where.mockResolvedValueOnce([{ value: 1 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      await repository.findAll('proj-1', { search: 'dark', page: 1, limit: 10 });

      expect(withServiceContext).toHaveBeenCalled();
    });

    it('should filter by type', async () => {
      mockDb.where.mockResolvedValueOnce([{ value: 0 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      await repository.findAll('proj-1', { type: 'boolean', page: 1, limit: 10 });

      expect(withServiceContext).toHaveBeenCalled();
    });

    it('should filter by enabled status', async () => {
      mockDb.where.mockResolvedValueOnce([{ value: 0 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      await repository.findAll('proj-1', { enabled: true, page: 1, limit: 10 });

      expect(withServiceContext).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return feature by ID', async () => {
      const mockFeature = { id: '1', key: 'feature1', name: 'Feature 1' };
      mockDb.limit.mockResolvedValue([mockFeature]);

      const result = await repository.findById('1', 'proj-1');

      expect(result).toEqual(mockFeature);
    });

    it('should return null if feature not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findById('999', 'proj-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new feature', async () => {
      const newFeature = {
        projectId: 'proj-1',
        key: 'new_feature',
        name: 'New Feature',
        type: 'boolean' as const,
        defaultValue: false,
        enabled: true,
      };
      const createdFeature = { id: '1', ...newFeature, createdAt: new Date(), updatedAt: new Date() };
      mockDb.returning.mockResolvedValue([createdFeature]);

      const result = await repository.create(newFeature);

      expect(result).toEqual(createdFeature);
    });
  });

  describe('update', () => {
    it('should update an existing feature', async () => {
      const updates = { name: 'Updated Name', enabled: false };
      const updatedFeature = { id: '1', ...updates };
      mockDb.returning.mockResolvedValue([updatedFeature]);

      const result = await repository.update('1', 'proj-1', updates);

      expect(result).toEqual(updatedFeature);
    });

    it('should return null if feature not found', async () => {
      mockDb.returning.mockResolvedValue([]);

      const result = await repository.update('999', 'proj-1', { name: 'Test' });

      expect(result).toBeNull();
    });
  });
});

