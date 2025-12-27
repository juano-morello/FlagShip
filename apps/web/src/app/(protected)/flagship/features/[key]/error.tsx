/**
 * Feature Detail Error Boundary
 */

'use client';

import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function FeatureDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error boundary - error is already logged by Next.js error handling
    // Additional error reporting can be added here if needed
  }, [error]);

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Feature</AlertTitle>
        <AlertDescription>
          {error.message || 'An unexpected error occurred while loading the feature.'}
        </AlertDescription>
      </Alert>
      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

