'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import {
  MAX_CAPACITY,
  hasFever,
  isEligibleForDischarge,
} from '@/app/lib/logic';
import type { Role } from '@/app/lib/types';

const roles: {
  role: Role;
  eyebrow: string;
  title: string;
  description: string;
}[] = [
  {
    role: 'nurse',
    eyebrow: 'DAILY TEMPERATURE ROUNDS',
    title: 'Nurse',
    description:
      'See which rooms still need a temperature today, record readings in a focused round, and avoid duplicate readings.',
  },
  {
    role: 'doctor',
    eyebrow: 'VISITS AND OUTCOMES',
    title: 'Doctor',
    description:
      'See who has been measured, log visits (unlocked after the temperature is recorded), confirm discharge readiness and record outcomes.',
  },
  {
    role: 'admin',
    eyebrow: 'DISCHARGES AND AUDIT',
    title: 'Admin',
    description:
      'Discharge doctor-confirmed patients to free rooms, track mortality against the 15% expectation and review the audit log.',
  },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const {
    state,
    setRole,
    getTodayReading,
    getTodayVisit,
    getPatientReadings,
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
          className="w-3.5 h-3.5 rounded-[2px] border border-dashed border-[#d4d2c9] bg-[#fafaf7]"
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
        className="relative w-3.5 h-3.5 rounded-[2px] border border-[#e2e0d8] bg-white p-[1px] flex flex-col justify-between"
      >
        {eligible && (
          <span className="absolute -top-[1px] -right-[1px] w-1 h-1 bg-[#0f766e] rounded-[1px]" />
        )}
        <div
          className={`h-[4px] w-full rounded-[1px] border ${
            !reading
              ? 'border-[#a3a199] bg-transparent'
              : fever
              ? 'border-[#b91c1c] bg-[#fef2f2]'
              : 'border-[#4d7c5b] bg-[#e6f0e8]'
          }`}
        />
        <div
          className={`h-[4px] w-full rounded-[1px] border ${
            visit
              ? 'border-[#4d7c5b] bg-[#e6f0e8]'
              : !reading
              ? 'border-[#d4d2c9] bg-[#fafaf7]'
              : 'border-[#a3a199] bg-transparent'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col">
      {/* Proper Top Header Bar */}
      <header className="bg-white border-b border-[#e2e0d8]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#0f766e] rounded-xs" aria-hidden="true" />
            <span className="font-serif-heading text-lg font-semibold text-[#141413]">
              QuarantineCare
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="caption-label text-[#5c5b57] hidden sm:inline">
              74-Bed Quarantine Facility
            </span>
            <Link
              href="/how-it-works"
              className="text-xs font-medium text-[#0f766e] hover:underline rounded focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
            >
              How it works
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto w-full space-y-7">
          {/* Hero */}
          <div className="space-y-2">
            <h1 className="font-serif-heading text-3xl sm:text-[36px] font-semibold text-[#141413] leading-tight">
              QuarantineCare
            </h1>
            <p className="text-sm sm:text-base text-[#5c5b57] max-w-2xl">
              Daily temperature tracking, doctor visits and discharge readiness for a 74-room quarantine facility.
            </p>
          </div>

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
                className="group bg-white border border-[#e2e0d8] hover:border-[#0f766e] rounded-lg p-6 text-left transition-colors duration-150 grid grid-rows-[auto_auto_1fr_auto] gap-y-2.5 h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                <span className="caption-label text-[#0f766e] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.eyebrow}
                </span>

                <h2 className="font-serif-heading text-2xl font-semibold text-[#141413]">
                  {item.title}
                </h2>

                <p className="text-sm text-[#5c5b57] leading-relaxed">
                  {item.description}
                </p>

                <span className="inline-flex items-center gap-1 pt-2 text-sm font-semibold text-[#0f766e]">
                  <span>Enter as {item.title}</span>
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-150 group-hover:translate-x-[2px]"
                  >
                    &rarr;
                  </span>
                </span>
              </button>
            ))}
          </section>

          {/* Non-interactive Ward Board Preview (hidden below 480px) */}
          <section
            aria-hidden="true"
            className="hidden min-[480px]:block bg-white border border-[#e2e0d8] rounded-lg p-4 space-y-2.5 pointer-events-none select-none"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:min-h-[112px]">
              {/* Wing 1: Rooms 1-37 */}
              <div className="flex-1 flex flex-wrap gap-1 content-center">
                {Array.from({ length: 37 }, (_, i) => renderPreviewCell(i + 1))}
              </div>

              {/* Thin corridor line */}
              <div className="h-[1px] w-full md:w-[1px] md:h-24 bg-[#e2e0d8] shrink-0" />

              {/* Wing 2: Rooms 38-74 */}
              <div className="flex-1 flex flex-wrap gap-1 content-center">
                {Array.from({ length: 37 }, (_, i) => renderPreviewCell(i + 38))}
              </div>
            </div>

            <p className="caption-label text-[#5c5b57] pt-1 border-t border-[#e2e0d8]">
              Today&apos;s ward at a glance. Top half: temperature. Bottom half: doctor visit.
            </p>
          </section>

          {/* Dismissible Reviewer Guide (first visit) */}
          {showTour && (
            <section
              aria-label="Quick tour"
              className="bg-white border border-[#e2e0d8] rounded-lg p-4 space-y-2.5 text-xs text-[#5c5b57]"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-[#141413]">Quick tour (60 seconds)</h2>
                <button
                  type="button"
                  onClick={dismissTour}
                  className="px-2.5 py-1 rounded border border-[#e2e0d8] text-xs font-medium text-[#5c5b57] hover:text-[#141413] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                >
                  Dismiss
                </button>
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 list-none">
                <li className="p-2 rounded bg-[#fafaf7] border border-[#e2e0d8]">
                  1. Enter as Nurse and record a temperature.
                </li>
                <li className="p-2 rounded bg-[#fafaf7] border border-[#e2e0d8]">
                  2. Enter as Doctor and log a visit.
                </li>
                <li className="p-2 rounded bg-[#fafaf7] border border-[#e2e0d8]">
                  3. Advance the day with the demo control in settings.
                </li>
                <li className="p-2 rounded bg-[#fafaf7] border border-[#e2e0d8]">
                  4. Enter as Admin and discharge an eligible patient.
                </li>
              </ol>
            </section>
          )}
        </div>
      </main>

      {/* Proper Distinct Bottom Footer Bar */}
      <footer className="bg-white border-t border-[#e2e0d8]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5c5b57]">
          <span>QuarantineCare &bull; Demo prototype. Sign-in is not implemented.</span>
          <div className="flex items-center gap-4">
            {!showTour && (
              <button
                type="button"
                onClick={restoreTour}
                className="text-[#5c5b57] hover:text-[#141413] underline cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                Show tour again
              </button>
            )}
            <Link
              href="/how-it-works"
              className="text-[#0f766e] font-medium hover:underline rounded focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
            >
              How it works
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
