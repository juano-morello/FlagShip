/**
 * Feature Evaluator Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FeatureEvaluator } from './feature-evaluator';
import { FeaturesRepository, FeatureWithRules } from '../features/features.repository';

describe('FeatureEvaluator', () => {
  let evaluator: FeatureEvaluator;
  let featuresRepository: jest.Mocked<FeaturesRepository>;

  const mockContext = {
    projectId: 'project-123',
    environmentId: 'env-123',
    orgId: 'org-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureEvaluator,
        {
          provide: FeaturesRepository,
          useValue: {
            findFeaturesWithRules: jest.fn(),
            isFeatureInPlan: jest.fn(),
          },
        },
      ],
    }).compile();

    evaluator = module.get<FeatureEvaluator>(FeatureEvaluator);
    featuresRepository = module.get(FeaturesRepository);
  });

  describe('evaluateFeatures', () => {
    it('should return empty object for empty keys array', async () => {
      const result = await evaluator.evaluateFeatures([], mockContext);
      expect(result).toEqual({});
    });

    it('should return feature_not_found for unknown features', async () => {
      featuresRepository.findFeaturesWithRules.mockResolvedValue(new Map());

      const result = await evaluator.evaluateFeatures(
        ['unknown_feature'],
        { ...mockContext, debug: true },
      );

      expect(result).toEqual({
        unknown_feature: { value: false, reason: 'feature_not_found' },
      });
    });

    it('should return false for disabled features', async () => {
      const featureMap = new Map<string, FeatureWithRules>();
      featureMap.set('my_feature', {
        id: 'feat-1',
        projectId: 'project-123',
        key: 'my_feature',
        name: 'My Feature',
        description: null,
        type: 'boolean',
        defaultValue: true,
        enabled: false,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [],
      });
      featuresRepository.findFeaturesWithRules.mockResolvedValue(featureMap);

      const result = await evaluator.evaluateFeatures(
        ['my_feature'],
        { ...mockContext, debug: true },
      );

      expect(result).toEqual({
        my_feature: { value: false, reason: 'feature_disabled' },
      });
    });

    it('should return default value when no rules match', async () => {
      const featureMap = new Map<string, FeatureWithRules>();
      featureMap.set('my_feature', {
        id: 'feat-1',
        projectId: 'project-123',
        key: 'my_feature',
        name: 'My Feature',
        description: null,
        type: 'boolean',
        defaultValue: true,
        enabled: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [],
      });
      featuresRepository.findFeaturesWithRules.mockResolvedValue(featureMap);

      const result = await evaluator.evaluateFeatures(
        ['my_feature'],
        { ...mockContext, debug: true },
      );

      expect(result).toEqual({
        my_feature: { value: true, reason: 'default_value' },
      });
    });

    it('should apply override rules with conditions', async () => {
      const featureMap = new Map<string, FeatureWithRules>();
      featureMap.set('my_feature', {
        id: 'feat-1',
        projectId: 'project-123',
        key: 'my_feature',
        name: 'My Feature',
        description: null,
        type: 'boolean',
        defaultValue: false,
        enabled: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            featureId: 'feat-1',
            environmentId: 'env-123',
            ruleType: 'override',
            value: { enabled: true, conditions: { userId: 'special-user' } },
            priority: 1,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });
      featuresRepository.findFeaturesWithRules.mockResolvedValue(featureMap);

      // Without matching context
      const result1 = await evaluator.evaluateFeatures(
        ['my_feature'],
        { ...mockContext, debug: true },
      );
      expect(result1.my_feature.value).toBe(false);

      // With matching context
      const result2 = await evaluator.evaluateFeatures(
        ['my_feature'],
        { ...mockContext, context: { userId: 'special-user' }, debug: true },
      );
      expect(result2.my_feature.value).toBe(true);
      expect(result2.my_feature.reason).toBe('override_rule');
    });
  });
});

