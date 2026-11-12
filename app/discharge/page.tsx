'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/app/lib/context';
import { calculateFeverFreeStreak } from '@/app/lib/logic';
import Navbar from '@/app/components/Navbar';

export default function DischargePage() {
  const { role, state, getDischargeEligible, getPatientReadings, executeDischarge } = useApp();
  const [processing, setProcessing] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Access denied for non-admin
  if (role !== 'admin') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
            <p className="text-slate-500 mb-6">
              The Discharge Queue is only accessible to administrators.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Patients confirmed by doctor (in dischargeQueue)
  const confirmedPatients = state.dischargeQueue
    .map((pid) => state.patients.find((p) => p.id === pid))
    .filter((p) => p && p.status === 'admitted');

  // Patients eligible for discharge but NOT yet confirmed
  const eligiblePatients = getDischargeEligible().filter(
    (p) => !state.dischargeQueue.includes(p.id)
  );

  const handleExecuteDischarge = (patientId: string, patientName: string) => {
    setProcessing(patientId);
    try {
      executeDischarge(patientId, 'Admin');
      setSuccessMsg(`${patientName} has been successfully discharged.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      // handle error silently
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Discharge Queue</h1>
          <p className="text-sm text-slate-500 mb-6">
            Manage patient discharges. Only patients confirmed by a doctor can be discharged.
          </p>

          {/* Success notification */}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium flex items-center gap-2">
              <span>✅</span> {successMsg}
            </div>
          )}

          {/* Section 1: Confirmed – Ready for Discharge */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              Confirmed by Doctor — Ready for Discharge
            </h2>

            {confirmedPatients.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
                No patients are currently confirmed for discharge.
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedPatients.map((patient) => {
                  if (!patient) return null;
                  const readings = getPatientReadings(patient.id);
                  const streak = calculateFeverFreeStreak(readings, state.currentDate);

                  return (
                    <div
                      key={patient.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                            Room {patient.roomNumber}
                          </span>
                          <span className="font-semibold text-slate-800">{patient.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            ✓ Doctor Confirmed
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Fever-free streak: <span className="font-semibold text-green-600">{streak} days</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleExecuteDischarge(patient.id, patient.name)}
                        disabled={processing === patient.id}
                        className="px-5 py-3 min-h-12 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm whitespace-nowrap"
                      >
                        {processing === patient.id ? 'Processing…' : 'Execute Discharge'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Eligible but Not Yet Confirmed */}
          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              Eligible but Not Yet Confirmed
            </h2>

            {eligiblePatients.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
                No additional patients are currently eligible for discharge.
              </div>
            ) : (
              <div className="space-y-3">
                {eligiblePatients.map((patient) => {
                  const readings = getPatientReadings(patient.id);
                  const streak = calculateFeverFreeStreak(readings, state.currentDate);

                  return (
                    <div
                      key={patient.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                            Room {patient.roomNumber}
                          </span>
                          <span className="font-semibold text-slate-800">{patient.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            ⏳ Awaiting Doctor Confirmation
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Fever-free streak: <span className="font-semibold text-green-600">{streak} days</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 italic">
                        Requires doctor visit with discharge confirmation
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Summary */}
          <div className="mt-8 p-4 bg-slate-100 rounded-lg text-sm text-slate-500 text-center">
            {confirmedPatients.length} ready for discharge · {eligiblePatients.length} awaiting confirmation
          </div>
        </div>
      </main>
    </>
  );
}
