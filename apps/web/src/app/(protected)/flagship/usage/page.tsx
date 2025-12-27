/**
 * Usage Dashboard Page
 *
 * Displays usage metrics and limits.
 */

'use client';

import { useFlagshipUsage } from '@/hooks/use-flagship-usage';
import { UsageDashboard } from '@/components/flagship/usage-dashboard';

export default function UsagePage() {
  const { usage, isLoading, error } = useFlagshipUsage({ autoFetch: true });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading usage data: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UsageDashboard usage={usage} isLoading={isLoading} />
    </div>
  );
}

