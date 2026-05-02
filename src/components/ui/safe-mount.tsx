'use client';

import { useEffect, useState, ReactNode } from 'react';

interface SafeMountProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that only renders its children on the client side.
 * Use this to wrap components that cause hydration mismatches or
 * depend on browser-only APIs.
 */
export function SafeMount({ children, fallback = null }: SafeMountProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
