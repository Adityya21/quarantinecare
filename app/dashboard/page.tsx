'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import Navbar from '@/app/components/Navbar';
import PatientDetailPanel from '@/app/components/PatientDetailPanel';
import RoundModeModal from '@/app/components/RoundModeModal';
import Toast, { type ToastMessage } from '@/app/components/Toast';
import {
  MAX_CAPACITY,
  hasFever,
  celsiusToFahrenheit,
  calculateFeverFreeStreak,
  isEligibleForDischarge,
} from '@/app/lib/logic';
import type { Role } from '@/app/lib/types';

type LensMode = Role | 'all';

export default function DashboardPage() {
  const router = useRouter();
  const {
    state,
    role,
    temperatureUnit,
    advanceDay,
    getOccupancy,
    getPendingTemps,
    getPendingVisits,
    getDischargeEligible,
    getTodayReading,
    getTodayVisit,
    getPatientReadings,
    getOutcomes,
  } = useApp();

  const [lens, setLens] = useState<LensMode>(role ?? 'nurse');
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showTour, setShowTour] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('qc-tour-dismissed');
      if (dismissed === 'true') setShowTour(false);
    } catch {
      // ignore SSR / storage errors
    }
  }, []);

  useEffect(() => {
    if (!role) {
      router.push('/');
    } else {
      setLens(role);
    }
  }, [role, router]);

  const notify = (text: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
    const id = Date.now().toString();
    setToast({ id, text, tone });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3200);
  };

  const dismissTour = () => {
    setShowTour(false);
    try {
      localStorage.setItem('qc-tour-dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const occupancy = getOccupancy();
  const pendingTemps = getPendingTemps();
  const pendingVisits = getPendingVisits();
  const dischargeEligible = getDischargeEligible();
  const outcomes = getOutcomes();

  const tempsTakenCount = Math.max(0, occupancy - pendingTemps.length);
  const visitsDoneCount = Math.max(0, occupancy - pendingVisits.length);
  const eligibleCount = dischargeEligible.length;

  // Map roomNumber 1..74 -> active admitted patient (or null if vacant)
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

  const searchLower = search.trim().toLowerCase();

  const renderRoomCell = (roomNum: number) => {
    const patient = roomMap.get(roomNum) ?? null;

    if (!patient) {
      const matchesSearch = !searchLower || String(roomNum).includes(searchLower);
      return (
        <div
          key={roomNum}
          className={`relative aspect-square min-h-[52px] rounded border border-dashed border-[#d4d2c9] bg-[#fafaf7] p-1 flex flex-col justify-between transition-opacity duration-150 ${
            lens !== 'all' || !matchesSearch ? 'opacity-40' : ''
          }`}
          aria-label={`Room ${roomNum}: Vacant`}
        >
          <span className="font-mono tabular-nums text-[10px] text-[#8f8d87]">
            {String(roomNum).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#8f8d87] text-center">
            Vac
          </span>
        </div>
      );
    }

    const todayReading = getTodayReading(patient.id);
    const todayVisit = getTodayVisit(patient.id);
    const readings = getPatientReadings(patient.id);
    const streak = calculateFeverFreeStreak(readings, state.currentDate);
    const eligible = isEligibleForDischarge(readings, state.currentDate);
    const feverToday = todayReading ? hasFever(todayReading.temperature) : false;

    const matchesSearch =
      !searchLower ||
      patient.name.toLowerCase().includes(searchLower) ||
      String(roomNum).includes(searchLower);

    // Role lens emphasis
    let isRelevant = true;
    if (lens === 'nurse') {
      isRelevant = !todayReading;
    } else if (lens === 'doctor') {
      isRelevant = Boolean(todayReading) && !todayVisit;
    } else if (lens === 'admin') {
      isRelevant = eligible || state.dischargeQueue.includes(patient.id);
    }

    const dimmed = !matchesSearch || !isRelevant;
    const isSelected = selectedPatientId === patient.id;

    const lastReading = readings[0];
    const lastTempStr = lastReading
      ? temperatureUnit === 'F'
        ? `${celsiusToFahrenheit(lastReading.temperature).toFixed(1)}°F`
        : `${lastReading.temperature.toFixed(1)}°C`
      : 'None';

    return (
      <div
        key={roomNum}
        className="relative"
        onMouseEnter={() => setHoveredRoom(roomNum)}
        onMouseLeave={() => setHoveredRoom((prev) => (prev === roomNum ? null : prev))}
      >
        <button
          type="button"
          onClick={() => {
            setSelectedPatientId(patient.id);
            setMobileSheetOpen(true);
          }}
          aria-label={`Room ${roomNum}, ${patient.name}. Temp: ${
            todayReading ? (feverToday ? 'Fever' : 'Done') : 'Pending'
          }. Visit: ${todayVisit ? 'Done' : !todayReading ? 'Locked' : 'Pending'}.${
            eligible ? ' Eligible for discharge.' : ''
          }`}
          className={`w-full aspect-square min-h-[52px] rounded border bg-white p-1 flex flex-col justify-between text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e] ${
            isSelected
              ? 'border-[#0f766e] ring-2 ring-[#0f766e]/40'
              : 'border-[#e2e0d8] hover:border-[#5c5b57]'
          } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
        >
          {/* Top row: room number + discharge teal corner tab */}
          <div className="flex items-start justify-between w-full">
            <span className="font-mono tabular-nums text-[10px] font-semibold text-[#141413] leading-none">
              {String(roomNum).padStart(2, '0')}
            </span>
            {eligible && (
              <span
                className="w-2 h-2 bg-[#0f766e] rounded-xs shrink-0"
                title="Eligible for discharge"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Two stacked half-bars */}
          <div className="w-full space-y-0.5 mt-1">
            {/* Top half: Temperature */}
            <div
              className={`h-2.5 w-full rounded-[2px] border flex items-center justify-center transition-colors duration-150 ${
                !todayReading
                  ? 'border-[#a3a199] bg-transparent'
                  : feverToday
                  ? 'border-[#b91c1c] bg-[#fef2f2]'
                  : 'border-[#4d7c5b] bg-[#e6f0e8]'
              }`}
              title={
                !todayReading
                  ? 'Temp pending'
                  : feverToday
                  ? 'Fever recorded today'
                  : 'Normal temp recorded'
              }
            >
              {feverToday && (
                <span className="text-[8px] font-bold text-[#991b1b] leading-none">F</span>
              )}
            </div>

            {/* Bottom half: Doctor Visit (locked until temp taken) */}
            <div
              className={`h-2.5 w-full rounded-[2px] border flex items-center justify-center transition-colors duration-150 ${
                todayVisit
                  ? 'border-[#4d7c5b] bg-[#e6f0e8]'
                  : !todayReading
                  ? 'border-[#d4d2c9] bg-[#fafaf7]'
                  : 'border-[#a3a199] bg-transparent'
              }`}
              title={
                todayVisit
                  ? 'Doctor visited today'
                  : !todayReading
                  ? 'Locked until temperature is taken'
                  : 'Ready for doctor visit'
              }
            >
              {!todayReading && !todayVisit && (
                <svg
                  viewBox="0 0 12 12"
                  className="w-2 h-2 text-[#5c5b57]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                  <path d="M4 5.5V4a2 2 0 1 1 4 0v1.5" />
                </svg>
              )}
            </div>
          </div>
        </button>

        {/* Compact Hover Popover (desktop) */}
        {hoveredRoom === roomNum && (
          <div className="hidden lg:block absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-44 p-2.5 rounded border border-[#e2e0d8] bg-white shadow-md pointer-events-none text-xs">
            <p className="font-semibold text-[#141413] truncate">{patient.name}</p>
            <p className="font-mono tabular-nums text-[11px] text-[#5c5b57] mt-0.5">
              Last temp: {lastTempStr}
            </p>
            <p className="font-mono tabular-nums text-[11px] text-[#5c5b57]">
              Streak: {streak} {streak === 1 ? 'day' : 'days'}
              {eligible ? ' (Eligible)' : ''}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!role) return null;

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
        {/* Mortality > 15% Alert Banner */}
        {outcomes.isAboveBenchmark && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-[#b91c1c] bg-[#fef2f2] text-[#991b1b] flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span>
              <strong>Alert:</strong> Facility mortality rate (
              <span className="font-mono tabular-nums font-bold">
                {outcomes.mortalityRate !== null
                  ? `${(outcomes.mortalityRate * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
              ) exceeds the 15% expected benchmark.
            </span>
            <button
              type="button"
              onClick={() => router.push('/outcomes')}
              className="text-xs font-semibold underline cursor-pointer"
            >
              View Outcomes
            </button>
          </div>
        )}

        {/* Quick Tour (60 seconds) */}
        {showTour && (
          <section
            aria-label="Quick tour"
            className="bg-white border border-[#e2e0d8] rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="caption-label text-[#0f766e] font-semibold">
                  Quick Tour (60 Seconds)
                </span>
                <p className="text-xs text-[#5c5b57] mt-0.5">
                  Daily facility workflow across roles. Use Log out in the top bar to sign in as another role.
                </p>
              </div>
              <button
                type="button"
                onClick={dismissTour}
                className="px-2.5 py-1 text-xs font-medium text-[#5c5b57] border border-[#e2e0d8] rounded hover:text-[#141413] cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded border border-[#e2e0d8] bg-[#fafaf7]">
                <span className="font-mono font-bold text-[#0f766e]">1.</span>{' '}
                <span className="font-semibold text-[#141413]">Nurse records temperature</span>
                <span className="block text-[#5c5b57] mt-0.5">Unlocks Doctor visit for that room</span>
              </div>

              <div className="p-2.5 rounded border border-[#e2e0d8] bg-[#fafaf7]">
                <span className="font-mono font-bold text-[#0f766e]">2.</span>{' '}
                <span className="font-semibold text-[#141413]">Doctor logs visit &amp; notes</span>
                <span className="block text-[#5c5b57] mt-0.5">Confirms discharge when streak &ge; 3</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  advanceDay();
                  notify('Simulated date advanced by 1 day.', 'success');
                }}
                className="p-2.5 rounded border border-[#e2e0d8] bg-[#fafaf7] hover:border-[#0f766e] text-left transition-colors cursor-pointer"
              >
                <span className="font-mono font-bold text-[#0f766e]">3.</span>{' '}
                <span className="font-semibold text-[#141413]">Advance the day (demo)</span>
                <span className="block text-[#5c5b57] mt-0.5">Click to test the 3-day streak rule</span>
              </button>

              <div className="p-2.5 rounded border border-[#e2e0d8] bg-[#fafaf7]">
                <span className="font-mono font-bold text-[#0f766e]">4.</span>{' '}
                <span className="font-semibold text-[#141413]">Admin executes discharge</span>
                <span className="block text-[#5c5b57] mt-0.5">Frees the room &amp; updates outcomes</span>
              </div>
            </div>
          </section>
        )}

        {/* Title & Action Row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif-heading text-3xl sm:text-[34px] font-semibold text-[#141413] leading-tight">
                The Ward Board
              </h1>
              {!showTour && (
                <button
                  type="button"
                  onClick={() => setShowTour(true)}
                  className="text-xs text-[#0f766e] underline cursor-pointer"
                >
                  Quick tour
                </button>
              )}
            </div>
            <p className="text-sm text-[#5c5b57] mt-0.5">
              74-room quarantine floor plan. Occupied:{' '}
              <span className="font-mono tabular-nums font-semibold text-[#141413]">
                {occupancy} of {MAX_CAPACITY}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {(role === 'nurse' || role === 'doctor') && (
              <button
                type="button"
                onClick={() => setRoundOpen(true)}
                className="px-4 py-2.5 min-h-[42px] rounded bg-[#0f766e] text-white text-sm font-semibold hover:bg-[#0d625b] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                Start round
              </button>
            )}
          </div>
        </div>

        {/* DAY PROGRESS STRIP */}
        <section
          aria-label="Day progress strip"
          className="bg-white border border-[#e2e0d8] rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              label: 'Temperatures taken',
              count: tempsTakenCount,
              color: 'bg-[#4d7c5b]',
            },
            {
              label: 'Doctor visits done',
              count: visitsDoneCount,
              color: 'bg-[#141413]',
            },
            {
              label: 'Ready for discharge',
              count: eligibleCount,
              color: 'bg-[#0f766e]',
            },
          ].map((stage) => {
            const pct = Math.min(100, Math.round((stage.count / MAX_CAPACITY) * 100));
            return (
              <div key={stage.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="caption-label text-[#5c5b57] font-semibold">
                    {stage.label}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#141413]">
                    {stage.count} of {MAX_CAPACITY}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#e2e0d8] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-150`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Lens & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="caption-label text-[#5c5b57] font-semibold">Lens</span>
            <div
              role="group"
              aria-label="Board role lens"
              className="inline-flex rounded border border-[#e2e0d8] bg-white p-0.5"
            >
              {(
                [
                  { key: 'nurse', label: 'Nurse (Need Temp)' },
                  { key: 'doctor', label: 'Doctor (Need Visit)' },
                  { key: 'admin', label: 'Admin (Eligible)' },
                  { key: 'all', label: 'All Rooms' },
                ] as { key: LensMode; label: string }[]
              ).map((item) => {
                const active = lens === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setLens(item.key)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e] ${
                      active
                        ? 'bg-[#141413] text-white'
                        : 'text-[#5c5b57] hover:text-[#141413]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by room # or patient name..."
            aria-label="Filter rooms by room number or patient name"
            className="w-full sm:w-64 px-3 py-2 min-h-[38px] rounded border border-[#e2e0d8] bg-white text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
          />
        </div>

        {/* Main Split: Ward Board (left ~65%) + Persistent Detail Panel (right ~35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
          {/* WARD FLOOR PLAN */}
          <section
            aria-label="74-room architectural ward floor plan"
            className="bg-white border border-[#e2e0d8] rounded-lg p-4 sm:p-5 space-y-5"
          >
            {/* Legend (never color alone: shapes + labels) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3 border-b border-[#e2e0d8] text-xs text-[#5c5b57]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-2 border border-[#a3a199] rounded-[1px]" />
                Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-2 border border-[#4d7c5b] bg-[#e6f0e8] rounded-[1px]" />
                Done / Clear
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-3 h-2.5 border border-[#b91c1c] bg-[#fef2f2] text-[7px] font-bold text-[#991b1b]">
                  F
                </span>
                Fever (&ge;38.0&deg;C)
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-[#5c5b57]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                  <path d="M4 5.5V4a2 2 0 1 1 4 0v1.5" />
                </svg>
                Visit locked (awaiting temp)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-[#0f766e] rounded-xs" />
                Discharge eligible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border border-dashed border-[#d4d2c9] rounded-[1px]" />
                Vacant
              </span>
            </div>

            {/* Wing A: Rooms 1-37 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="caption-label text-[#5c5b57] font-semibold">
                  West Wing — Rooms 01 to 37
                </span>
                <span className="font-mono tabular-nums text-[11px] text-[#5c5b57]">
                  Top bar: Temp • Bottom bar: Visit
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                {Array.from({ length: 37 }, (_, i) => renderRoomCell(i + 1))}
              </div>
            </div>

            {/* Central Corridor & Nurses' Station */}
            <div className="py-2.5 px-4 border-y border-dashed border-[#d4d2c9] bg-[#fafaf7] flex flex-wrap items-center justify-between gap-2">
              <span className="caption-label text-[#5c5b57]">
                Central Ward Corridor
              </span>
              <div className="px-3 py-1 rounded border border-[#e2e0d8] bg-white text-xs font-semibold text-[#141413]">
                Nurses&apos; Station — Triage &amp; Charting
              </div>
              <span className="font-mono tabular-nums text-[11px] text-[#5c5b57]">
                Capacity: 74 Beds
              </span>
            </div>

            {/* Wing B: Rooms 38-74 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="caption-label text-[#5c5b57] font-semibold">
                  East Wing — Rooms 38 to 74
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                {Array.from({ length: 37 }, (_, i) => renderRoomCell(i + 38))}
              </div>
            </div>
          </section>

          {/* DESKTOP PERSISTENT SIDE PANEL */}
          <aside
            aria-label="Selected patient detail"
            className="hidden lg:block border border-[#e2e0d8] rounded-lg overflow-hidden sticky top-20 max-h-[calc(100vh-100px)]"
          >
            <PatientDetailPanel
              patientId={selectedPatientId}
              onNotify={notify}
            />
          </aside>
        </div>
      </main>

      {/* MOBILE BOTTOM SHEET */}
      {mobileSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-[#141413]/40"
          role="dialog"
          aria-modal="true"
          aria-label="Patient detail sheet"
        >
          <div className="bg-white rounded-t-xl border-t border-[#e2e0d8] max-h-[85vh] overflow-y-auto">
            <PatientDetailPanel
              patientId={selectedPatientId}
              onClose={() => setMobileSheetOpen(false)}
              onNotify={notify}
            />
          </div>
        </div>
      )}

      {/* ROUND MODE MODAL */}
      <RoundModeModal
        isOpen={roundOpen}
        onClose={() => setRoundOpen(false)}
        onNotify={notify}
      />

      {/* TOAST */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
