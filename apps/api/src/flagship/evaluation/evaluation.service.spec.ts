/**
 * Evaluation Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { FeatureEvaluator } from './feature-evaluator';
import { LimitEvaluator } from './limit-evaluator';

describe('EvaluationService', () => {
  let service: EvaluationService;
  let featureEvaluator: jest.Mocked<FeatureEvaluator>;
  let limitEvaluator: jest.Mocked<LimitEvaluator>;

  const mockContext = {
    projectId: 'project-123',
    environmentId: 'env-123',
    orgId: 'org-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        {
          provide: FeatureEvaluator,
          useValue: {
            evaluateFeatures: jest.fn(),
          },
        },
        {
          provide: LimitEvaluator,
          useValue: {
            evaluateLimits: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
    featureEvaluator = module.get(FeatureEvaluator);
    limitEvaluator = module.get(LimitEvaluator);
  });

  describe('evaluate', () => {
    it('should return evaluation results with requestId and timestamp', async () => {
      featureEvaluator.evaluateFeatures.mockResolvedValue({});
      limitEvaluator.evaluateLimits.mockResolvedValue({});

      const result = await service.evaluate({}, mockContext);

      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('evaluatedAt');
      expect(result.features).toEqual({});
      expect(result.limits).toEqual({});
    });

    it('should evaluate features when provided', async () => {
      featureEvaluator.evaluateFeatures.mockResolvedValue({
        feature1: { value: true },
        feature2: { value: false },
      });
      limitEvaluator.evaluateLimits.mockResolvedValue({});

      const result = await service.evaluate(
        { features: ['feature1', 'feature2'] },
        mockContext,
      );

      expect(featureEvaluator.evaluateFeatures).toHaveBeenCalledWith(
        ['feature1', 'feature2'],
        expect.objectContaining({
          projectId: 'project-123',
          environmentId: 'env-123',
          orgId: 'org-123',
        }),
      );
      expect(result.features).toEqual({
        feature1: { value: true },
        feature2: { value: false },
      });
    });

    it('should evaluate limits when provided', async () => {
      featureEvaluator.evaluateFeatures.mockResolvedValue({});
      limitEvaluator.evaluateLimits.mockResolvedValue({
        api_calls: { allowed: true, current: 100, limit: 1000, remaining: 900 },
      });

      const result = await service.evaluate(
        { limits: ['api_calls'] },
        mockContext,
      );

      expect(limitEvaluator.evaluateLimits).toHaveBeenCalledWith(
        ['api_calls'],
        expect.objectContaining({
          environmentId: 'env-123',
          orgId: 'org-123',
        }),
      );
      expect(result.limits).toEqual({
        api_calls: { allowed: true, current: 100, limit: 1000, remaining: 900 },
      });
    });

    it('should evaluate both features and limits in parallel', async () => {
      featureEvaluator.evaluateFeatures.mockResolvedValue({
        my_feature: { value: true },
      });
      limitEvaluator.evaluateLimits.mockResolvedValue({
        api_calls: { allowed: true, current: 50, limit: 100, remaining: 50 },
      });

      const result = await service.evaluate(
        {
          features: ['my_feature'],
          limits: ['api_calls'],
        },
        mockContext,
      );

      expect(result.features).toEqual({ my_feature: { value: true } });
      expect(result.limits).toEqual({
        api_calls: { allowed: true, current: 50, limit: 100, remaining: 50 },
      });
    });

    it('should pass debug flag to evaluators', async () => {
      featureEvaluator.evaluateFeatures.mockResolvedValue({});
      limitEvaluator.evaluateLimits.mockResolvedValue({});

      await service.evaluate(
        { features: ['f'], limits: ['l'], debug: true },
        mockContext,
      );

      expect(featureEvaluator.evaluateFeatures).toHaveBeenCalledWith(
        ['f'],
        expect.objectContaining({ debug: true }),
      );
      expect(limitEvaluator.evaluateLimits).toHaveBeenCalledWith(
        ['l'],
        expect.objectContaining({ debug: true }),
      );
    });
  });
});

