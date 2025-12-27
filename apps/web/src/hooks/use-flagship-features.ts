/**
 * useFlagshipFeatures Hook
 *
 * Hook for managing FlagShip features with CRUD operations.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { flagshipFeaturesApi } from '@/lib/api/flagship';
import type {
  Feature,
  FeatureWithRules,
  CreateFeatureDto,
  UpdateFeatureDto,
  FeatureQueryParams,
} from '@/types/flagship';

interface UseFlagshipFeaturesOptions {
  autoFetch?: boolean;
  params?: FeatureQueryParams;
}

export function useFlagshipFeatures(options: UseFlagshipFeaturesOptions = {}) {
  const { autoFetch = false, params } = options;

  const [features, setFeatures] = useState<Feature[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch features
  const fetchFeatures = useCallback(
    async (queryParams?: FeatureQueryParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await flagshipFeaturesApi.list(queryParams || params);
        setFeatures(response.items);
        setTotal(response.total);
        setPage(response.page);
        setLimit(response.limit);
        setTotalPages(response.totalPages);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to fetch features';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  // Create feature
  const createFeature = useCallback(
    async (data: CreateFeatureDto): Promise<Feature> => {
      setError(null);

      try {
        const feature = await flagshipFeaturesApi.create(data);
        // Refresh the list after creation
        await fetchFeatures();
        return feature;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to create feature';
        setError(message);
        throw err;
      }
    },
    [fetchFeatures]
  );

  // Update feature
  const updateFeature = useCallback(
    async (key: string, data: UpdateFeatureDto): Promise<Feature> => {
      setError(null);

      try {
        const feature = await flagshipFeaturesApi.update(key, data);
        // Update the feature in the list
        setFeatures((prev) =>
          prev.map((f) => (f.key === key ? feature : f))
        );
        return feature;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to update feature';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete feature
  const deleteFeature = useCallback(
    async (key: string): Promise<void> => {
      setError(null);

      try {
        await flagshipFeaturesApi.delete(key);
        // Remove from the list
        setFeatures((prev) => prev.filter((f) => f.key !== key));
        setTotal((prev) => prev - 1);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to delete feature';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Toggle feature
  const toggleFeature = useCallback(
    async (key: string, enabled: boolean): Promise<Feature> => {
      setError(null);

      try {
        const feature = await flagshipFeaturesApi.toggle(key, enabled);
        // Update the feature in the list
        setFeatures((prev) =>
          prev.map((f) => (f.key === key ? feature : f))
        );
        return feature;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to toggle feature';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Get single feature with rules
  const getFeature = useCallback(
    async (key: string) => {
      setError(null);

      try {
        const feature = await flagshipFeaturesApi.get(key);
        return feature;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to fetch feature';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchFeatures();
    }
  }, [autoFetch, fetchFeatures]);

  return {
    features,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    error,
    fetchFeatures,
    createFeature,
    updateFeature,
    deleteFeature,
    toggleFeature,
    getFeature,
    refresh: fetchFeatures,
  };
}

