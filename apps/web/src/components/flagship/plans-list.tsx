/**
 * PlansList Component
 *
 * Displays a table of FlagShip plans with pricing and feature information.
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
import { Edit, Trash2 } from 'lucide-react';
import type { Plan } from '@/types/flagship';

interface PlansListProps {
  plans: Plan[];
  isLoading: boolean;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

export function PlansList({
  plans,
  isLoading,
  onEdit,
  onDelete,
}: PlansListProps) {
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
      {plans.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No plans yet
          </p>
        </div>
      )}

      {/* Plans Table */}
      {plans.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.displayName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {plan.description || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      ${plan.price}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{plan.currency}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {plan.features.length} features
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {Object.keys(plan.limits).length} limits
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.active ? 'default' : 'secondary'}>
                      {plan.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(plan)}
                        title="Edit plan"
                        aria-label="Edit plan"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(plan)}
                        title="Delete plan"
                        aria-label="Delete plan"
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

