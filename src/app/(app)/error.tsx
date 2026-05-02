'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-charcoal mb-2">Something went wrong</h2>
      <p className="text-sm text-mid-gray mb-2 max-w-md">
        {error.message || 'An unexpected error occurred.'}
      </p>
      {error.digest && (
        <p className="text-xs text-mid-gray/60 font-mono mb-6">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
      >
        <RotateCcw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
