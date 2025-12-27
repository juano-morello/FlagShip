/**
 * Limit Evaluator Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LimitEvaluator } from './limit-evaluator';
import { UsageRepository } from '../usage/usage.repository';
import type { FlagshipUsageMetric, FlagshipUsageLimit } from '@forgestack/db';

describe('LimitEvaluator', () => {
  let evaluator: LimitEvaluator;
  let usageRepository: jest.Mocked<UsageRepository>;

  const mockContext = {
    environmentId: 'env-123',
    orgId: 'org-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LimitEvaluator,
        {
          provide: UsageRepository,
          useValue: {
            getCurrentUsageMultiple: jest.fn(),
            getLimitsMultiple: jest.fn(),
          },
        },
      ],
    }).compile();

    evaluator = module.get<LimitEvaluator>(LimitEvaluator);
    usageRepository = module.get(UsageRepository);
  });

  describe('evaluateLimits', () => {
    it('should return empty object for empty keys array', async () => {
      const result = await evaluator.evaluateLimits([], mockContext);
      expect(result).toEqual({});
    });

    it('should allow unlimited when no limit is defined', async () => {
      usageRepository.getCurrentUsageMultiple.mockResolvedValue(new Map());
      usageRepository.getLimitsMultiple.mockResolvedValue(new Map());

      const result = await evaluator.evaluateLimits(
        ['api_calls'],
        { ...mockContext, debug: true },
      );

      expect(result).toEqual({
        api_calls: {
          allowed: true,
          current: 0,
          limit: -1,
          remaining: -1,
          reason: 'no_limit_defined',
        },
      });
    });

    it('should allow within hard limit', async () => {
      const usageMap = new Map<string, FlagshipUsageMetric>();
      usageMap.set('api_calls', {
        id: 'usage-1',
        environmentId: 'env-123',
        orgId: 'org-123',
        metricKey: 'api_calls',
        currentValue: 500,
        periodStart: new Date(),
        periodEnd: new Date(),
        lastUpdatedAt: new Date(),
        createdAt: new Date(),
      });

      const limitMap = new Map<string, FlagshipUsageLimit>();
      limitMap.set('api_calls', {
        id: 'limit-1',
        environmentId: 'env-123',
        planId: null,
        metricKey: 'api_calls',
        limitType: 'count',
        limitValue: 1000,
        periodType: 'month',
        enforcement: 'hard',
        warningThreshold: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      usageRepository.getCurrentUsageMultiple.mockResolvedValue(usageMap);
      usageRepository.getLimitsMultiple.mockResolvedValue(limitMap);

      const result = await evaluator.evaluateLimits(
        ['api_calls'],
        { ...mockContext, debug: true },
      );

      expect(result).toEqual({
        api_calls: {
          allowed: true,
          current: 500,
          limit: 1000,
          remaining: 500,
          reason: 'within_hard_limit',
        },
      });
    });

    it('should block when hard limit exceeded', async () => {
      const usageMap = new Map<string, FlagshipUsageMetric>();
      usageMap.set('api_calls', {
        id: 'usage-1',
        environmentId: 'env-123',
        orgId: 'org-123',
        metricKey: 'api_calls',
        currentValue: 1500,
        periodStart: new Date(),
        periodEnd: new Date(),
        lastUpdatedAt: new Date(),
        createdAt: new Date(),
      });

      const limitMap = new Map<string, FlagshipUsageLimit>();
      limitMap.set('api_calls', {
        id: 'limit-1',
        environmentId: 'env-123',
        planId: null,
        metricKey: 'api_calls',
        limitType: 'count',
        limitValue: 1000,
        periodType: 'month',
        enforcement: 'hard',
        warningThreshold: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      usageRepository.getCurrentUsageMultiple.mockResolvedValue(usageMap);
      usageRepository.getLimitsMultiple.mockResolvedValue(limitMap);

      const result = await evaluator.evaluateLimits(
        ['api_calls'],
        { ...mockContext, debug: true },
      );

      expect(result.api_calls.allowed).toBe(false);
      expect(result.api_calls.reason).toBe('hard_limit_exceeded');
    });

    it('should allow when soft limit exceeded', async () => {
      const usageMap = new Map<string, FlagshipUsageMetric>();
      usageMap.set('api_calls', {
        id: 'usage-1',
        environmentId: 'env-123',
        orgId: 'org-123',
        metricKey: 'api_calls',
        currentValue: 1500,
        periodStart: new Date(),
        periodEnd: new Date(),
        lastUpdatedAt: new Date(),
        createdAt: new Date(),
      });

      const limitMap = new Map<string, FlagshipUsageLimit>();
      limitMap.set('api_calls', {
        id: 'limit-1',
        environmentId: 'env-123',
        planId: null,
        metricKey: 'api_calls',
        limitType: 'count',
        limitValue: 1000,
        periodType: 'month',
        enforcement: 'soft',
        warningThreshold: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      usageRepository.getCurrentUsageMultiple.mockResolvedValue(usageMap);
      usageRepository.getLimitsMultiple.mockResolvedValue(limitMap);

      const result = await evaluator.evaluateLimits(
        ['api_calls'],
        { ...mockContext, debug: true },
      );

      expect(result.api_calls.allowed).toBe(true);
      expect(result.api_calls.reason).toBe('soft_limit_exceeded');
    });
  });
});

