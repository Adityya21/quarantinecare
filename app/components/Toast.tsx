'use client';

import React from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  tone?: 'neutral' | 'success' | 'error';
}

export default function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const borderClass =
    toast.tone === 'error'
      ? 'border-[#b91c1c] text-[#991b1b]'
      : toast.tone === 'success'
      ? 'border-[#0f766e] text-[#141413]'
      : 'border-[#e2e0d8] text-[#141413]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 sm:bottom-5 right-4 z-50 max-w-sm bg-white border ${borderClass} rounded-lg px-4 py-3 shadow-sm transition-opacity duration-150 flex items-center justify-between gap-3`}
    >
      <span className="text-sm font-medium">{toast.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-xs text-[#5c5b57] hover:text-[#141413] px-1.5 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
      >
        Close
      </button>
    </div>
  );
}

