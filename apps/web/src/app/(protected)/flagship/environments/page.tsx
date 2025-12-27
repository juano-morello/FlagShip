/**
 * Environments List Page
 *
 * Displays all FlagShip environments with management capabilities.
 */

'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EnvironmentsList } from '@/components/flagship/environments-list';
import { useFlagshipEnvironments } from '@/hooks/use-flagship-environments';
import type { Environment } from '@/types/flagship';

export default function EnvironmentsPage() {
  const {
    environments,
    isLoading,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
  } = useFlagshipEnvironments({ autoFetch: true });

  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);

  const handleEdit = (environment: Environment) => {
    setEditingEnvironment(environment);
    // TODO: Open edit dialog
    console.log('Edit environment:', environment);
  };

  const handleDelete = async (environment: Environment) => {
    if (confirm(`Are you sure you want to delete "${environment.name}"?`)) {
      try {
        await deleteEnvironment(environment.id);
      } catch (error) {
        console.error('Failed to delete environment:', error);
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Environments"
        description="Manage FlagShip environments for your organization"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Environment
          </Button>
        }
      />

      <EnvironmentsList
        environments={environments}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

