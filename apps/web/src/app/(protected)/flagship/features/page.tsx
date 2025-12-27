/**
 * Features List Page
 *
 * Displays all feature flags with search and filter capabilities.
 */

'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FeaturesList } from '@/components/flagship/features-list';
import { useFlagshipFeatures } from '@/hooks/use-flagship-features';
import type { Feature } from '@/types/flagship';

export default function FeaturesPage() {
  const {
    features,
    isLoading,
    createFeature,
    updateFeature,
    deleteFeature,
    toggleFeature,
  } = useFlagshipFeatures({ autoFetch: true });

  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    // TODO: Open edit dialog
    console.log('Edit feature:', feature);
  };

  const handleDelete = async (feature: Feature) => {
    if (confirm(`Are you sure you want to delete "${feature.name}"?`)) {
      try {
        await deleteFeature(feature.key);
      } catch (error) {
        console.error('Failed to delete feature:', error);
      }
    }
  };

  const handleToggle = async (feature: Feature, enabled: boolean) => {
    try {
      return await toggleFeature(feature.key, enabled);
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      throw error;
    }
  };

  return (
    <>
      <PageHeader
        title="Features"
        description="Manage feature flags for your organization"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Feature
          </Button>
        }
      />

      <FeaturesList
        features={features}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    </>
  );
}

