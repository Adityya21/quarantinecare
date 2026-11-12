'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
    setTemperatureUnit,
    getTodayReading,
    getTodayVisit,
    getPatientReadings,
    recordTemperature,
    recordVisit,
    confirmDischarge,
  } = useApp();

  const [cursorIdx, setCursorIdx] = useState(0);
  const [tempInput, setTempInput] = useState('');
  const [staffName, setStaffName] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [markDischarge, setMarkDischarge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAtStart, setTotalAtStart] = useState<number>(0);

  const queue = useMemo(() => {
    const admitted = state.patients
      .filter((p) => p.status === 'admitted')
      .sort((a, b) => a.roomNumber - b.roomNumber);

    if (role === 'nurse') {
      return admitted.filter((p) => !getTodayReading(p.id));
    }

    if (role === 'doctor') {
      // Only patients WITH today's temperature and WITHOUT today's visit;
      // Priority: fever today first, then longest streak-in-progress, then room #
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

        const sa = calculateFeverFreeStreak(getPatientReadings(a.id), state.currentDate);
        const sb = calculateFeverFreeStreak(getPatientReadings(b.id), state.currentDate);
        if (sa !== sb) return sb - sa;

        return a.roomNumber - b.roomNumber;
      });
    }

    return [];
  }, [state.patients, state.currentDate, role, getTodayReading, getTodayVisit, getPatientReadings]);

  useEffect(() => {
    if (isOpen) {
      setTotalAtStart(queue.length);
      setCursorIdx(0);
      setTempInput('');
      setVisitNotes('');
      setMarkDischarge(false);
      setError(null);
      setStaffName(role === 'nurse' ? 'Nurse on duty' : 'Dr. Attending');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role]);

  // Clamp cursor index when queue shrinks
  const safeIdx = queue.length === 0 ? 0 : Math.min(cursorIdx, queue.length - 1);

  // Keyboard navigation: ArrowLeft / ArrowRight / Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && queue.length > 1) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          setCursorIdx((i) => Math.min(queue.length - 1, i + 1));
          setError(null);
        }
      } else if (e.key === 'ArrowLeft' && queue.length > 1) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          setCursorIdx((i) => Math.max(0, i - 1));
          setError(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, queue.length, onClose]);

  if (!isOpen) return null;

  const currentPatient = queue[safeIdx] ?? null;
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
      `Room ${currentPatient.roomNumber}: ${parsed.toFixed(1)} °${temperatureUnit} saved.`,
      'success',
    );
    setTempInput('');
    setError(null);
  };

  const handleDoctorSave = (e?: React.FormEvent) => {
    e?.preventDefault();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/40"
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Round Mode"
    >
      <div className="bg-white border border-[#E7E5E0] rounded-xl w-full max-w-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E5E0] flex items-center justify-between gap-3">
          <div>
            <p className="caption-label text-[#6B7680]">
              {role === 'nurse'
                ? 'Nurse Temperature Round'
                : 'Doctor Clinical Round (Fever First, Longest Streak)'}
            </p>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#1F2933]">
              {remaining > 0 ? `${remaining} remaining` : 'Round complete'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTemperatureUnit(temperatureUnit === 'C' ? 'F' : 'C')}
              aria-label={`Switch temperature unit, currently ${temperatureUnit}`}
              className="font-mono tabular-nums px-2.5 py-2 min-h-[44px] rounded-lg border border-[#E7E5E0] text-xs font-medium text-[#1F2933] hover:bg-[#FAFAF8] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              &deg;{temperatureUnit}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Exit round"
              className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-lg border border-[#E7E5E0] text-sm font-medium text-[#1F2933] hover:bg-[#FAFAF8] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              <X className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Thin progress line */}
        <div className="h-1 bg-[#E7E5E0] w-full">
          <div
            className="h-1 bg-[#1F6F6B] transition-all duration-150"
            style={{ width: `${remaining === 0 ? 100 : progressPct}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6">
          {!currentPatient ? (
            <div className="py-8 text-center space-y-3">
              <p className="font-serif-heading text-xl text-[#1F2933]">
                {role === 'nurse'
                  ? 'All occupied rooms have today’s temperature recorded.'
                  : 'No patients are awaiting a doctor visit with a recorded temperature.'}
              </p>
              <p className="text-sm text-[#6B7680]">
                {role === 'doctor'
                  ? 'Patients without today’s temperature are locked until a nurse records their reading.'
                  : 'Return to the Ward Board to review room status or advance to the next day.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-3 min-h-[44px] rounded-lg bg-[#1F6F6B] text-white text-sm font-medium hover:bg-[#175552] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              >
                Return to Ward Board
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Patient header + Prev/Next controls */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7E5E0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#FAFAF8] border border-[#E7E5E0] text-[#1F2933]">
                      Room {String(currentPatient.roomNumber).padStart(2, '0')}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-[#6B7680]">
                      {safeIdx + 1} of {remaining}
                    </span>
                  </div>
                  <h3 className="font-serif-heading text-2xl font-semibold text-[#1F2933] mt-1.5">
                    {currentPatient.name}
                  </h3>
                  <p className="text-xs text-[#6B7680] font-mono tabular-nums">
                    Admitted {currentPatient.admissionDate}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {role === 'doctor' && currentReading && (
                    <div className="text-right mr-2">
                      <span className="caption-label text-[#6B7680] block">Today&apos;s Temp</span>
                      <span
                        className={`font-mono tabular-nums text-xl font-bold ${
                          hasFever(currentReading.temperature) ? 'text-[#B91C1C]' : 'text-[#284732]'
                        }`}
                      >
                        {temperatureUnit === 'F'
                          ? `${celsiusToFahrenheit(currentReading.temperature).toFixed(1)} °F`
                          : `${currentReading.temperature.toFixed(1)} °C`}
                      </span>
                      <span className="block text-[11px] font-medium text-[#6B7680]">
                        {hasFever(currentReading.temperature) ? 'Fever priority' : 'Fever-free'}
                      </span>
                    </div>
                  )}

                  {remaining > 1 && (
                    <>
                      <button
                        type="button"
                        disabled={safeIdx === 0}
                        onClick={() => setCursorIdx((i) => Math.max(0, i - 1))}
                        aria-label="Previous pending patient"
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#E7E5E0] text-[#1F2933] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        disabled={safeIdx >= remaining - 1}
                        onClick={() => setCursorIdx((i) => Math.min(remaining - 1, i + 1))}
                        aria-label="Next pending patient"
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#E7E5E0] text-[#1F2933] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {role === 'nurse' ? (
                <form onSubmit={handleNurseSave} className="space-y-4">
                  <div>
                    <label
                      htmlFor="round-temp-input"
                      className="caption-label text-[#6B7680] block mb-1.5"
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
                      className="w-full font-mono tabular-nums text-3xl font-bold px-4 py-4 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="round-nurse-name"
                      className="caption-label text-[#6B7680] block mb-1"
                    >
                      Recorded By
                    </label>
                    <input
                      id="round-nurse-name"
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-[#E7E5E0] text-sm text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] text-sm text-[#991B1B]">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 min-h-[48px] rounded-lg bg-[#1F6F6B] text-white text-base font-semibold hover:bg-[#175552] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
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
                      className="caption-label text-[#6B7680] block mb-1.5"
                    >
                      Treatment &amp; Assessment Notes (Enter saves)
                    </label>
                    <textarea
                      id="round-visit-notes"
                      rows={3}
                      autoFocus
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleDoctorSave();
                        }
                      }}
                      placeholder="Clinical observations, hydration, symptom status..."
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E7E5E0] text-sm text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    />
                  </div>

                  {isEligible && !alreadyQueued && (
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F6F6B] bg-[#F0FDFA] cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={markDischarge}
                        onChange={(e) => setMarkDischarge(e.target.checked)}
                        className="w-4 h-4 accent-[#1F6F6B]"
                      />
                      <span className="text-sm font-medium text-[#1F2933]">
                        Confirm discharge readiness (3+ fever-free days met)
                      </span>
                    </label>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] text-sm text-[#991B1B]">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 min-h-[48px] rounded-lg bg-[#1F6F6B] text-white text-base font-semibold hover:bg-[#175552] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
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
