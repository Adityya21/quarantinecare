'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import Navbar from '@/app/components/Navbar';
import {
  hasFever,
  isValidTemperature,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  calculateFeverFreeStreak,
  isEligibleForDischarge,
  formatDate,
  FEVER_THRESHOLD_C,
  TEMP_MIN_C,
  TEMP_MAX_C,
} from '@/app/lib/logic';

function PatientDetailContent() {
  const params = useParams();
  const router = useRouter();
  const {
    state,
    role,
    temperatureUnit: tempUnit,
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

  const patientId = params.id as string;

  const [showTempForm, setShowTempForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showDeceasedConfirm, setShowDeceasedConfirm] = useState(false);

  const [tempValue, setTempValue] = useState('');
  const [tempMessage, setTempMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const [correctionReason, setCorrectionReason] = useState('');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionReadingId, setCorrectionReadingId] = useState('');

  const [visitNotes, setVisitNotes] = useState('');
  const [visitMessage, setVisitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect if no role
  React.useEffect(() => {
    if (!role) router.push('/');
  }, [role, router]);

  const patient = useMemo(
    () => state.patients.find((p) => p.id === patientId),
    [state.patients, patientId]
  );

  const readings = useMemo(() => getPatientReadings(patientId), [patientId, state.temperatureReadings]);
  const visits = useMemo(() => getPatientVisits(patientId), [patientId, state.doctorVisits]);
  const todayReading = getTodayReading(patientId);
  const todayVisit = getTodayVisit(patientId);
  const streak = useMemo(
    () => calculateFeverFreeStreak(readings, state.currentDate),
    [readings, state.currentDate]
  );
  const eligible = useMemo(
    () => isEligibleForDischarge(readings, state.currentDate),
    [readings, state.currentDate]
  );
  const inDischargeQueue = state.dischargeQueue.includes(patientId);

  const displayTemp = (tempC: number) => {
    if (tempUnit === 'F') return `${celsiusToFahrenheit(tempC).toFixed(1)}°F`;
    return `${tempC.toFixed(1)}°C`;
  };

  const getPersonName = () => {
    if (!role) return 'Unknown';
    const names: Record<string, string> = {
      nurse: 'Nurse Demo',
      doctor: 'Dr. Demo',
      admin: 'Admin Demo',
    };
    return names[role];
  };

  const handleRecordTemp = () => {
    const val = parseFloat(tempValue);
    if (isNaN(val)) {
      setTempMessage({ type: 'error', text: 'Please enter a valid number.' });
      return;
    }

    // Convert if in Fahrenheit mode
    const celsius = tempUnit === 'F' ? fahrenheitToCelsius(val) : val;

    if (!isValidTemperature(celsius)) {
      setTempMessage({
        type: 'error',
        text: `Temperature must be between ${displayTemp(TEMP_MIN_C)} and ${displayTemp(TEMP_MAX_C)}.`,
      });
      return;
    }

    const result = recordTemperature(patientId, celsius, getPersonName());
    if (result.success) {
      setTempMessage({ type: 'success', text: 'Temperature recorded successfully.' });
      setTempValue('');
      setShowTempForm(false);
    } else {
      setTempMessage({
        type: 'warning',
        text: result.error ?? 'Could not record temperature.',
      });
    }
  };

  const handleCorrectTemp = () => {
    const val = parseFloat(correctionValue);
    if (isNaN(val)) return;

    const celsius = tempUnit === 'F' ? fahrenheitToCelsius(val) : val;
    if (!isValidTemperature(celsius)) return;
    if (!correctionReason.trim()) return;
    if (!role) return;

    correctTemperature(correctionReadingId, celsius, getPersonName(), role, correctionReason);
    setShowCorrectionForm(false);
    setCorrectionValue('');
    setCorrectionReason('');
    setCorrectionReadingId('');
    setTempMessage({ type: 'success', text: 'Temperature corrected successfully.' });
  };

  const handleRecordVisit = () => {
    if (!visitNotes.trim()) {
      setVisitMessage({ type: 'error', text: 'Please enter visit notes.' });
      return;
    }
    const result = recordVisit(patientId, visitNotes, getPersonName());
    if (result.success) {
      setVisitMessage({ type: 'success', text: 'Visit recorded successfully.' });
      setVisitNotes('');
      setShowVisitForm(false);
    } else {
      setVisitMessage({ type: 'error', text: result.error ?? 'Could not record visit.' });
    }
  };

  const handleConfirmDischarge = () => {
    confirmDischarge(patientId, getPersonName());
    setActionMessage({ type: 'success', text: 'Patient confirmed for discharge.' });
  };

  const handleExecuteDischarge = () => {
    executeDischarge(patientId, getPersonName());
    setActionMessage({ type: 'success', text: 'Patient discharged successfully.' });
  };

  const handleRecordDeceased = () => {
    recordDeceased(patientId, getPersonName());
    setShowDeceasedConfirm(false);
    setActionMessage({ type: 'success', text: 'Patient recorded as deceased.' });
  };

  if (!role || !patient) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-slate-500">Patient not found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 min-h-12 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sortedReadings = [...readings].sort((a, b) => b.date.localeCompare(a.date));
  const sortedVisits = [...visits].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-4 text-sm text-teal-600 hover:text-teal-800 cursor-pointer"
        >
          ← Back to Dashboard
        </button>

        {/* Patient header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
              <p className="text-sm text-slate-500">
                Room #{patient.roomNumber} · Admitted {formatDate(patient.admissionDate)}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    patient.status === 'admitted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : patient.status === 'discharged'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                </span>

                {patient.status === 'admitted' && (
                  <>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        todayReading ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      🌡️ {todayReading ? 'Temp Taken' : 'Temp Pending'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        todayVisit ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      👨‍⚕️ {todayVisit ? 'Visited Today' : 'Visit Pending'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Fever-free streak */}
              <div className="text-right">
                <div className="text-3xl font-bold text-teal-700">{streak}</div>
                <div className="text-xs text-slate-500">Fever-Free Days</div>
              </div>
              {eligible && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold animate-pulse">
                  ✅ Eligible for Discharge
                </span>
              )}
              {inDischargeQueue && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                  📋 In Discharge Queue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {tempMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              tempMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : tempMessage.type === 'warning'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {tempMessage.text}
            <button onClick={() => setTempMessage(null)} className="ml-2 font-bold cursor-pointer">
              ×
            </button>
          </div>
        )}
        {visitMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              visitMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {visitMessage.text}
            <button onClick={() => setVisitMessage(null)} className="ml-2 font-bold cursor-pointer">
              ×
            </button>
          </div>
        )}
        {actionMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {actionMessage.text}
            <button onClick={() => setActionMessage(null)} className="ml-2 font-bold cursor-pointer">
              ×
            </button>
          </div>
        )}

        {/* Action buttons */}
        {patient.status === 'admitted' && (
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Nurse: Record Temperature */}
            {(role === 'nurse' || role === 'doctor') && (
              <button
                onClick={() => {
                  setShowTempForm(!showTempForm);
                  setTempMessage(null);
                }}
                className="px-4 py-3 min-h-12 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
              >
                🌡️ Record Temperature
              </button>
            )}

            {/* Doctor: Record Visit */}
            {role === 'doctor' && (
              <button
                onClick={() => {
                  if (!todayReading) {
                    setVisitMessage({
                      type: 'error',
                      text: 'Cannot record visit: No temperature reading taken today. Temperature must be recorded first.',
                    });
                    return;
                  }
                  setShowVisitForm(!showVisitForm);
                  setVisitMessage(null);
                }}
                className={`px-4 py-3 min-h-12 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  todayReading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                👨‍⚕️ Record Visit
              </button>
            )}

            {/* Doctor: Confirm Discharge */}
            {role === 'doctor' && eligible && !inDischargeQueue && (
              <button
                onClick={handleConfirmDischarge}
                className="px-4 py-3 min-h-12 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                ✅ Confirm Discharge
              </button>
            )}

            {/* Doctor: Record Deceased */}
            {role === 'doctor' && (
              <button
                onClick={() => setShowDeceasedConfirm(true)}
                className="px-4 py-3 min-h-12 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                ⚠️ Record Deceased
              </button>
            )}

            {/* Admin: Execute Discharge */}
            {role === 'admin' && inDischargeQueue && (
              <button
                onClick={handleExecuteDischarge}
                className="px-4 py-3 min-h-12 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
              >
                📋 Execute Discharge
              </button>
            )}
          </div>
        )}

        {/* Temperature Recording Form */}
        {showTempForm && patient.status === 'admitted' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Record Temperature</h3>

            {todayReading && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ A reading already exists for today: <strong>{displayTemp(todayReading.temperature)}</strong> recorded
                by {todayReading.recordedBy} at {new Date(todayReading.recordedAt).toLocaleTimeString()}.
                {(role === 'doctor' || role === 'admin') && (
                  <button
                    onClick={() => {
                      setShowCorrectionForm(true);
                      setCorrectionReadingId(todayReading.id);
                      setShowTempForm(false);
                    }}
                    className="ml-2 text-blue-600 underline cursor-pointer"
                  >
                    Correct this reading
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">
                  Temperature (°{tempUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder={tempUnit === 'C' ? 'e.g. 36.5' : 'e.g. 97.7'}
                  className="w-full px-3 py-2 min-h-12 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <button
                onClick={handleRecordTemp}
                className="px-4 py-2 min-h-12 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowTempForm(false);
                  setTempValue('');
                }}
                className="px-4 py-2 min-h-12 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Correction Form */}
        {showCorrectionForm && (
          <div className="bg-white rounded-xl border border-blue-200 p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Correct Temperature Reading</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  New Temperature (°{tempUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={correctionValue}
                  onChange={(e) => setCorrectionValue(e.target.value)}
                  className="w-full px-3 py-2 min-h-12 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Reason for Correction</label>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Thermometer reading error"
                  className="w-full px-3 py-2 min-h-12 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCorrectTemp}
                  disabled={!correctionValue || !correctionReason.trim()}
                  className="px-4 py-2 min-h-12 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Correction
                </button>
                <button
                  onClick={() => {
                    setShowCorrectionForm(false);
                    setCorrectionValue('');
                    setCorrectionReason('');
                  }}
                  className="px-4 py-2 min-h-12 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visit Recording Form */}
        {showVisitForm && patient.status === 'admitted' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Record Visit Notes</h3>
            <textarea
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              placeholder="Enter visit notes..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleRecordVisit}
                className="px-4 py-2 min-h-12 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Save Visit
              </button>
              <button
                onClick={() => {
                  setShowVisitForm(false);
                  setVisitNotes('');
                }}
                className="px-4 py-2 min-h-12 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Deceased Confirmation Dialog */}
        {showDeceasedConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold text-red-700 mb-2">⚠️ Record Patient as Deceased</h3>
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to record <strong>{patient.name}</strong> (Room #{patient.roomNumber}) as
                deceased? <strong>This action cannot be undone.</strong>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRecordDeceased}
                  className="px-4 py-3 min-h-12 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Yes, Record Deceased
                </button>
                <button
                  onClick={() => setShowDeceasedConfirm(false)}
                  className="px-4 py-3 min-h-12 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Temperature History */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">🌡️ Temperature History</h2>
          {sortedReadings.length === 0 ? (
            <p className="text-sm text-slate-400">No temperature readings recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Date</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Temperature</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Fever</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Recorded By</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReadings.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-slate-50 ${hasFever(r.temperature) ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-2 px-2">{formatDate(r.date)}</td>
                      <td className="py-2 px-2 font-mono font-medium">{displayTemp(r.temperature)}</td>
                      <td className="py-2 px-2">
                        {hasFever(r.temperature) ? (
                          <span className="text-red-600 font-semibold">🔴 Fever</span>
                        ) : (
                          <span className="text-emerald-600">✅ Normal</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-slate-600">{r.recordedBy}</td>
                      <td className="py-2 px-2 text-slate-500 text-xs">
                        {r.corrected && (
                          <span className="text-blue-600">
                            Corrected by {r.correctedBy} ({r.correctionReason})
                          </span>
                        )}
                        {(role === 'doctor' || role === 'admin') && !r.corrected && (
                          <button
                            onClick={() => {
                              setCorrectionReadingId(r.id);
                              setShowCorrectionForm(true);
                            }}
                            className="text-blue-500 hover:underline cursor-pointer"
                          >
                            Correct
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visit History */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">👨‍⚕️ Visit History</h2>
          {sortedVisits.length === 0 ? (
            <p className="text-sm text-slate-400">No doctor visits recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Date</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Doctor</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVisits.map((v) => (
                    <tr key={v.id} className="border-b border-slate-50">
                      <td className="py-2 px-2">{formatDate(v.date)}</td>
                      <td className="py-2 px-2 text-slate-600">{v.recordedBy}</td>
                      <td className="py-2 px-2 text-slate-600">{v.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Loading patient...</div>}>
      <PatientDetailContent />
    </Suspense>
  );
}
