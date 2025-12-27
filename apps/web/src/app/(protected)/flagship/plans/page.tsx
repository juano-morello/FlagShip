/**
 * Plans List Page
 *
 * Displays all FlagShip subscription plans with management capabilities.
 */

'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PlansList } from '@/components/flagship/plans-list';
import { useFlagshipPlans } from '@/hooks/use-flagship-plans';
import type { Plan } from '@/types/flagship';

export default function PlansPage() {
  const {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
  } = useFlagshipPlans({ autoFetch: true });

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    // TODO: Open edit dialog
    console.log('Edit plan:', plan);
  };

  const handleDelete = async (plan: Plan) => {
    if (confirm(`Are you sure you want to delete "${plan.displayName}"?`)) {
      try {
        await deletePlan(plan.id);
      } catch (error) {
        console.error('Failed to delete plan:', error);
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Plans"
        description="Manage subscription plans for your organization"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        }
      />

      <PlansList
        plans={plans}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

