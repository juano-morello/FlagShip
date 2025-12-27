/**
 * FeatureForm Component
 *
 * Form for editing feature details.
 * TDD: Implemented AFTER tests and stories were written.
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FeatureWithRules, UpdateFeatureDto } from '@/types/flagship';

const featureFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(128, 'Name must be less than 128 characters'),
  description: z.string().max(512, 'Description must be less than 512 characters').optional(),
});

type FeatureFormValues = z.infer<typeof featureFormSchema>;

interface FeatureFormProps {
  feature: FeatureWithRules;
  onSubmit: (data: UpdateFeatureDto) => Promise<void>;
  onCancel?: () => void;
}

export function FeatureForm({ feature, onSubmit, onCancel }: FeatureFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeatureFormValues>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: {
      name: feature.name,
      description: feature.description || '',
    },
  });

  const onSubmitForm = async (data: FeatureFormValues) => {
    await onSubmit({
      name: data.name,
      description: data.description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Feature Key (Read-only) */}
      <div className="space-y-2">
        <Label>Key</Label>
        <div className="rounded-md border bg-muted px-3 py-2">
          <code className="text-sm">{feature.key}</code>
          <p className="mt-1 text-xs text-muted-foreground">Key is immutable after creation</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Feature name"
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Feature description (optional)"
          rows={3}
          aria-invalid={errors.description ? 'true' : 'false'}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

