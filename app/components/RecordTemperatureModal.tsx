'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/lib/context';
import {
  isValidTemperature,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  TEMP_MIN_C,
  TEMP_MAX_C,
  hasFever,
} from '@/app/lib/logic';

interface RecordTemperatureModalProps {
  patientId: string;
  patientName: string;
  roomNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecordTemperatureModal({
  patientId,
  patientName,
  roomNumber,
  isOpen,
  onClose,
}: RecordTemperatureModalProps) {
  const { role, temperatureUnit: tempUnit, state, getTodayReading, recordTemperature, correctTemperature } = useApp();

  const [tempValue, setTempValue] = useState('');
  const [nurseName, setNurseName] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const existingReading = getTodayReading(patientId);
  const isCorrection = !!existingReading;
  const canCorrect = role === 'doctor' || role === 'admin';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempValue('');
      setNurseName('');
      setCorrectionReason('');
      setError(null);
      setSuccess(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minDisplay = tempUnit === 'F' ? celsiusToFahrenheit(TEMP_MIN_C) : TEMP_MIN_C;
  const maxDisplay = tempUnit === 'F' ? celsiusToFahrenheit(TEMP_MAX_C) : TEMP_MAX_C;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const rawTemp = parseFloat(tempValue);
    if (isNaN(rawTemp)) {
      setError('Please enter a valid temperature.');
      return;
    }

    // Convert to Celsius for storage
    const tempCelsius = tempUnit === 'F' ? fahrenheitToCelsius(rawTemp) : rawTemp;

    // Validate range in Celsius
    if (!isValidTemperature(tempCelsius)) {
      setError(
        `Temperature must be between ${minDisplay}°${tempUnit} and ${maxDisplay}°${tempUnit}.`
      );
      return;
    }

    if (!nurseName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (isCorrection && !canCorrect) {
      setError('Only doctors and admins can correct an existing reading.');
      return;
    }

    if (isCorrection && !correctionReason.trim()) {
      setError('Please provide a reason for the correction.');
      return;
    }

    setSubmitting(true);

    try {
      if (isCorrection && existingReading && role) {
        const res = correctTemperature(existingReading.id, tempCelsius, nurseName.trim(), role, correctionReason.trim());
        if (!res.success) {
          setError(res.error ?? 'Failed to correct temperature.');
          return;
        }
        setSuccess(`Temperature corrected to ${rawTemp}°${tempUnit} successfully.`);
      } else {
        const res = recordTemperature(patientId, tempCelsius, nurseName.trim());
        if (!res.success) {
          setError(res.error ?? 'Failed to record temperature.');
          return;
        }
        const feverStatus = hasFever(tempCelsius) ? ' (Fever detected ⚠️)' : ' (Normal ✓)';
        setSuccess(`Temperature ${rawTemp}°${tempUnit} recorded successfully.${feverStatus}`);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record temperature.');
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
            <h2 className="text-lg font-bold text-slate-800">
              {isCorrection ? 'Correct Temperature' : 'Record Temperature'}
            </h2>
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
          {/* Existing reading warning */}
          {isCorrection && existingReading && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <div className="font-semibold text-amber-800 mb-1">⚠️ Reading Already Exists</div>
              <div className="text-amber-700 space-y-0.5">
                <div>
                  Value:{' '}
                  <span className="font-semibold">
                    {tempUnit === 'F'
                      ? `${celsiusToFahrenheit(existingReading.temperature)}°F`
                      : `${existingReading.temperature}°C`}
                  </span>
                </div>
                <div>
                  Recorded by: <span className="font-semibold">{existingReading.recordedBy}</span>
                </div>
                <div>
                  Time:{' '}
                  <span className="font-semibold">
                    {new Date(existingReading.recordedAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
              {!canCorrect && (
                <div className="mt-2 text-red-600 font-semibold text-xs">
                  Only doctors and admins can correct readings.
                </div>
              )}
            </div>
          )}

          {/* Temperature input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Temperature (°{tempUnit})
            </label>
            <input
              type="number"
              step="0.1"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={`${minDisplay} – ${maxDisplay}`}
              className="w-full px-4 py-3 min-h-12 border border-slate-200 rounded-lg text-lg font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={isCorrection && !canCorrect}
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1">
              Valid range: {minDisplay}°{tempUnit} – {maxDisplay}°{tempUnit}
            </p>
          </div>

          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={nurseName}
              onChange={(e) => setNurseName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 min-h-12 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={isCorrection && !canCorrect}
            />
          </div>

          {/* Correction reason (only for corrections) */}
          {isCorrection && canCorrect && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for Correction *
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Explain why this reading needs correction"
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
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
              ✅ {success}
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
              disabled={submitting || (isCorrection && !canCorrect)}
              className="flex-1 px-4 py-3 min-h-12 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting
                ? 'Saving…'
                : isCorrection
                ? 'Submit Correction'
                : 'Record Temperature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
