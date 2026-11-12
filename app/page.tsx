'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import BrandLogo from '@/app/components/BrandLogo';
import { useApp } from '@/app/lib/context';
import {
  MAX_CAPACITY,
  hasFever,
  isEligibleForDischarge,
} from '@/app/lib/logic';
import type { Role } from '@/app/lib/types';

export default function RoleSelectPage() {
  const router = useRouter();
  const {
    state,
    setRole,
    advanceDay,
    getTodayReading,
    getTodayVisit,
    getPatientReadings,
    getOccupancy,
    getPendingTemps,
    getPendingVisits,
    getDischargeEligible,
    getOutcomes,
  } = useApp();

  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('qc-landing-tour-dismissed');
      if (dismissed !== 'true') {
        setShowTour(true);
      }
    } catch {
      setShowTour(true);
    }
  }, []);

  const dismissTour = () => {
    setShowTour(false);
    try {
      localStorage.setItem('qc-landing-tour-dismissed', 'true');
    } catch {
      // ignore storage errors
    }
  };

  const restoreTour = () => {
    setShowTour(true);
    try {
      localStorage.removeItem('qc-landing-tour-dismissed');
    } catch {
      // ignore storage errors
    }
  };

  const handleSelectRole = (selected: Role) => {
    setRole(selected);
    router.push('/dashboard');
  };

  const occupancy = getOccupancy();
  const pendingTempsCount = getPendingTemps().length;
  const pendingVisitsCount = getPendingVisits().length;
  const eligibleCount = getDischargeEligible().length;
  const tempsTakenCount = Math.max(0, occupancy - pendingTempsCount);
  const visitsDoneCount = Math.max(0, occupancy - pendingVisitsCount);
  const readyForDoctorVisitCount = state.patients.filter(
    (p) => p.status === 'admitted' && Boolean(getTodayReading(p.id)) && !getTodayVisit(p.id),
  ).length;
  const outcomes = getOutcomes();
  const mortalityPct =
    outcomes.mortalityRate !== null ? `${(outcomes.mortalityRate * 100).toFixed(1)}%` : 'N/A';

  const roles: {
    role: Role;
    eyebrow: string;
    title: string;
    description: string;
    can: string;
    cannot: string;
    hint: string;
  }[] = [
    {
      role: 'nurse',
      eyebrow: 'DAILY TEMPERATURE ROUNDS',
      title: 'Nurse',
      description: 'Measure and record one daily temperature per patient.',
      can: 'View patients, record temperatures, run a round.',
      cannot: 'Record visits, discharge, or view outcomes.',
      hint: `${pendingTempsCount} ${pendingTempsCount === 1 ? 'room' : 'rooms'} awaiting a temperature`,
    },
    {
      role: 'doctor',
      eyebrow: 'VISITS AND OUTCOMES',
      title: 'Doctor',
      description: 'Review measured patients, log visits and confirm discharges.',
      can: 'Log visits, correct temps with reason, confirm discharge, record deceased.',
      cannot: 'Execute room discharge or view audit log.',
      hint: `${readyForDoctorVisitCount} ${readyForDoctorVisitCount === 1 ? 'room' : 'rooms'} measured and ready for visit`,
    },
    {
      role: 'admin',
      eyebrow: 'DISCHARGES AND AUDIT',
      title: 'Admin staff',
      description: 'Free beds via discharge, track mortality and audit actions.',
      can: 'Execute confirmed discharges, view occupancy, outcomes and audit log.',
      cannot: 'Record daily temperatures or doctor visits.',
      hint: `${eligibleCount} ${eligibleCount === 1 ? 'patient' : 'patients'} eligible for discharge`,
    },
  ];

  const roomMap = useMemo(() => {
    const map = new Map<number, (typeof state.patients)[number] | null>();
    for (let r = 1; r <= MAX_CAPACITY; r++) {
      map.set(r, null);
    }
    for (const p of state.patients) {
      if (p.status === 'admitted') {
        map.set(p.roomNumber, p);
      }
    }
    return map;
  }, [state.patients]);

  const renderPreviewCell = (roomNum: number) => {
    const patient = roomMap.get(roomNum) ?? null;
    if (!patient) {
      return (
        <div
          key={roomNum}
          className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-[2px] border border-dashed border-[#D4D2C9] bg-[#FAFAF8]"
        />
      );
    }

    const reading = getTodayReading(patient.id);
    const visit = getTodayVisit(patient.id);
    const fever = reading ? hasFever(reading.temperature) : false;
    const eligible = isEligibleForDischarge(
      getPatientReadings(patient.id),
      state.currentDate,
    );

    return (
      <div
        key={roomNum}
        className="relative w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-[2px] border border-[#E7E5E0] bg-white p-[2px] flex flex-col justify-between"
      >
        {eligible && (
          <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 bg-[#1F6F6B] rounded-[1px]" />
        )}
        <div
          className={`h-[6px] sm:h-[7px] w-full rounded-[1px] border ${
            !reading
              ? 'border-[#D97706] bg-transparent'
              : fever
              ? 'border-[#B91C1C] bg-[#FEF2F2]'
              : 'border-[#4D7C5B] bg-[#E6F0E8]'
          }`}
        />
        <div
          className={`h-[6px] sm:h-[7px] w-full rounded-[1px] border ${
            visit
              ? 'border-[#4D7C5B] bg-[#E6F0E8]'
              : !reading
              ? 'border-[#D4D2C9] bg-[#FAFAF8]'
              : 'border-[#D97706] bg-transparent'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1F2933] flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E7E5E0]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={26} />
            <span className="font-serif-heading text-lg font-semibold text-[#1F2933]">
              QuarantineCare
            </span>
          </div>
          <nav aria-label="Landing navigation" className="flex items-center gap-4 text-xs font-medium">
            <Link
              href="/how-it-works"
              className="text-[#1F6F6B] hover:underline py-2 px-1 rounded focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              How it works
            </Link>
            <button
              type="button"
              onClick={() => {
                restoreTour();
                document.getElementById('quick-tour')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[#6B7680] hover:text-[#1F2933] py-2 px-1 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              Quick tour
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          {/* Two-Column Hero */}
          <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-6 items-center">
            <div className="space-y-3">
              <span className="caption-label text-[#1F6F6B] font-semibold block">
                74-ROOM QUARANTINE AND TREATMENT FACILITY
              </span>
              <h1 className="font-serif-heading text-3xl sm:text-[38px] font-semibold text-[#1F2933] leading-[1.15]">
                Know who has been measured, who has been seen, and who can go home.
              </h1>
              <p className="text-sm sm:text-base text-[#6B7680] max-w-xl">
                Replace paper temperature journals with a live 74-room ward chart that enforces daily sequencing and surfaces discharge readiness.
              </p>
            </div>

            {/* Live Today Snapshot Card */}
            <div className="bg-white border border-[#E7E5E0] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7E5E0] pb-2.5">
                <span className="caption-label text-[#6B7680] font-semibold">Today Snapshot</span>
                <span className="font-mono tabular-nums text-xs text-[#6B7680]">
                  {state.currentDate}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Temperatures taken', count: tempsTakenCount, bar: 'bg-[#4D7C5B]' },
                  { label: 'Doctor visits done', count: visitsDoneCount, bar: 'bg-[#1F2933]' },
                  { label: 'Ready for discharge', count: eligibleCount, bar: 'bg-[#1F6F6B]' },
                ].map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7680] font-medium">{row.label}</span>
                      <span className="font-mono tabular-nums font-semibold text-[#1F2933]">
                        {row.count} / {MAX_CAPACITY}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E7E5E0] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${row.bar} transition-all duration-150`}
                        style={{ width: `${Math.min(100, Math.round((row.count / MAX_CAPACITY) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#E7E5E0] flex items-center justify-between text-xs">
                <span className="text-[#6B7680]">
                  Rooms occupied:{' '}
                  <strong className="font-mono tabular-nums text-[#1F2933]">
                    {occupancy} / {MAX_CAPACITY}
                  </strong>
                </span>
                <span className="text-[#6B7680]">
                  Mortality:{' '}
                  <strong
                    className={`font-mono tabular-nums ${
                      outcomes.isAboveBenchmark ? 'text-[#B91C1C]' : 'text-[#1F2933]'
                    }`}
                  >
                    {mortalityPct}
                  </strong>{' '}
                  (exp. 15%)
                </span>
              </div>
            </div>
          </section>

          {/* Three Equal-Height Role Cards */}
          <section
            aria-label="Select role"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch"
          >
            {roles.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => handleSelectRole(item.role)}
                className="group bg-white border border-[#E7E5E0] hover:border-[#1F6F6B] rounded-xl p-6 text-left transition-colors duration-150 grid grid-rows-[auto_auto_auto_1fr_auto_auto] gap-y-2 h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              >
                <span className="caption-label text-[#1F6F6B] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.eyebrow}
                </span>

                <h2 className="font-serif-heading text-2xl font-semibold text-[#1F2933]">
                  {item.title}
                </h2>

                <p className="text-sm text-[#6B7680] leading-snug">
                  {item.description}
                </p>

                <div className="space-y-1 pt-2 text-xs text-[#6B7680] border-t border-[#E7E5E0] mt-1">
                  <p>
                    <strong className="text-[#1F2933]">Can:</strong> {item.can}
                  </p>
                  <p>
                    <strong className="text-[#1F2933]">Cannot:</strong> {item.cannot}
                  </p>
                </div>

                <p className="font-mono tabular-nums text-xs font-medium text-[#1F2933] pt-1">
                  {item.hint}
                </p>

                <span className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-[#1F6F6B]">
                  <span>Enter as {item.title}</span>
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-[2px]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
              </button>
            ))}
          </section>

          {/* Mini Ward Board Preview */}
          <section
            aria-label="Ward board preview"
            className="bg-white border border-[#E7E5E0] rounded-xl p-5 space-y-3 pointer-events-none select-none"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Wing 1: Rooms 1-37 */}
              <div className="flex-1 flex flex-wrap gap-1.5 content-center">
                {Array.from({ length: 37 }, (_, i) => renderPreviewCell(i + 1))}
              </div>

              {/* Corridor divider */}
              <div className="h-[1px] w-full md:w-[1px] md:h-24 bg-[#E7E5E0] shrink-0" />

              {/* Wing 2: Rooms 38-74 */}
              <div className="flex-1 flex flex-wrap gap-1.5 content-center">
                {Array.from({ length: 37 }, (_, i) => renderPreviewCell(i + 38))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E7E5E0] text-xs text-[#6B7680]">
              <span className="caption-label font-semibold">
                Today&apos;s ward at a glance. Top half: temperature. Bottom half: doctor visit.
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-[1px] border border-[#4D7C5B] bg-[#E6F0E8]" />
                  Done
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-[1px] border border-[#D97706]" />
                  Pending
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-[1px] border border-[#B91C1C] bg-[#FEF2F2]" />
                  Fever
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-[#1F6F6B]" />
                  Eligible
                </span>
              </div>
            </div>
          </section>

          {/* Dismissible Quick Tour */}
          {showTour && (
            <section
              id="quick-tour"
              aria-label="Quick tour"
              className="bg-white border border-[#E7E5E0] rounded-xl p-5 space-y-3 text-xs text-[#6B7680]"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-sm text-[#1F2933]">Quick tour (60 seconds)</h2>
                <button
                  type="button"
                  onClick={dismissTour}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg border border-[#E7E5E0] text-xs font-medium text-[#6B7680] hover:text-[#1F2933] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                >
                  Dismiss
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectRole('nurse')}
                  className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E7E5E0] hover:border-[#1F6F6B] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                >
                  <strong className="text-[#1F2933]">1. Record a temperature as Nurse</strong>
                  <span className="block mt-0.5">Opens Nurse Ward Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRole('doctor')}
                  className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E7E5E0] hover:border-[#1F6F6B] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                >
                  <strong className="text-[#1F2933]">2. Log a visit as Doctor</strong>
                  <span className="block mt-0.5">Opens Doctor Ward Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => advanceDay()}
                  className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E7E5E0] hover:border-[#1F6F6B] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                >
                  <strong className="text-[#1F2933]">3. Advance the day (demo)</strong>
                  <span className="block mt-0.5">Simulates next calendar day</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    router.push('/discharge');
                  }}
                  className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E7E5E0] hover:border-[#1F6F6B] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                >
                  <strong className="text-[#1F2933]">4. Discharge as Admin</strong>
                  <span className="block mt-0.5">Opens Admin Discharge Queue</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E0]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B7680]">
          <span>Demo prototype. Sign-in is not implemented.</span>
          <div className="flex items-center gap-4">
            {!showTour && (
              <button
                type="button"
                onClick={restoreTour}
                className="text-[#6B7680] hover:text-[#1F2933] underline cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              >
                Show tour again
              </button>
            )}
            <Link
              href="/how-it-works"
              className="text-[#1F6F6B] font-medium hover:underline rounded focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              How it works
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
