/**
 * FlagShip schema barrel export
 * All FlagShip-specific Drizzle ORM table definitions and relations
 */

// Environments
export { environments, environmentsRelations, environmentTypeEnum } from './environments';

// Features
export {
  flagshipFeatures,
  flagshipFeaturesRelations,
  flagshipFeatureRules,
  flagshipFeatureRulesRelations,
  featureTypeEnum,
} from './features';

// Plan Features
export { flagshipPlanFeatures, flagshipPlanFeaturesRelations } from './plan-features';

// Usage Metrics
export {
  flagshipUsageMetrics,
  flagshipUsageMetricsRelations,
  flagshipUsageLimits,
  flagshipUsageLimitsRelations,
  limitTypeEnum,
  periodTypeEnum,
  limitEnforcementEnum,
} from './usage-metrics';

// Evaluation Logs
export { flagshipEvaluationLogs, flagshipEvaluationLogsRelations } from './evaluation-logs';

// Audit Events
export { flagshipAuditEvents, flagshipAuditEventsRelations, actorTypeEnum } from './audit-events';

// Type exports
export type { Environment, NewEnvironment } from './environments';
export type { FlagshipFeature, NewFlagshipFeature, FlagshipFeatureRule, NewFlagshipFeatureRule } from './features';
export type { FlagshipPlanFeature, NewFlagshipPlanFeature } from './plan-features';
export type {
  FlagshipUsageMetric,
  NewFlagshipUsageMetric,
  FlagshipUsageLimit,
  NewFlagshipUsageLimit,
  LimitType,
  PeriodType,
  LimitEnforcement,
} from './usage-metrics';
export type { FlagshipEvaluationLog, NewFlagshipEvaluationLog } from './evaluation-logs';
export type { FlagshipAuditEvent, NewFlagshipAuditEvent } from './audit-events';

