'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/lib/context';
import {
  calculateFeverFreeStreak,
  FEVER_FREE_DAYS_FOR_DISCHARGE,
  celsiusToFahrenheit,
  hasFever,
} from '@/app/lib/logic';

interface RecordVisitModalProps {
  patientId: string;
  patientName: string;
  roomNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecordVisitModal({
  patientId,
  patientName,
  roomNumber,
  isOpen,
  onClose,
}: RecordVisitModalProps) {
  const {
    temperatureUnit: tempUnit,
    state,
    getTodayReading,
    getPatientReadings,
    recordVisit,
    confirmDischarge: confirmDischargeAction,
  } = useApp();

  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmDischarge, setConfirmDischarge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const todayReading = getTodayReading(patientId);
  const readings = getPatientReadings(patientId);
  const feverFreeStreak = calculateFeverFreeStreak(readings, state.currentDate);
  const isEligible = feverFreeStreak >= FEVER_FREE_DAYS_FOR_DISCHARGE;
  const hasTempToday = !!todayReading;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDoctorName('');
      setNotes('');
      setConfirmDischarge(false);
      setError(null);
      setSuccess(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayTemp = todayReading
    ? tempUnit === 'F'
      ? `${celsiusToFahrenheit(todayReading.temperature)}°F`
      : `${todayReading.temperature}°C`
    : null;

  const isFeverToday = todayReading ? hasFever(todayReading.temperature) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!hasTempToday) {
      setError('Cannot record visit without today\'s temperature reading.');
      return;
    }

    if (!doctorName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!notes.trim()) {
      setError('Please enter visit notes.');
      return;
    }

    setSubmitting(true);

    try {
      const res = recordVisit(patientId, notes.trim(), doctorName.trim());
      if (!res.success) {
        setError(res.error ?? 'Failed to record visit.');
        return;
      }
      if (confirmDischarge) {
        confirmDischargeAction(patientId, doctorName.trim());
      }
      setSuccess(
        confirmDischarge
          ? 'Visit recorded with discharge confirmation. ✅'
          : 'Visit recorded successfully. ✅'
      );
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record visit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Record Doctor Visit</h2>
            <p className="text-sm text-slate-500">
              Room {roomNumber} · {patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Temperature status */}
          {!hasTempToday ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <div className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Temperature not taken yet
              </div>
              <p className="text-amber-700 text-sm mt-1">
                Cannot record visit until temperature is measured. Please ensure
                the nurse records today&apos;s temperature first.
              </p>
            </div>
          ) : (
            <div
              className={`p-4 rounded-lg border ${
                isFeverToday
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">
                  Today&apos;s Temperature
                </div>
                <span
                  className={`text-lg font-bold ${
                    isFeverToday ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {displayTemp}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isFeverToday ? '🔴 Fever detected' : '🟢 Normal'} · Fever-free streak:{' '}
                <span className="font-semibold">{feverFreeStreak} days</span>
              </div>
            </div>
          )}

          {/* Doctor name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Doctor Name
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 min-h-12 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={!hasTempToday}
            />
          </div>

          {/* Visit notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Treatment Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter treatment notes, observations, and recommendations…"
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              disabled={!hasTempToday}
            />
          </div>

          {/* Discharge confirmation checkbox – only when eligible */}
          {isEligible && hasTempToday && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmDischarge}
                  onChange={(e) => setConfirmDischarge(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-semibold text-green-800">
                    Confirm Discharge
                  </div>
                  <div className="text-xs text-green-600 mt-0.5">
                    Patient has {feverFreeStreak} consecutive fever-free days (≥{' '}
                    {FEVER_FREE_DAYS_FOR_DISCHARGE} required). Confirming will add
                    to the discharge queue for admin processing.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
              ❌ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
              {success}
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
              type="submit"
              disabled={submitting || !hasTempToday}
              className="flex-1 px-4 py-3 min-h-12 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Saving…' : 'Record Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
