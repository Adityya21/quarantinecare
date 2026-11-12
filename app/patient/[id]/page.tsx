'use client';

import React, { Suspense, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import PatientDetailPanel from '@/app/components/PatientDetailPanel';
import Toast, { type ToastMessage } from '@/app/components/Toast';

function PatientStandaloneContent() {
  const params = useParams();
  const patientId = params.id as string;
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = (text: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
    const id = Date.now().toString();
    setToast({ id, text, tone });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-xs font-semibold text-[#0f766e] hover:underline"
        >
          &larr; Back to Ward Board
        </Link>

        <div className="border border-[#e2e0d8] rounded-lg overflow-hidden bg-white">
          <PatientDetailPanel
            patientId={patientId}
            onNotify={notify}
            isStandalonePage={true}
          />
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function PatientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafaf7] p-8 text-center text-sm text-[#5c5b57]">
          Loading patient chart...
        </div>
      }
    >
      <PatientStandaloneContent />
    </Suspense>
  );
}
