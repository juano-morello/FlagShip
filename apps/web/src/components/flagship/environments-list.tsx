/**
 * EnvironmentsList Component
 *
 * Displays a table of FlagShip environments with type badges and actions.
 * TDD: Implemented AFTER tests and stories were written.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { Environment } from '@/types/flagship';

interface EnvironmentsListProps {
  environments: Environment[];
  isLoading: boolean;
  onEdit: (environment: Environment) => void;
  onDelete: (environment: Environment) => void;
}

const getEnvironmentTypeBadge = (type: Environment['type']) => {
  const variants = {
    development: 'default',
    staging: 'secondary',
    production: 'destructive',
  } as const;

  const labels = {
    development: 'Development',
    staging: 'Staging',
    production: 'Production',
  };

  return (
    <Badge variant={variants[type]}>
      {labels[type]}
    </Badge>
  );
};

export function EnvironmentsList({
  environments,
  isLoading,
  onEdit,
  onDelete,
}: EnvironmentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Empty State */}
      {environments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No environments yet
          </p>
        </div>
      )}

      {/* Environments Table */}
      {environments.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>API Key Prefix</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {environments.map((environment) => (
                <TableRow key={environment.id}>
                  <TableCell className="font-medium">{environment.name}</TableCell>
                  <TableCell>{getEnvironmentTypeBadge(environment.type)}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {environment.apiKeyPrefix}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {environment.featuresEnabled} / {environment.featuresTotal}
                    </span>
                  </TableCell>
                  <TableCell>
                    {environment.limitsWarning > 0 ? (
                      <Badge variant="outline" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {environment.limitsWarning} warnings
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(environment)}
                        title="Edit environment"
                        aria-label="Edit environment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(environment)}
                        title="Delete environment"
                        aria-label="Delete environment"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

