
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logEvent } from '@/lib/telemetry';
import { useUser } from '@/firebase';

export function useTelemetry() {
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    if (!pathname) return;

    // Avoid logging admin and feed routes as generic app views
    if (pathname.startsWith('/admin') || pathname.startsWith('/feed')) return;

    logEvent('app_page_view', { 
      uid: user?.uid, 
      meta: { path: pathname } 
    });
  }, [pathname, user?.uid]);
}
