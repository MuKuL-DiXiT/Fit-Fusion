'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const checkAuth = useUserStore((state) => state.checkAuth);

  useEffect(() => {
    // Check authentication status when app loads
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
