/**
 * Feature Detail Page
 *
 * Displays detailed information about a specific feature flag.
 * TDD: Implemented AFTER tests and stories were written.
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeatureDetail } from '@/components/flagship/feature-detail';
import { useFlagshipFeatures } from '@/hooks/use-flagship-features';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { FeatureWithRules, UpdateFeatureDto } from '@/types/flagship';

interface FeatureDetailPageProps {
  params: Promise<{ key: string }>;
}

export default function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const { key } = use(params);
  const router = useRouter();
  const { getFeature, updateFeature } = useFlagshipFeatures({ autoFetch: false });
  
  const [feature, setFeature] = useState<FeatureWithRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeature = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getFeature(key);
        setFeature(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeature();
  }, [key, getFeature]);

  const handleUpdate = async (data: UpdateFeatureDto) => {
    if (!feature) return;
    
    try {
      await updateFeature(feature.key, data);
      // Refresh feature data
      const updated = await getFeature(key);
      setFeature(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature');
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || 'Feature not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return <FeatureDetail feature={feature} onUpdate={handleUpdate} />;
}

