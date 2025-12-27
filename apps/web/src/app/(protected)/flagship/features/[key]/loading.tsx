/**
 * Feature Detail Loading State
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function FeatureDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

