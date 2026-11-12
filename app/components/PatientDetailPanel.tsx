'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Thermometer, Stethoscope, Lock, Check, AlertTriangle } from 'lucide-react';
import { useApp } from '@/app/lib/context';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  hasFever,
  isValidTemperature,
  calculateFeverFreeStreak,
  isEligibleForDischarge,
  formatDate,
  TEMP_MIN_C,
  TEMP_MAX_C,
} from '@/app/lib/logic';
import StreakRibbon from './StreakRibbon';

interface PatientDetailPanelProps {
  patientId: string;
  onClose?: () => void;
  onNotify?: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
  isStandalonePage?: boolean;
}

export default function PatientDetailPanel({
  patientId,
  onClose,
  onNotify,
  isStandalonePage = false,
}: PatientDetailPanelProps) {
  const {
    role,
    state,
    temperatureUnit,
    getPatientReadings,
    getPatientVisits,
    getTodayReading,
    getTodayVisit,
    recordTemperature,
    correctTemperature,
    recordVisit,
    confirmDischarge,
    executeDischarge,
    recordDeceased,
  } = useApp();

  const patient = state.patients.find((p) => p.id === patientId);

  const [tempInput, setTempInput] = useState('');
  const [staffName, setStaffName] = useState('');
  const [tempFeedback, setTempFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const [showCorrectForm, setShowCorrectForm] = useState(false);
  const [correctInput, setCorrectInput] = useState('');
  const [correctReason, setCorrectReason] = useState('');

  const [visitNotes, setVisitNotes] = useState('');
  const [visitFeedback, setVisitFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  const [showDeceasedConfirm, setShowDeceasedConfirm] = useState(false);

  useEffect(() => {
    setTempInput('');
    setTempFeedback(null);
    setShowCorrectForm(false);
    setCorrectInput('');
    setCorrectReason('');
    setVisitNotes('');
    setVisitFeedback(null);
    setShowDischargeConfirm(false);
    setShowDeceasedConfirm(false);
    setStaffName(
      role === 'nurse'
        ? 'Nurse on duty'
        : role === 'doctor'
        ? 'Dr. Attending'
        : 'Admin Staff',
    );
  }, [patientId, role]);

  if (!patient) {
    return (
      <div className="p-6 text-sm text-[#6B7680]">
        Select a room on the Ward Board to inspect patient details.
      </div>
    );
  }

  const readings = getPatientReadings(patientId);
  const visits = getPatientVisits(patientId);
  const todayReading = getTodayReading(patientId);
  const todayVisit = getTodayVisit(patientId);
  const streak = calculateFeverFreeStreak(readings, state.currentDate);
  const eligible = isEligibleForDischarge(readings, state.currentDate);
  const inDischargeQueue = state.dischargeQueue.includes(patientId);
  const isAdmitted = patient.status === 'admitted';
  const currentRole = role ?? 'nurse';

  const formatTemp = (celsius: number) =>
    temperatureUnit === 'F'
      ? `${celsiusToFahrenheit(celsius).toFixed(1)} °F`
      : `${celsius.toFixed(1)} °C`;

  const minDisplay = temperatureUnit === 'F' ? celsiusToFahrenheit(TEMP_MIN_C) : TEMP_MIN_C;
  const maxDisplay = temperatureUnit === 'F' ? celsiusToFahrenheit(TEMP_MAX_C) : TEMP_MAX_C;

  const handleRecordTemp = (e: React.FormEvent) => {
    e.preventDefault();
    setTempFeedback(null);

    if (todayReading) {
      setTempFeedback({
        tone: 'error',
        text: `Reading already recorded today (${formatTemp(todayReading.temperature)}). Only a Doctor can correct it.`,
      });
      return;
    }

    const parsed = parseFloat(tempInput);
    if (isNaN(parsed)) {
      setTempFeedback({ tone: 'error', text: 'Enter a valid numeric temperature.' });
      return;
    }

    const celsius = temperatureUnit === 'F' ? fahrenheitToCelsius(parsed) : parsed;
    if (!isValidTemperature(celsius)) {
      setTempFeedback({
        tone: 'error',
        text: `Temperature must be between ${minDisplay} and ${maxDisplay} °${temperatureUnit}.`,
      });
      return;
    }

    const res = recordTemperature(
      patientId,
      celsius,
      staffName.trim() || 'Nurse on duty',
    );
    if (!res.success) {
      setTempFeedback({ tone: 'error', text: res.error ?? 'Could not record temperature.' });
      return;
    }

    setTempInput('');
    setTempFeedback({ tone: 'success', text: `Recorded ${formatTemp(celsius)}.` });
    onNotify?.(`Room ${patient.roomNumber}: Temperature ${formatTemp(celsius)} recorded.`, 'success');
  };

  const handleCorrectTemp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayReading || currentRole !== 'doctor') return;
    setTempFeedback(null);

    const parsed = parseFloat(correctInput);
    if (isNaN(parsed)) {
      setTempFeedback({ tone: 'error', text: 'Enter a valid numeric temperature.' });
      return;
    }
    const celsius = temperatureUnit === 'F' ? fahrenheitToCelsius(parsed) : parsed;
    if (!isValidTemperature(celsius)) {
      setTempFeedback({
        tone: 'error',
        text: `Temperature must be between ${minDisplay} and ${maxDisplay} °${temperatureUnit}.`,
      });
      return;
    }
    if (!correctReason.trim()) {
      setTempFeedback({ tone: 'error', text: 'A correction reason is required.' });
      return;
    }

    const res = correctTemperature(
      todayReading.id,
      celsius,
      staffName.trim() || 'Dr. Attending',
      'doctor',
      correctReason.trim(),
    );
    if (!res.success) {
      setTempFeedback({ tone: 'error', text: res.error ?? 'Correction failed.' });
      return;
    }

    setShowCorrectForm(false);
    setCorrectInput('');
    setCorrectReason('');
    setTempFeedback({ tone: 'success', text: `Corrected to ${formatTemp(celsius)}.` });
    onNotify?.(`Room ${patient.roomNumber}: Temperature corrected and audited.`, 'success');
  };

  const handleRecordVisit = (e: React.FormEvent) => {
    e.preventDefault();
    setVisitFeedback(null);

    if (!visitNotes.trim()) {
      setVisitFeedback({ tone: 'error', text: 'Enter treatment or clinical notes.' });
      return;
    }

    const res = recordVisit(
      patientId,
      visitNotes.trim(),
      staffName.trim() || 'Dr. Attending',
    );
    if (!res.success) {
      setVisitFeedback({ tone: 'error', text: res.error ?? 'Could not record visit.' });
      return;
    }

    setVisitNotes('');
    setVisitFeedback({ tone: 'success', text: 'Doctor visit logged.' });
    onNotify?.(`Room ${patient.roomNumber}: Doctor visit logged.`, 'success');
  };

  const handleConfirmDischarge = () => {
    const res = confirmDischarge(patientId, staffName.trim() || 'Dr. Attending');
    if (res.success) {
      onNotify?.(`Room ${patient.roomNumber}: Confirmed for discharge queue.`, 'success');
    } else {
      onNotify?.(res.error ?? 'Unable to confirm discharge.', 'error');
    }
  };

  const handleExecuteDischarge = () => {
    const res = executeDischarge(patientId, staffName.trim() || 'Admin Staff');
    if (res.success) {
      setShowDischargeConfirm(false);
      onNotify?.(`Room ${patient.roomNumber}: Patient discharged. Room is now vacant.`, 'success');
    } else {
      onNotify?.(res.error ?? 'Unable to execute discharge.', 'error');
    }
  };

  const handleDeceased = () => {
    const res = recordDeceased(patientId, staffName.trim() || 'Dr. Attending');
    if (res.success) {
      setShowDeceasedConfirm(false);
      onNotify?.(`Room ${patient.roomNumber}: Patient recorded as deceased. Room freed.`, 'neutral');
    } else {
      onNotify?.(res.error ?? 'Unable to record outcome.', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-5 border-b border-[#E7E5E0] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#FAFAF8] border border-[#E7E5E0] text-[#1F2933]">
              Room {String(patient.roomNumber).padStart(2, '0')}
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                patient.status === 'admitted'
                  ? 'border-[#4D7C5B] bg-[#E6F0E8] text-[#284732]'
                  : patient.status === 'discharged'
                  ? 'border-[#1F6F6B] bg-[#F0FDFA] text-[#1F6F6B]'
                  : 'border-[#B91C1C] bg-[#FEF2F2] text-[#991B1B]'
              }`}
            >
              {patient.status}
            </span>
            {!isStandalonePage && (
              <Link
                href={`/patient/${patient.id}`}
                className="text-xs text-[#1F6F6B] underline hover:text-[#175552]"
              >
                Full view
              </Link>
            )}
          </div>
          <h2 className="font-serif-heading text-2xl font-semibold text-[#1F2933] mt-1.5">
            {patient.name}
          </h2>
          <p className="text-xs text-[#6B7680] font-mono tabular-nums mt-0.5">
            Admitted {formatDate(patient.admissionDate)}
            {patient.dischargeDate ? ` / Discharged ${formatDate(patient.dischargeDate)}` : ''}
            {patient.deceasedDate ? ` / Deceased ${formatDate(patient.deceasedDate)}` : ''}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close patient panel"
            className="px-3 py-2 min-h-[44px] rounded-lg border border-[#E7E5E0] text-xs font-medium text-[#6B7680] hover:text-[#1F2933] hover:bg-[#FAFAF8] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
          >
            Close
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* Today's status chips */}
        {isAdmitted && (
          <div className="grid grid-cols-2 gap-2">
            <div
              className={`p-3 rounded-lg border text-xs ${
                todayReading
                  ? hasFever(todayReading.temperature)
                    ? 'border-[#B91C1C] bg-[#FEF2F2] text-[#991B1B]'
                    : 'border-[#4D7C5B] bg-[#E6F0E8] text-[#284732]'
                  : 'border-[#E7E5E0] bg-[#FAFAF8] text-[#6B7680]'
              }`}
            >
              <span className="caption-label inline-flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>Temp Today</span>
              </span>
              <span className="font-mono tabular-nums text-sm font-bold block mt-0.5">
                {todayReading
                  ? `${formatTemp(todayReading.temperature)}${hasFever(todayReading.temperature) ? ' (Fever)' : ' (Clear)'}`
                  : 'Pending'}
              </span>
            </div>

            <div
              className={`p-3 rounded-lg border text-xs ${
                todayVisit
                  ? 'border-[#4D7C5B] bg-[#E6F0E8] text-[#284732]'
                  : !todayReading
                  ? 'border-dashed border-[#A3A199] bg-[#FAFAF8] text-[#6B7680]'
                  : 'border-[#E7E5E0] bg-[#FAFAF8] text-[#1F2933]'
              }`}
            >
              <span className="caption-label inline-flex items-center gap-1">
                {!todayReading && !todayVisit ? (
                  <Lock className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                ) : todayVisit ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Stethoscope className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                )}
                <span>Doctor Visit</span>
              </span>
              <span className="text-sm font-bold block mt-0.5">
                {todayVisit
                  ? 'Visited'
                  : !todayReading
                  ? 'Locked'
                  : 'Pending'}
              </span>
            </div>
          </div>
        )}

        {/* 7-day Streak Ribbon + Computed Explainer */}
        <StreakRibbon
          readings={readings}
          currentDate={state.currentDate}
          temperatureUnit={temperatureUnit}
        />

        {/* Role-specific Actions */}
        {!isAdmitted ? (
          <div className="p-3 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-sm text-[#6B7680]">
            Case closed ({patient.status}). No new clinical entries permitted.
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-[#E7E5E0]">
            {/* TEMPERATURE SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="caption-label text-[#6B7680] font-semibold">
                  Daily Temperature ({formatDate(state.currentDate)})
                </span>
                {todayReading && currentRole === 'doctor' && (
                  <button
                    type="button"
                    onClick={() => setShowCorrectForm((v) => !v)}
                    className="text-xs font-medium text-[#1F6F6B] underline cursor-pointer"
                  >
                    {showCorrectForm ? 'Cancel correction' : 'Correct reading'}
                  </button>
                )}
              </div>

              {todayReading && (
                <div className="p-3 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-xs space-y-1">
                  <p className="font-medium text-[#1F2933]">
                    Existing reading:{' '}
                    <span className="font-mono tabular-nums font-bold">
                      {formatTemp(todayReading.temperature)}
                    </span>
                  </p>
                  <p className="text-[#6B7680]">
                    Recorded by {todayReading.recordedBy} at{' '}
                    {new Date(todayReading.recordedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {currentRole !== 'doctor' && (
                    <p className="text-[#991B1B] font-medium pt-1">
                      Only one reading per day is permitted. Only a Doctor can correct an existing reading.
                    </p>
                  )}
                </div>
              )}

              {currentRole === 'nurse' && (
                <form onSubmit={handleRecordTemp} className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      disabled={Boolean(todayReading)}
                      value={tempInput}
                      onChange={(e) => setTempInput(e.target.value)}
                      placeholder={`Temp °${temperatureUnit} (${minDisplay}–${maxDisplay})`}
                      aria-label={`Temperature in degrees ${temperatureUnit}`}
                      className="flex-1 font-mono tabular-nums px-3 py-2.5 min-h-[44px] rounded-lg border border-[#E7E5E0] text-sm disabled:bg-[#FAFAF8] disabled:text-[#6B7680] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    />
                    <button
                      type="submit"
                      disabled={Boolean(todayReading)}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg bg-[#1F6F6B] text-white text-sm font-medium hover:bg-[#175552] disabled:bg-[#D4D2C9] disabled:text-[#6B7680] disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              {!todayReading && currentRole !== 'nurse' && (
                <p className="text-xs text-[#6B7680]">
                  Only a Nurse can record the initial daily temperature.
                </p>
              )}

              {showCorrectForm && todayReading && currentRole === 'doctor' && (
                <form
                  onSubmit={handleCorrectTemp}
                  className="p-3 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] space-y-2.5"
                >
                  <p className="text-xs font-semibold text-[#1F2933]">
                    Correct Today&apos;s Temperature (audited)
                  </p>
                  <input
                    type="number"
                    step="0.1"
                    value={correctInput}
                    onChange={(e) => setCorrectInput(e.target.value)}
                    placeholder={`New temp °${temperatureUnit}`}
                    aria-label="Corrected temperature"
                    className="w-full font-mono tabular-nums px-3 py-2 min-h-[44px] rounded-lg border border-[#E7E5E0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                  />
                  <input
                    type="text"
                    value={correctReason}
                    onChange={(e) => setCorrectReason(e.target.value)}
                    placeholder="Mandatory reason for correction"
                    aria-label="Reason for correction"
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-[#E7E5E0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 min-h-[44px] rounded-lg bg-[#1F2933] text-white text-xs font-semibold hover:bg-[#323F4B] cursor-pointer"
                  >
                    Save Correction
                  </button>
                </form>
              )}

              {tempFeedback && (
                <p
                  className={`text-xs font-medium ${
                    tempFeedback.tone === 'error' ? 'text-[#991B1B]' : 'text-[#1F6F6B]'
                  }`}
                >
                  {tempFeedback.text}
                </p>
              )}
            </div>

            {/* DOCTOR VISIT & OUTCOMES */}
            {currentRole === 'doctor' && (
              <div className="space-y-3 pt-3 border-t border-[#E7E5E0]">
                <span className="caption-label text-[#6B7680] font-semibold block">
                  Doctor Visit &amp; Clinical Actions
                </span>

                {todayVisit ? (
                  <div className="p-3 rounded-lg border border-[#4D7C5B] bg-[#E6F0E8] text-xs space-y-1">
                    <p className="font-semibold text-[#284732]">
                      Visited today by {todayVisit.recordedBy}
                    </p>
                    <p className="text-[#1F2933]">{todayVisit.notes}</p>
                  </div>
                ) : (
                  <form onSubmit={handleRecordVisit} className="space-y-2.5">
                    {!todayReading && (
                      <div
                        role="alert"
                        className="p-2.5 rounded-lg border border-dashed border-[#B91C1C] bg-[#FEF2F2] text-xs font-medium text-[#991B1B] flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                        <span>Temperature not taken yet</span>
                      </div>
                    )}
                    <textarea
                      rows={2}
                      disabled={!todayReading}
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder="Treatment and clinical notes..."
                      aria-label="Doctor visit notes"
                      className="w-full px-3 py-2 rounded-lg border border-[#E7E5E0] text-sm disabled:bg-[#FAFAF8] disabled:text-[#6B7680] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    />
                    <button
                      type="submit"
                      disabled={!todayReading}
                      className="w-full py-2.5 min-h-[44px] rounded-lg bg-[#1F6F6B] text-white text-sm font-medium hover:bg-[#175552] disabled:bg-[#D4D2C9] disabled:text-[#6B7680] disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    >
                      Record Visit
                    </button>
                  </form>
                )}

                {visitFeedback && (
                  <p
                    className={`text-xs font-medium ${
                      visitFeedback.tone === 'error' ? 'text-[#991B1B]' : 'text-[#1F6F6B]'
                    }`}
                  >
                    {visitFeedback.text}
                  </p>
                )}

                {eligible && !inDischargeQueue && (
                  <button
                    type="button"
                    onClick={handleConfirmDischarge}
                    className="w-full py-2.5 min-h-[44px] rounded-lg border border-[#1F6F6B] text-[#1F6F6B] bg-[#F0FDFA] text-sm font-semibold hover:bg-[#CCFBF1] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                  >
                    Confirm Discharge Readiness ({streak}d streak)
                  </button>
                )}
                {inDischargeQueue && (
                  <p className="text-xs font-medium text-[#1F6F6B]">
                    Confirmed for discharge. Only Admin staff can execute discharge.
                  </p>
                )}

                {!showDeceasedConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeceasedConfirm(true)}
                    className="w-full py-2 min-h-[44px] rounded-lg border border-[#E7E5E0] text-[#991B1B] text-xs font-medium hover:bg-[#FEF2F2] hover:border-[#B91C1C] cursor-pointer"
                  >
                    Record Deceased Outcome
                  </button>
                ) : (
                  <div className="p-3 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] space-y-2.5">
                    <p className="text-xs font-semibold text-[#991B1B]">
                      Confirm marking {patient.name} (Room {patient.roomNumber}) as deceased. This frees the room and cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeceasedConfirm(false)}
                        className="flex-1 py-2 min-h-[40px] rounded-lg border border-[#E7E5E0] bg-white text-xs font-medium text-[#1F2933] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeceased}
                        className="flex-1 py-2 min-h-[40px] rounded-lg bg-[#B91C1C] text-white text-xs font-semibold hover:bg-[#991B1B] cursor-pointer"
                      >
                        Confirm Deceased
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADMIN DISCHARGE */}
            {currentRole === 'admin' && (
              <div className="space-y-2 pt-3 border-t border-[#E7E5E0]">
                <span className="caption-label text-[#6B7680] font-semibold block">
                  Admin Discharge Control
                </span>
                {inDischargeQueue ? (
                  !showDischargeConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDischargeConfirm(true)}
                      className="w-full py-2.5 min-h-[44px] rounded-lg bg-[#1F6F6B] text-white text-sm font-semibold hover:bg-[#175552] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                    >
                      Execute Discharge &amp; Free Room
                    </button>
                  ) : (
                    <div className="p-3 rounded-lg border border-[#1F6F6B] bg-[#F0FDFA] space-y-2.5">
                      <p className="text-xs font-semibold text-[#1F2933]">
                        Confirm discharging {patient.name} from Room {patient.roomNumber}. The room will become vacant.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDischargeConfirm(false)}
                          className="flex-1 py-2 min-h-[40px] rounded-lg border border-[#E7E5E0] bg-white text-xs font-medium text-[#1F2933] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteDischarge}
                          className="flex-1 py-2 min-h-[40px] rounded-lg bg-[#1F6F6B] text-white text-xs font-semibold hover:bg-[#175552] cursor-pointer"
                        >
                          Confirm Discharge
                        </button>
                      </div>
                    </div>
                  )
                ) : eligible ? (
                  <p className="text-xs text-[#6B7680]">
                    Eligible ({streak}d streak), awaiting Doctor confirmation before Admin can execute discharge.
                  </p>
                ) : (
                  <p className="text-xs text-[#6B7680]">
                    Not eligible for discharge (requires 3 consecutive fever-free days).
                  </p>
                )}
              </div>
            )}

            {currentRole === 'nurse' && (
              <p className="text-xs text-[#6B7680] pt-2 border-t border-[#E7E5E0]">
                Only a Doctor can record visits. Only Admin staff can discharge.
              </p>
            )}
          </div>
        )}

        {/* Temperature History */}
        <div className="space-y-2 pt-3 border-t border-[#E7E5E0]">
          <span className="caption-label text-[#6B7680] font-semibold block">
            Temperature History ({readings.length})
          </span>
          {readings.length === 0 ? (
            <p className="text-xs text-[#6B7680]">No temperature readings recorded yet.</p>
          ) : (
            <div className="border border-[#E7E5E0] rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E7E5E0] text-[#6B7680]">
                  <tr>
                    <th className="text-left py-2 px-2.5 font-medium">Date</th>
                    <th className="text-left py-2 px-2.5 font-medium">Reading</th>
                    <th className="text-left py-2 px-2.5 font-medium">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E0]">
                  {readings.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-2.5 font-mono tabular-nums text-[#1F2933]">
                        {formatDate(r.date)}
                      </td>
                      <td
                        className={`py-2 px-2.5 font-mono tabular-nums font-semibold ${
                          hasFever(r.temperature) ? 'text-[#B91C1C]' : 'text-[#284732]'
                        }`}
                      >
                        {formatTemp(r.temperature)}
                        {r.corrected ? ' (corrected)' : ''}
                      </td>
                      <td className="py-2 px-2.5 text-[#6B7680]">{r.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visit History */}
        <div className="space-y-2 pt-3 border-t border-[#E7E5E0]">
          <span className="caption-label text-[#6B7680] font-semibold block">
            Doctor Visit History ({visits.length})
          </span>
          {visits.length === 0 ? (
            <p className="text-xs text-[#6B7680]">No doctor visits recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {visits.map((v) => (
                <div key={v.id} className="p-2.5 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#6B7680]">
                    <span className="font-mono tabular-nums">{formatDate(v.date)}</span>
                    <span>{v.recordedBy}</span>
                  </div>
                  <p className="text-[#1F2933]">{v.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
