/**
 * FeaturesList Component
 *
 * Displays a table of FlagShip features with search and inline actions.
 * TDD: Implemented AFTER tests and stories were written.
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit, Trash2 } from 'lucide-react';
import type { Feature } from '@/types/flagship';

interface FeaturesListProps {
  features: Feature[];
  isLoading: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (feature: Feature) => void;
  onToggle: (feature: Feature, enabled: boolean) => Promise<Feature>;
}

const getFeatureTypeBadge = (type: Feature['type']) => {
  const variants = {
    boolean: 'default',
    percentage: 'secondary',
    plan: 'outline',
  } as const;

  const labels = {
    boolean: 'Boolean',
    percentage: 'Percentage',
    plan: 'Plan',
  };

  return (
    <Badge variant={variants[type]}>
      {labels[type]}
    </Badge>
  );
};

export function FeaturesList({
  features,
  isLoading,
  onEdit,
  onDelete,
  onToggle,
}: FeaturesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Filter features based on search query
  const filteredFeatures = features.filter(
    (feature) =>
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = async (feature: Feature, checked: boolean) => {
    setTogglingKey(feature.key);
    try {
      await onToggle(feature, checked);
    } finally {
      setTogglingKey(null);
    }
  };

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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search features..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Empty State */}
      {filteredFeatures.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'No features found matching your search'
              : 'No features yet'}
          </p>
        </div>
      )}

      {/* Features Table */}
      {filteredFeatures.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium">{feature.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {feature.key}
                    </code>
                  </TableCell>
                  <TableCell>{getFeatureTypeBadge(feature.type)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {feature.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(checked) => handleToggle(feature, checked)}
                      disabled={togglingKey === feature.key}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(feature)}
                        title="Edit feature"
                        aria-label="Edit feature"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(feature)}
                        title="Delete feature"
                        aria-label="Delete feature"
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

