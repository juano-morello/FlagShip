/**
 * UsageDashboard Component
 *
 * Displays FlagShip usage metrics with progress bars and status indicators.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { UsageSummary, UsageMetric } from '@/types/flagship';
import { cn } from '@/lib/utils';

interface UsageDashboardProps {
  usage: UsageSummary | null;
  isLoading: boolean;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function getStatusColor(status: UsageMetric['status']): string {
  switch (status) {
    case 'ok':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusBadgeVariant(status: UsageMetric['status']): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'critical':
      return 'destructive';
    case 'warning':
      return 'secondary';
    default:
      return 'default';
  }
}

export function UsageDashboard({ usage, isLoading }: UsageDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No usage data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Environment: {usage.environmentName} • Updated{' '}
            {new Date(usage.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usage.metrics.map((metric) => (
          <Card key={metric.key} className={cn(metric.status === 'critical' && 'border-red-500')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{metric.name}</CardTitle>
                <Badge variant={getStatusBadgeVariant(metric.status)} className={cn(metric.status === 'warning' && 'bg-yellow-500 hover:bg-yellow-600 text-white', metric.status === 'critical' && 'bg-red-500 hover:bg-red-600')}>
                  {metric.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{formatNumber(metric.current)}</span>
                <span className="text-sm text-muted-foreground">
                  / {metric.limit !== null ? formatNumber(metric.limit) : 'Unlimited'}
                </span>
              </div>

              {metric.limit !== null && (
                <>
                  <Progress
                    value={metric.percentage}
                    className={cn('h-2')}
                    aria-label={`${metric.name} usage progress`}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatNumber(metric.limit - metric.current)} remaining
                    </span>
                    <span className="font-medium">{metric.percentage}%</span>
                  </div>
                </>
              )}

              {metric.limit === null && (
                <p className="text-sm text-muted-foreground">Unlimited usage available</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

