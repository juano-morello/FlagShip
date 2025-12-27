/**
 * FlagShip API Client
 *
 * API methods for FlagShip feature flag management.
 */

import { api } from '@/lib/api';
import type {
  Feature,
  FeatureWithRules,
  CreateFeatureDto,
  UpdateFeatureDto,
  FeatureQueryParams,
  FeatureRule,
  Environment,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
  Plan,
  CreatePlanDto,
  UpdatePlanDto,
  PlanQueryParams,
  UsageSummary,
  AuditEvent,
  AuditQueryParams,
  AuditExportParams,
  PaginatedResponse,
} from '@/types/flagship';

const FLAGSHIP_API_BASE = '/flagship';

// ============================================================================
// Features API
// ============================================================================

export const flagshipFeaturesApi = {
  list: (params?: FeatureQueryParams) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.type) queryParams.set('type', params.type);
    if (params?.environmentId) queryParams.set('environmentId', params.environmentId);
    if (params?.planId) queryParams.set('planId', params.planId);

    const queryString = queryParams.toString();
    const endpoint = `${FLAGSHIP_API_BASE}/features${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<Feature>>(endpoint);
  },

  get: (key: string) =>
    api.get<FeatureWithRules>(`${FLAGSHIP_API_BASE}/features/${key}`),

  create: (data: CreateFeatureDto) =>
    api.post<Feature>(`${FLAGSHIP_API_BASE}/features`, data),

  update: (key: string, data: UpdateFeatureDto) =>
    api.patch<Feature>(`${FLAGSHIP_API_BASE}/features/${key}`, data),

  delete: (key: string) =>
    api.delete<void>(`${FLAGSHIP_API_BASE}/features/${key}`),

  toggle: (key: string, enabled: boolean) =>
    api.patch<Feature>(`${FLAGSHIP_API_BASE}/features/${key}/toggle`, { enabled }),

  // Feature Rules
  getRules: (featureKey: string) =>
    api.get<FeatureRule[]>(`${FLAGSHIP_API_BASE}/features/${featureKey}/rules`),

  createRule: (featureKey: string, data: Partial<FeatureRule>) =>
    api.post<FeatureRule>(`${FLAGSHIP_API_BASE}/features/${featureKey}/rules`, data),

  updateRule: (featureKey: string, ruleId: string, data: Partial<FeatureRule>) =>
    api.patch<FeatureRule>(`${FLAGSHIP_API_BASE}/features/${featureKey}/rules/${ruleId}`, data),

  deleteRule: (featureKey: string, ruleId: string) =>
    api.delete<void>(`${FLAGSHIP_API_BASE}/features/${featureKey}/rules/${ruleId}`),
};

// ============================================================================
// Environments API
// ============================================================================

export const flagshipEnvironmentsApi = {
  list: () =>
    api.get<Environment[]>(`${FLAGSHIP_API_BASE}/environments`),

  get: (id: string) =>
    api.get<Environment>(`${FLAGSHIP_API_BASE}/environments/${id}`),

  create: (data: CreateEnvironmentDto) =>
    api.post<Environment>(`${FLAGSHIP_API_BASE}/environments`, data),

  update: (id: string, data: UpdateEnvironmentDto) =>
    api.patch<Environment>(`${FLAGSHIP_API_BASE}/environments/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`${FLAGSHIP_API_BASE}/environments/${id}`),
};

// ============================================================================
// Plans API
// ============================================================================

export const flagshipPlansApi = {
  list: (params?: PlanQueryParams) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.active !== undefined) queryParams.set('active', String(params.active));

    const queryString = queryParams.toString();
    const endpoint = `${FLAGSHIP_API_BASE}/plans${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<Plan>>(endpoint);
  },

  get: (id: string) =>
    api.get<Plan>(`${FLAGSHIP_API_BASE}/plans/${id}`),

  create: (data: CreatePlanDto) =>
    api.post<Plan>(`${FLAGSHIP_API_BASE}/plans`, data),

  update: (id: string, data: UpdatePlanDto) =>
    api.patch<Plan>(`${FLAGSHIP_API_BASE}/plans/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`${FLAGSHIP_API_BASE}/plans/${id}`),

  // Plan Features
  addFeature: (planId: string, featureKey: string) =>
    api.post<void>(`${FLAGSHIP_API_BASE}/plans/${planId}/features`, { featureKey }),

  removeFeature: (planId: string, featureKey: string) =>
    api.delete<void>(`${FLAGSHIP_API_BASE}/plans/${planId}/features/${featureKey}`),
};

// ============================================================================
// Usage API
// ============================================================================

export const flagshipUsageApi = {
  getCurrent: (environmentId?: string) => {
    const queryParams = new URLSearchParams();
    if (environmentId) queryParams.set('environmentId', environmentId);

    const queryString = queryParams.toString();
    const endpoint = `${FLAGSHIP_API_BASE}/usage/current${queryString ? `?${queryString}` : ''}`;
    return api.get<UsageSummary>(endpoint);
  },
};


// ============================================================================
// Audit API
// ============================================================================

export const flagshipAuditApi = {
  list: (params?: AuditQueryParams) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.action) queryParams.set('action', params.action);
    if (params?.actorEmail) queryParams.set('actorEmail', params.actorEmail);
    if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.set('dateTo', params.dateTo);
    if (params?.resourceType) queryParams.set('resourceType', params.resourceType);

    const queryString = queryParams.toString();
    const endpoint = `${FLAGSHIP_API_BASE}/audit${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<AuditEvent>>(endpoint);
  },

  export: (params: AuditExportParams) => {
    const queryParams = new URLSearchParams();
    queryParams.set('format', params.format);
    if (params.action) queryParams.set('action', params.action);
    if (params.actorEmail) queryParams.set('actorEmail', params.actorEmail);
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);
    if (params.resourceType) queryParams.set('resourceType', params.resourceType);

    const queryString = queryParams.toString();
    const endpoint = `${FLAGSHIP_API_BASE}/audit/export${queryString ? `?${queryString}` : ''}`;

    // Return a promise that resolves to a blob
    return fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
    }).then(res => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    });
  },
};

