'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

  const [showDeceasedConfirm, setShowDeceasedConfirm] = useState(false);

  useEffect(() => {
    setTempInput('');
    setTempFeedback(null);
    setShowCorrectForm(false);
    setCorrectInput('');
    setCorrectReason('');
    setVisitNotes('');
    setVisitFeedback(null);
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
      <div className="p-6 text-sm text-[#5c5b57]">
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
      ? `${celsiusToFahrenheit(celsius).toFixed(1)}°F`
      : `${celsius.toFixed(1)}°C`;

  const minDisplay = temperatureUnit === 'F' ? celsiusToFahrenheit(TEMP_MIN_C) : TEMP_MIN_C;
  const maxDisplay = temperatureUnit === 'F' ? celsiusToFahrenheit(TEMP_MAX_C) : TEMP_MAX_C;

  const handleRecordTemp = (e: React.FormEvent) => {
    e.preventDefault();
    setTempFeedback(null);

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
    if (!todayReading) return;
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
      staffName.trim() || (currentRole === 'doctor' ? 'Dr. Attending' : 'Admin Staff'),
      currentRole,
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
      <div className="p-5 border-b border-[#e2e0d8] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded bg-[#fafaf7] border border-[#e2e0d8] text-[#141413]">
              Room {String(patient.roomNumber).padStart(2, '0')}
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                patient.status === 'admitted'
                  ? 'border-[#4d7c5b] bg-[#e6f0e8] text-[#284732]'
                  : patient.status === 'discharged'
                  ? 'border-[#0f766e] bg-[#f0fdfa] text-[#0f766e]'
                  : 'border-[#b91c1c] bg-[#fef2f2] text-[#991b1b]'
              }`}
            >
              {patient.status}
            </span>
            {!isStandalonePage && (
              <Link
                href={`/patient/${patient.id}`}
                className="text-xs text-[#0f766e] underline hover:text-[#0d625b]"
              >
                Full view
              </Link>
            )}
          </div>
          <h2 className="font-serif-heading text-2xl font-semibold text-[#141413] mt-1.5">
            {patient.name}
          </h2>
          <p className="text-xs text-[#5c5b57] font-mono tabular-nums mt-0.5">
            Admitted {formatDate(patient.admissionDate)}
            {patient.dischargeDate ? ` • Discharged ${formatDate(patient.dischargeDate)}` : ''}
            {patient.deceasedDate ? ` • Deceased ${formatDate(patient.deceasedDate)}` : ''}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close patient panel"
            className="px-2.5 py-1.5 min-h-[36px] rounded border border-[#e2e0d8] text-xs font-medium text-[#5c5b57] hover:text-[#141413] hover:bg-[#fafaf7] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
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
              className={`p-3 rounded border text-xs ${
                todayReading
                  ? hasFever(todayReading.temperature)
                    ? 'border-[#b91c1c] bg-[#fef2f2] text-[#991b1b]'
                    : 'border-[#4d7c5b] bg-[#e6f0e8] text-[#284732]'
                  : 'border-[#e2e0d8] bg-[#fafaf7] text-[#5c5b57]'
              }`}
            >
              <span className="caption-label block">Temp Today</span>
              <span className="font-mono tabular-nums text-sm font-bold block mt-0.5">
                {todayReading
                  ? `${formatTemp(todayReading.temperature)}${hasFever(todayReading.temperature) ? ' (FEVER)' : ' (Clear)'}`
                  : 'Pending'}
              </span>
            </div>

            <div
              className={`p-3 rounded border text-xs ${
                todayVisit
                  ? 'border-[#4d7c5b] bg-[#e6f0e8] text-[#284732]'
                  : !todayReading
                  ? 'border-dashed border-[#a3a199] bg-[#fafaf7] text-[#5c5b57]'
                  : 'border-[#e2e0d8] bg-[#fafaf7] text-[#141413]'
              }`}
            >
              <span className="caption-label block">Doctor Visit</span>
              <span className="text-sm font-bold block mt-0.5">
                {todayVisit
                  ? 'Visited'
                  : !todayReading
                  ? 'Locked (Awaiting Temp)'
                  : 'Ready for Visit'}
              </span>
            </div>
          </div>
        )}

        {/* 7-day Streak Ribbon */}
        <StreakRibbon
          readings={readings}
          currentDate={state.currentDate}
          temperatureUnit={temperatureUnit}
        />

        {/* Role-specific Actions */}
        {!isAdmitted ? (
          <div className="p-3 rounded border border-[#e2e0d8] bg-[#fafaf7] text-sm text-[#5c5b57]">
            Case closed ({patient.status}). No new clinical entries permitted.
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-[#e2e0d8]">
            {/* NURSE / TEMP ENTRY */}
            {(currentRole === 'nurse' || currentRole === 'doctor' || currentRole === 'admin') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="caption-label text-[#5c5b57] font-semibold">
                    Daily Temperature ({formatDate(state.currentDate)})
                  </span>
                  {todayReading && (currentRole === 'doctor' || currentRole === 'admin') && (
                    <button
                      type="button"
                      onClick={() => setShowCorrectForm((v) => !v)}
                      className="text-xs font-medium text-[#0f766e] underline cursor-pointer"
                    >
                      {showCorrectForm ? 'Cancel correction' : 'Correct reading'}
                    </button>
                  )}
                </div>

                {todayReading ? (
                  <div className="p-3 rounded border border-[#e2e0d8] bg-[#fafaf7] text-xs space-y-1">
                    <p className="font-medium text-[#141413]">
                      Official reading recorded: <span className="font-mono tabular-nums font-bold">{formatTemp(todayReading.temperature)}</span>
                    </p>
                    <p className="text-[#5c5b57]">
                      By {todayReading.recordedBy} at {new Date(todayReading.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {currentRole === 'nurse' && (
                      <p className="text-[#991b1b] font-medium pt-1">
                        One official reading per day. Only a Doctor or Admin can correct an existing reading.
                      </p>
                    )}
                  </div>
                ) : currentRole === 'nurse' ? (
                  <form onSubmit={handleRecordTemp} className="space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={tempInput}
                        onChange={(e) => setTempInput(e.target.value)}
                        placeholder={`Temp °${temperatureUnit} (${minDisplay}–${maxDisplay})`}
                        aria-label={`Temperature in degrees ${temperatureUnit}`}
                        className="flex-1 font-mono tabular-nums px-3 py-2.5 min-h-[44px] rounded border border-[#e2e0d8] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 min-h-[44px] rounded bg-[#0f766e] text-white text-sm font-medium hover:bg-[#0d625b] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                      >
                        Record Temp
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-[#5c5b57]">
                    Awaiting Nurse to record today&apos;s temperature.
                  </p>
                )}

                {showCorrectForm && todayReading && (currentRole === 'doctor' || currentRole === 'admin') && (
                  <form onSubmit={handleCorrectTemp} className="p-3 rounded border border-[#e2e0d8] bg-[#fafaf7] space-y-2.5">
                    <p className="text-xs font-semibold text-[#141413]">
                      Correct Today&apos;s Temperature (audited)
                    </p>
                    <input
                      type="number"
                      step="0.1"
                      value={correctInput}
                      onChange={(e) => setCorrectInput(e.target.value)}
                      placeholder={`New temp °${temperatureUnit}`}
                      className="w-full font-mono tabular-nums px-3 py-2 min-h-[40px] rounded border border-[#e2e0d8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    />
                    <input
                      type="text"
                      value={correctReason}
                      onChange={(e) => setCorrectReason(e.target.value)}
                      placeholder="Reason for correction (required)"
                      className="w-full px-3 py-2 min-h-[40px] rounded border border-[#e2e0d8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 min-h-[40px] rounded bg-[#141413] text-white text-xs font-semibold hover:bg-[#2c2c2a] cursor-pointer"
                    >
                      Save Correction
                    </button>
                  </form>
                )}

                {tempFeedback && (
                  <p
                    className={`text-xs font-medium ${
                      tempFeedback.tone === 'error' ? 'text-[#991b1b]' : 'text-[#0f766e]'
                    }`}
                  >
                    {tempFeedback.text}
                  </p>
                )}
              </div>
            )}

            {/* DOCTOR VISIT & OUTCOMES */}
            {currentRole === 'doctor' && (
              <div className="space-y-3 pt-3 border-t border-[#e2e0d8]">
                <span className="caption-label text-[#5c5b57] font-semibold block">
                  Doctor Visit &amp; Clinical Actions
                </span>

                {todayVisit ? (
                  <div className="p-3 rounded border border-[#4d7c5b] bg-[#e6f0e8] text-xs space-y-1">
                    <p className="font-semibold text-[#284732]">
                      Visited today by {todayVisit.recordedBy}
                    </p>
                    <p className="text-[#141413]">{todayVisit.notes}</p>
                  </div>
                ) : (
                  <form onSubmit={handleRecordVisit} className="space-y-2.5">
                    {!todayReading && (
                      <div className="p-2.5 rounded border border-dashed border-[#b91c1c] bg-[#fef2f2] text-xs font-medium text-[#991b1b]">
                        Temperature not taken yet. Visit recording is locked until a Nurse records today&apos;s temperature.
                      </div>
                    )}
                    <textarea
                      rows={2}
                      disabled={!todayReading}
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder="Treatment & clinical notes..."
                      className="w-full px-3 py-2 rounded border border-[#e2e0d8] text-sm disabled:bg-[#fafaf7] disabled:text-[#8f8d87] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    />
                    <button
                      type="submit"
                      disabled={!todayReading}
                      className="w-full py-2.5 min-h-[44px] rounded bg-[#0f766e] text-white text-sm font-medium hover:bg-[#0d625b] disabled:bg-[#d4d2c9] disabled:text-[#5c5b57] disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    >
                      Record Visit
                    </button>
                  </form>
                )}

                {visitFeedback && (
                  <p
                    className={`text-xs font-medium ${
                      visitFeedback.tone === 'error' ? 'text-[#991b1b]' : 'text-[#0f766e]'
                    }`}
                  >
                    {visitFeedback.text}
                  </p>
                )}

                {/* Confirm discharge readiness */}
                {eligible && !inDischargeQueue && (
                  <button
                    type="button"
                    onClick={handleConfirmDischarge}
                    className="w-full py-2.5 min-h-[44px] rounded border border-[#0f766e] text-[#0f766e] bg-[#f0fdfa] text-sm font-semibold hover:bg-[#ccfbf1] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                  >
                    Confirm Discharge Readiness ({streak}d streak)
                  </button>
                )}
                {inDischargeQueue && (
                  <p className="text-xs font-medium text-[#0f766e]">
                    Confirmed for discharge — awaiting Admin execution.
                  </p>
                )}

                {/* Record Deceased */}
                {!showDeceasedConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeceasedConfirm(true)}
                    className="w-full py-2 min-h-[40px] rounded border border-[#e2e0d8] text-[#991b1b] text-xs font-medium hover:bg-[#fef2f2] hover:border-[#b91c1c] cursor-pointer"
                  >
                    Record Deceased Outcome
                  </button>
                ) : (
                  <div className="p-3 rounded border border-[#b91c1c] bg-[#fef2f2] space-y-2.5">
                    <p className="text-xs font-semibold text-[#991b1b]">
                      Confirm marking {patient.name} (Room {patient.roomNumber}) as deceased? This frees the room and cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeceasedConfirm(false)}
                        className="flex-1 py-2 rounded border border-[#e2e0d8] bg-white text-xs font-medium text-[#141413] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeceased}
                        className="flex-1 py-2 rounded bg-[#b91c1c] text-white text-xs font-semibold hover:bg-[#991b1b] cursor-pointer"
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
              <div className="space-y-2 pt-3 border-t border-[#e2e0d8]">
                <span className="caption-label text-[#5c5b57] font-semibold block">
                  Admin Discharge Control
                </span>
                {inDischargeQueue ? (
                  <button
                    type="button"
                    onClick={handleExecuteDischarge}
                    className="w-full py-2.5 min-h-[44px] rounded bg-[#0f766e] text-white text-sm font-semibold hover:bg-[#0d625b] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                  >
                    Execute Discharge &amp; Free Room
                  </button>
                ) : eligible ? (
                  <p className="text-xs text-[#5c5b57]">
                    Patient is eligible ({streak}d streak), awaiting Doctor confirmation before Admin can execute discharge.
                  </p>
                ) : (
                  <p className="text-xs text-[#5c5b57]">
                    Not eligible for discharge (requires 3 consecutive fever-free days).
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Temperature History */}
        <div className="space-y-2 pt-3 border-t border-[#e2e0d8]">
          <span className="caption-label text-[#5c5b57] font-semibold block">
            Temperature History ({readings.length})
          </span>
          {readings.length === 0 ? (
            <p className="text-xs text-[#5c5b57]">No temperature readings recorded yet.</p>
          ) : (
            <div className="border border-[#e2e0d8] rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#fafaf7] border-b border-[#e2e0d8] text-[#5c5b57]">
                  <tr>
                    <th className="text-left py-2 px-2.5 font-medium">Date</th>
                    <th className="text-left py-2 px-2.5 font-medium">Reading</th>
                    <th className="text-left py-2 px-2.5 font-medium">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e0d8]">
                  {readings.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-2.5 font-mono tabular-nums text-[#141413]">
                        {formatDate(r.date)}
                      </td>
                      <td
                        className={`py-2 px-2.5 font-mono tabular-nums font-semibold ${
                          hasFever(r.temperature) ? 'text-[#b91c1c]' : 'text-[#284732]'
                        }`}
                      >
                        {formatTemp(r.temperature)}
                        {r.corrected ? ' (corrected)' : ''}
                      </td>
                      <td className="py-2 px-2.5 text-[#5c5b57]">{r.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visit History */}
        <div className="space-y-2 pt-3 border-t border-[#e2e0d8]">
          <span className="caption-label text-[#5c5b57] font-semibold block">
            Doctor Visit History ({visits.length})
          </span>
          {visits.length === 0 ? (
            <p className="text-xs text-[#5c5b57]">No doctor visits recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {visits.map((v) => (
                <div key={v.id} className="p-2.5 rounded border border-[#e2e0d8] bg-[#fafaf7] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#5c5b57]">
                    <span className="font-mono tabular-nums">{formatDate(v.date)}</span>
                    <span>{v.recordedBy}</span>
                  </div>
                  <p className="text-[#141413]">{v.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

