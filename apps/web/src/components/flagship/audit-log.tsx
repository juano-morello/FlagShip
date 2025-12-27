/**
 * AuditLog Component
 *
 * Displays FlagShip audit events in a table.
 */

'use client';

import type { AuditEvent } from '@/types/flagship';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLogProps {
  events: AuditEvent[];
  isLoading: boolean;
}

export function AuditLog({ events, isLoading }: AuditLogProps) {
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <p className="text-center text-muted-foreground">Loading audit events...</p>
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">No audit events found</p>
      </div>
    );
  }

  // Table view
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-mono text-sm">
                {event.action}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{event.resourceName}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.resourceType}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{event.actorEmail}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatTimestamp(event.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

