'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/app/lib/context';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  hasFever,
  isValidTemperature,
  calculateFeverFreeStreak,
  TEMP_MIN_C,
  TEMP_MAX_C,
  FEVER_FREE_DAYS_FOR_DISCHARGE,
} from '@/app/lib/logic';
import StreakRibbon from './StreakRibbon';

interface RoundModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

export default function RoundModeModal({
  isOpen,
  onClose,
  onNotify,
}: RoundModeModalProps) {
  const {
    role,
    state,
    temperatureUnit,
    getTodayReading,
    getTodayVisit,
    getPatientReadings,
    recordTemperature,
    recordVisit,
    confirmDischarge,
  } = useApp();

  const [tempInput, setTempInput] = useState('');
  const [staffName, setStaffName] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [markDischarge, setMarkDischarge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAtStart, setTotalAtStart] = useState<number>(0);

  // Build ordered queue for Nurse or Doctor
  const queue = useMemo(() => {
    const admitted = state.patients
      .filter((p) => p.status === 'admitted')
      .sort((a, b) => a.roomNumber - b.roomNumber);

    if (role === 'nurse') {
      return admitted.filter((p) => !getTodayReading(p.id));
    }

    if (role === 'doctor') {
      // Only patients WITH today's temperature and WITHOUT today's visit; FEVER FIRST
      const ready = admitted.filter((p) => {
        const temp = getTodayReading(p.id);
        const visit = getTodayVisit(p.id);
        return Boolean(temp) && !visit;
      });

      return ready.sort((a, b) => {
        const ta = getTodayReading(a.id)!;
        const tb = getTodayReading(b.id)!;
        const fa = hasFever(ta.temperature) ? 0 : 1;
        const fb = hasFever(tb.temperature) ? 0 : 1;
        if (fa !== fb) return fa - fb;
        return a.roomNumber - b.roomNumber;
      });
    }

    return [];
  }, [state.patients, role, getTodayReading, getTodayVisit]);

  useEffect(() => {
    if (isOpen) {
      setTotalAtStart(queue.length);
      setTempInput('');
      setVisitNotes('');
      setMarkDischarge(false);
      setError(null);
      setStaffName(role === 'nurse' ? 'Nurse on duty' : 'Dr. Attending');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role]);

  if (!isOpen) return null;

  const currentPatient = queue[0] ?? null;
  const remaining = queue.length;
  const denominator = Math.max(totalAtStart, remaining, 1);
  const completedCount = Math.max(0, denominator - remaining);
  const progressPct = Math.round((completedCount / denominator) * 100);

  const minDisplay = temperatureUnit === 'F' ? celsiusToFahrenheit(TEMP_MIN_C) : TEMP_MIN_C;
  const maxDisplay = temperatureUnit === 'F' ? celsiusToFahrenheit(TEMP_MAX_C) : TEMP_MAX_C;

  const handleNurseSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    setError(null);

    const parsed = parseFloat(tempInput);
    if (isNaN(parsed)) {
      setError('Enter a numeric temperature value.');
      return;
    }

    const celsius = temperatureUnit === 'F' ? fahrenheitToCelsius(parsed) : parsed;
    if (!isValidTemperature(celsius)) {
      setError(`Value out of range. Enter between ${minDisplay} and ${maxDisplay} °${temperatureUnit}.`);
      return;
    }

    const res = recordTemperature(
      currentPatient.id,
      celsius,
      staffName.trim() || 'Nurse on duty',
    );
    if (!res.success) {
      setError(res.error ?? 'Could not record temperature.');
      return;
    }

    onNotify?.(
      `Room ${currentPatient.roomNumber}: ${parsed.toFixed(1)}°${temperatureUnit} saved.`,
      'success',
    );
    setTempInput('');
    setError(null);
  };

  const handleDoctorSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    setError(null);

    if (!visitNotes.trim()) {
      setError('Enter clinical visit notes before saving.');
      return;
    }

    const res = recordVisit(
      currentPatient.id,
      visitNotes.trim(),
      staffName.trim() || 'Dr. Attending',
    );
    if (!res.success) {
      setError(res.error ?? 'Could not record visit.');
      return;
    }

    if (markDischarge) {
      confirmDischarge(currentPatient.id, staffName.trim() || 'Dr. Attending');
    }

    onNotify?.(
      `Room ${currentPatient.roomNumber}: Visit logged${markDischarge ? ' and discharge confirmed' : ''}.`,
      'success',
    );
    setVisitNotes('');
    setMarkDischarge(false);
    setError(null);
  };

  const currentReading = currentPatient ? getTodayReading(currentPatient.id) : undefined;
  const currentReadings = currentPatient ? getPatientReadings(currentPatient.id) : [];
  const currentStreak = currentPatient
    ? calculateFeverFreeStreak(currentReadings, state.currentDate)
    : 0;
  const isEligible = currentStreak >= FEVER_FREE_DAYS_FOR_DISCHARGE;
  const alreadyQueued = currentPatient
    ? state.dischargeQueue.includes(currentPatient.id)
    : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413]/40"
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Round Mode"
    >
      <div className="bg-white border border-[#e2e0d8] rounded-xl w-full max-w-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e0d8] flex items-center justify-between gap-4">
          <div>
            <p className="caption-label text-[#5c5b57]">
              {role === 'nurse' ? 'Nurse Temperature Round' : 'Doctor Clinical Round (Fever First)'}
            </p>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#141413]">
              {remaining > 0 ? `${remaining} remaining` : 'Round complete'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 min-h-[40px] rounded border border-[#e2e0d8] text-sm font-medium text-[#141413] hover:bg-[#fafaf7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
          >
            Exit round
          </button>
        </div>

        {/* Thin progress line */}
        <div className="h-1 bg-[#e2e0d8] w-full">
          <div
            className="h-1 bg-[#0f766e] transition-all duration-150"
            style={{ width: `${remaining === 0 ? 100 : progressPct}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6">
          {!currentPatient ? (
            <div className="py-8 text-center space-y-3">
              <p className="font-serif-heading text-xl text-[#141413]">
                {role === 'nurse'
                  ? 'All occupied rooms have today’s temperature recorded.'
                  : 'No patients are awaiting a doctor visit with a recorded temperature.'}
              </p>
              <p className="text-sm text-[#5c5b57]">
                {role === 'doctor'
                  ? 'Patients without today’s temperature are locked until a nurse records their reading.'
                  : 'Return to the Ward Board to review room status or advance to the next day.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-3 min-h-[44px] rounded bg-[#0f766e] text-white text-sm font-medium hover:bg-[#0d625b] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                Return to Ward Board
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Patient header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#e2e0d8]">
                <div>
                  <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded bg-[#fafaf7] border border-[#e2e0d8] text-[#141413]">
                    Room {String(currentPatient.roomNumber).padStart(2, '0')}
                  </span>
                  <h3 className="font-serif-heading text-2xl font-semibold text-[#141413] mt-1.5">
                    {currentPatient.name}
                  </h3>
                  <p className="text-xs text-[#5c5b57] font-mono tabular-nums">
                    Admitted {currentPatient.admissionDate}
                  </p>
                </div>

                {role === 'doctor' && currentReading && (
                  <div className="text-right">
                    <span className="caption-label text-[#5c5b57] block">Today&apos;s Temp</span>
                    <span
                      className={`font-mono tabular-nums text-xl font-bold ${
                        hasFever(currentReading.temperature) ? 'text-[#b91c1c]' : 'text-[#284732]'
                      }`}
                    >
                      {temperatureUnit === 'F'
                        ? `${celsiusToFahrenheit(currentReading.temperature)}°F`
                        : `${currentReading.temperature.toFixed(1)}°C`}
                    </span>
                    <span className="block text-xs font-medium text-[#5c5b57]">
                      {hasFever(currentReading.temperature) ? 'FEVER PRIORITY' : 'Fever-free'}
                    </span>
                  </div>
                )}
              </div>

              {role === 'nurse' ? (
                <form onSubmit={handleNurseSave} className="space-y-4">
                  <div>
                    <label
                      htmlFor="round-temp-input"
                      className="caption-label text-[#5c5b57] block mb-1.5"
                    >
                      Temperature (&deg;{temperatureUnit}) — Range {minDisplay} to {maxDisplay}
                    </label>
                    <input
                      id="round-temp-input"
                      type="number"
                      step="0.1"
                      autoFocus
                      value={tempInput}
                      onChange={(e) => setTempInput(e.target.value)}
                      placeholder={temperatureUnit === 'F' ? '98.6' : '37.0'}
                      className="w-full font-mono tabular-nums text-3xl font-bold px-4 py-4 rounded border border-[#e2e0d8] bg-[#fafaf7] text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="round-nurse-name"
                      className="caption-label text-[#5c5b57] block mb-1"
                    >
                      Recorded By
                    </label>
                    <input
                      id="round-nurse-name"
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2.5 min-h-[44px] rounded border border-[#e2e0d8] text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded border border-[#b91c1c] bg-[#fef2f2] text-sm text-[#991b1b]">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 min-h-[48px] rounded bg-[#0f766e] text-white text-base font-semibold hover:bg-[#0d625b] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                  >
                    Save &amp; Next Room
                  </button>
                </form>
              ) : (
                <form onSubmit={handleDoctorSave} className="space-y-4">
                  <StreakRibbon
                    readings={currentReadings}
                    currentDate={state.currentDate}
                    temperatureUnit={temperatureUnit}
                  />

                  <div>
                    <label
                      htmlFor="round-visit-notes"
                      className="caption-label text-[#5c5b57] block mb-1.5"
                    >
                      Treatment &amp; Assessment Notes
                    </label>
                    <textarea
                      id="round-visit-notes"
                      rows={3}
                      autoFocus
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder="Clinical observations, hydration, symptom status..."
                      className="w-full px-3 py-2.5 rounded border border-[#e2e0d8] text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    />
                  </div>

                  {isEligible && !alreadyQueued && (
                    <label className="flex items-center gap-3 p-3 rounded border border-[#0f766e] bg-[#f0fdfa] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markDischarge}
                        onChange={(e) => setMarkDischarge(e.target.checked)}
                        className="w-4 h-4 accent-[#0f766e]"
                      />
                      <span className="text-sm font-medium text-[#141413]">
                        Confirm discharge readiness (3+ fever-free days met)
                      </span>
                    </label>
                  )}

                  {error && (
                    <div className="p-3 rounded border border-[#b91c1c] bg-[#fef2f2] text-sm text-[#991b1b]">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 min-h-[48px] rounded bg-[#0f766e] text-white text-base font-semibold hover:bg-[#0d625b] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                  >
                    Save Visit &amp; Next Patient
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

