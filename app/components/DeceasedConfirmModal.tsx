'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/lib/context';

interface DeceasedConfirmModalProps {
  patientId: string;
  patientName: string;
  roomNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeceasedConfirmModal({
  patientId,
  patientName,
  roomNumber,
  isOpen,
  onClose,
}: DeceasedConfirmModalProps) {
  const { recordDeceased } = useApp();

  const [doctorName, setDoctorName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDoctorName('');
      setConfirmed(false);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setError(null);

    if (!doctorName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!confirmed) {
      // First click – require double confirmation
      setConfirmed(true);
      return;
    }

    // Second click – execute
    setSubmitting(true);

    try {
      recordDeceased(patientId, doctorName.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record deceased status.');
      setConfirmed(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-red-200 w-full max-w-md">
        {/* Header */}
        <div className="p-5 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">
              ⚠️
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-800">Record Deceased</h2>
              <p className="text-sm text-red-600">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Confirmation text */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
            Are you sure you want to record Patient{' '}
            <span className="font-bold text-slate-900">{patientName}</span> (Room{' '}
            <span className="font-bold text-slate-900">{roomNumber}</span>) as deceased?
            This action cannot be undone.
          </div>

          {/* Doctor name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Doctor Name
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => {
                setDoctorName(e.target.value);
                setConfirmed(false); // Reset double confirmation if name changes
              }}
              placeholder="Enter your name"
              className="w-full px-4 py-3 min-h-12 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Double confirmation notice */}
          {confirmed && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-800 font-semibold flex items-center gap-2">
              <span className="text-lg">🔴</span>
              Click &quot;Confirm Deceased&quot; again to finalize. This is irreversible.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
              ❌ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 min-h-12 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className={`flex-1 px-4 py-3 min-h-12 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                confirmed
                  ? 'bg-red-700 text-white hover:bg-red-800'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {submitting
                ? 'Processing…'
                : confirmed
                ? '⚠️ Confirm Deceased (Final)'
                : 'Confirm Deceased'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
