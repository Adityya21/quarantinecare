'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Toast, { type ToastMessage } from '@/app/components/Toast';
import { useApp } from '@/app/lib/context';
import { calculateFeverFreeStreak } from '@/app/lib/logic';

export default function DischargeQueuePage() {
  const {
    role,
    state,
    getPatientReadings,
    getDischargeEligible,
    executeDischarge,
  } = useApp();

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = (text: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
    const id = Date.now().toString();
    setToast({ id, text, tone });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  };

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white border border-[#e2e0d8] rounded-lg p-8 space-y-3">
            <span className="caption-label text-[#991b1b] font-semibold">Access Restricted</span>
            <h1 className="font-serif-heading text-2xl font-semibold text-[#141413]">
              Discharge Queue is restricted to Admin staff
            </h1>
            <p className="text-sm text-[#5c5b57]">
              Use the Switch Role control in the top bar to switch to Admin or return to the Ward Board.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-2 px-4 py-2.5 rounded bg-[#0f766e] text-white text-sm font-medium"
            >
              Return to Ward Board
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const confirmedPatients = state.patients.filter(
    (p) => p.status === 'admitted' && state.dischargeQueue.includes(p.id),
  );

  const eligibleUnconfirmed = getDischargeEligible().filter(
    (p) => !state.dischargeQueue.includes(p.id),
  );

  const handleDischarge = (patientId: string, name: string, roomNumber: number) => {
    const res = executeDischarge(patientId, 'Admin Staff');
    if (res.success) {
      notify(`Discharged ${name} from Room ${roomNumber}. Room is now vacant.`, 'success');
    } else {
      notify(res.error ?? 'Could not execute discharge.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-1">
          <span className="caption-label text-[#5c5b57] font-semibold">
            Bed Turnover &amp; Patient Release
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-[34px] font-semibold text-[#141413]">
            Discharge Queue
          </h1>
          <p className="text-sm text-[#5c5b57]">
            Admin executes discharge for patients confirmed by a Doctor after 3 consecutive fever-free days.
          </p>
        </header>

        {/* Section 1: Confirmed by Doctor */}
        <section className="bg-white border border-[#e2e0d8] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e0d8] flex items-center justify-between bg-[#fafaf7]">
            <h2 className="text-sm font-semibold text-[#141413]">
              Confirmed by Doctor — Ready to Discharge
            </h2>
            <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded bg-[#0f766e] text-white">
              {confirmedPatients.length}
            </span>
          </div>

          {confirmedPatients.length === 0 ? (
            <p className="p-5 text-sm text-[#5c5b57]">
              No doctor-confirmed patients are currently waiting for discharge execution.
            </p>
          ) : (
            <div className="divide-y divide-[#e2e0d8]">
              {confirmedPatients.map((p) => {
                const streak = calculateFeverFreeStreak(
                  getPatientReadings(p.id),
                  state.currentDate,
                );
                return (
                  <div
                    key={p.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded border border-[#e2e0d8] bg-[#fafaf7]">
                          Room {String(p.roomNumber).padStart(2, '0')}
                        </span>
                        <span className="font-semibold text-[#141413] text-sm">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#5c5b57] font-mono tabular-nums mt-1">
                        Fever-free streak: {streak} days • Confirmed by Doctor
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDischarge(p.id, p.name, p.roomNumber)}
                      className="px-4 py-2.5 min-h-[42px] rounded bg-[#0f766e] text-white text-sm font-semibold hover:bg-[#0d625b] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    >
                      Execute Discharge
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Eligible but awaiting Doctor confirmation */}
        <section className="bg-white border border-[#e2e0d8] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e0d8] flex items-center justify-between bg-[#fafaf7]">
            <h2 className="text-sm font-semibold text-[#141413]">
              Eligible (3+ Clear Days) — Awaiting Doctor Confirmation
            </h2>
            <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded border border-[#e2e0d8] bg-white text-[#141413]">
              {eligibleUnconfirmed.length}
            </span>
          </div>

          {eligibleUnconfirmed.length === 0 ? (
            <p className="p-5 text-sm text-[#5c5b57]">
              All discharge-eligible patients have already been confirmed by a Doctor.
            </p>
          ) : (
            <div className="divide-y divide-[#e2e0d8]">
              {eligibleUnconfirmed.map((p) => {
                const streak = calculateFeverFreeStreak(
                  getPatientReadings(p.id),
                  state.currentDate,
                );
                return (
                  <div
                    key={p.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded border border-[#e2e0d8] bg-[#fafaf7]">
                          Room {String(p.roomNumber).padStart(2, '0')}
                        </span>
                        <span className="font-semibold text-[#141413] text-sm">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#5c5b57] font-mono tabular-nums mt-1">
                        Fever-free streak: {streak} days
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded border border-[#e2e0d8] bg-[#fafaf7] text-[#5c5b57]">
                      Awaiting Doctor Confirmation
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
