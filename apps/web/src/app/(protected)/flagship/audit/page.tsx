/**
 * Audit Log Page
 *
 * Displays audit events with filters.
 */

'use client';

import { useFlagshipAudit } from '@/hooks/use-flagship-audit';
import { AuditLog } from '@/components/flagship/audit-log';

export default function AuditPage() {
  const { events, isLoading, error } = useFlagshipAudit({ autoFetch: true });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading audit events: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          View all FlagShip configuration changes and events
        </p>
      </div>
      <AuditLog events={events} isLoading={isLoading} />
    </div>
  );
}

