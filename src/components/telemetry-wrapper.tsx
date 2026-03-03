'use client';

import React from 'react';
import { useTelemetry } from '@/hooks/use-telemetry';

/**
 * A Client Component wrapper that initializes telemetry hooks.
 * This is separated from the layout to avoid Next.js compilation errors
 * regarding the 'use client' directive location.
 */
export function TelemetryWrapper({ children }: { children: React.ReactNode }) {
  useTelemetry();
  return <>{children}</>;
}
