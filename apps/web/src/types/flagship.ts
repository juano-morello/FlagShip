/**
 * FlagShip Types
 *
 * Type definitions for FlagShip feature flag management system.
 */

// ============================================================================
// Feature Types
// ============================================================================

export type FeatureType = 'boolean' | 'percentage' | 'plan';

export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: FeatureType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureWithRules extends Feature {
  rules: FeatureRule[];
  planEntitlements: string[];
}

export interface FeatureRule {
  id: string;
  featureId: string;
  environmentId: string;
  environmentName: string;
  enabled: boolean;
  override: 'default' | 'force_on' | 'force_off';
  percentage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureDto {
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  enabled?: boolean;
}

export interface UpdateFeatureDto {
  name?: string;
  description?: string;
  type?: FeatureType;
  enabled?: boolean;
}

export interface FeatureQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: FeatureType;
  environmentId?: string;
  planId?: string;
}

// ============================================================================
// Environment Types
// ============================================================================

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  apiKeyPrefix: string;
  featuresEnabled: number;
  featuresTotal: number;
  limitsWarning: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnvironmentDto {
  name: string;
  type: EnvironmentType;
}

export interface UpdateEnvironmentDto {
  name?: string;
  type?: EnvironmentType;
}

// ============================================================================
// Plan Types
// ============================================================================

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  currency: string;
  features: string[];
  limits: Record<string, number>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanDto {
  name: string;
  displayName: string;
  description?: string;
  price: number;
  currency?: string;
  limits?: Record<string, number>;
  active?: boolean;
}

export interface UpdatePlanDto {
  displayName?: string;
  description?: string;
  price?: number;
  currency?: string;
  limits?: Record<string, number>;
  active?: boolean;
}

export interface PlanQueryParams {
  page?: number;
  limit?: number;
  active?: boolean;
}

// ============================================================================
// Usage Types
// ============================================================================

export interface UsageMetric {
  key: string;
  name: string;
  current: number;
  limit: number | null;
  percentage: number;
  status: 'ok' | 'warning' | 'critical';
}

export interface UsageSummary {
  environmentId: string;
  environmentName: string;
  metrics: UsageMetric[];
  updatedAt: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export type AuditAction =
  | 'feature.created'
  | 'feature.updated'
  | 'feature.deleted'
  | 'feature.toggled'
  | 'plan.created'
  | 'plan.updated'
  | 'plan.deleted'
  | 'environment.created'
  | 'environment.updated'
  | 'limit.enforced'
  | 'limit.exceeded';

export interface AuditEvent {
  id: string;
  action: AuditAction;
  actorId: string | null;
  actorEmail: string | null;
  actorType: 'user' | 'api_key' | 'system';
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditQueryParams {
  page?: number;
  limit?: number;
  action?: AuditAction;
  actorEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  resourceType?: string;
}

export interface AuditExportParams extends AuditQueryParams {
  format: 'csv' | 'json';
}

// ============================================================================
// Paginated Response
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

