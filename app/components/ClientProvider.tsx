'use client';

import React from 'react';
import { AppProvider } from '@/app/lib/context';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
