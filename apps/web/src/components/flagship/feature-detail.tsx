/**
 * FeatureDetail Component
 *
 * Displays detailed information about a feature flag.
 * TDD: Implemented AFTER tests and stories were written.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit } from 'lucide-react';
import { FeatureForm } from './feature-form';
import type { FeatureWithRules, UpdateFeatureDto } from '@/types/flagship';

interface FeatureDetailProps {
  feature: FeatureWithRules;
  onUpdate: (data: UpdateFeatureDto) => Promise<void>;
  isEditing?: boolean;
}

const getFeatureTypeBadge = (type: FeatureWithRules['type']) => {
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

export function FeatureDetail({ feature, onUpdate, isEditing = false }: FeatureDetailProps) {
  const [editing, setEditing] = useState(isEditing);
  const [enabled, setEnabled] = useState(feature.enabled);

  const handleUpdate = async (data: UpdateFeatureDto) => {
    await onUpdate(data);
    setEditing(false);
  };

  const handleToggleEnabled = async (checked: boolean) => {
    setEnabled(checked);
    await onUpdate({ enabled: checked });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/flagship/features"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Features
          </Link>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} variant="outline" size="sm">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Feature Info */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{feature.name}</h1>
          {getFeatureTypeBadge(feature.type)}
        </div>
        {feature.description && (
          <p className="mt-2 text-muted-foreground">{feature.description}</p>
        )}
        <div className="mt-4">
          <code className="rounded bg-muted px-2 py-1 text-sm">{feature.key}</code>
        </div>
      </div>

      {/* Enabled Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
              aria-label="Enabled"
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              {enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form or Details */}
      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Feature</CardTitle>
            <CardDescription>Update feature name and description</CardDescription>
          </CardHeader>
          <CardContent>
            <FeatureForm
              feature={feature}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Environment Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Rules</CardTitle>
          <CardDescription>Feature behavior per environment</CardDescription>
        </CardHeader>
        <CardContent>
          {feature.rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No environment rules configured</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Override</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feature.rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.environmentName}</TableCell>
                    <TableCell>
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'On' : 'Off'}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{rule.override.replace('_', ' ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Plan Entitlements (only for plan type) */}
      {feature.type === 'plan' && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Entitlements</CardTitle>
            <CardDescription>Plans that have access to this feature</CardDescription>
          </CardHeader>
          <CardContent>
            {feature.planEntitlements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No plans configured</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {feature.planEntitlements.map((plan) => (
                  <Badge key={plan} variant="outline" className="capitalize">
                    {plan}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

