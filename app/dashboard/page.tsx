'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Printer, List, LayoutGrid, Play } from 'lucide-react';
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
type FilterMode = 'all' | 'awaiting-temp' | 'awaiting-visit' | 'eligible' | 'fever-today';
type ViewMode = 'board' | 'list';

export default function DashboardPage() {
  const router = useRouter();
  const {
    state,
    role,
    temperatureUnit,
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
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  const occupancy = getOccupancy();
  const pendingTemps = getPendingTemps();
  const pendingVisits = getPendingVisits();
  const dischargeEligible = getDischargeEligible();
  const outcomes = getOutcomes();

  const tempsTakenCount = Math.max(0, occupancy - pendingTemps.length);
  const visitsDoneCount = Math.max(0, occupancy - pendingVisits.length);
  const eligibleCount = dischargeEligible.length;

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

  // Priority-ordered list for List View (fever today first, then eligible awaiting confirmation, then rest)
  const listPatients = useMemo(() => {
    const admitted = state.patients.filter((p) => p.status === 'admitted');

    const matchesFilter = (p: (typeof admitted)[number]) => {
      const r = getTodayReading(p.id);
      const v = getTodayVisit(p.id);
      const elig = isEligibleForDischarge(getPatientReadings(p.id), state.currentDate);
      const fev = r ? hasFever(r.temperature) : false;

      if (searchLower) {
        const hit =
          p.name.toLowerCase().includes(searchLower) ||
          String(p.roomNumber).includes(searchLower);
        if (!hit) return false;
      }

      if (filterMode === 'awaiting-temp') return !r;
      if (filterMode === 'awaiting-visit') return !v;
      if (filterMode === 'eligible') return elig;
      if (filterMode === 'fever-today') return fev;
      return true;
    };

    const priorityScore = (p: (typeof admitted)[number]) => {
      const r = getTodayReading(p.id);
      const fev = r ? hasFever(r.temperature) : false;
      const elig = isEligibleForDischarge(getPatientReadings(p.id), state.currentDate);
      const confirmed = state.dischargeQueue.includes(p.id);
      if (fev) return 0;
      if (elig && !confirmed) return 1;
      if (elig) return 2;
      return 3;
    };

    return admitted.filter(matchesFilter).sort((a, b) => {
      const pa = priorityScore(a);
      const pb = priorityScore(b);
      if (pa !== pb) return pa - pb;
      return a.roomNumber - b.roomNumber;
    });
  }, [
    state.patients,
    state.currentDate,
    state.dischargeQueue,
    searchLower,
    filterMode,
    getTodayReading,
    getTodayVisit,
    getPatientReadings,
  ]);

  if (!role) return null;

  const formatTemp = (celsius: number) =>
    temperatureUnit === 'F'
      ? `${celsiusToFahrenheit(celsius).toFixed(1)} °F`
      : `${celsius.toFixed(1)} °C`;

  const renderRoomCell = (roomNum: number) => {
    const patient = roomMap.get(roomNum) ?? null;

    if (!patient) {
      const matchesSearch = !searchLower || String(roomNum).includes(searchLower);
      const matchesFilter = filterMode === 'all';
      return (
        <div
          key={roomNum}
          className={`relative aspect-square min-h-[52px] rounded-lg border border-dashed border-[#D4D2C9] bg-[#FAFAF8] p-1 flex flex-col justify-between transition-opacity duration-150 ${
            lens !== 'all' || !matchesSearch || !matchesFilter ? 'opacity-40' : ''
          }`}
          aria-label={`Room ${roomNum}: Vacant`}
        >
          <span className="font-mono tabular-nums text-[10px] text-[#6B7680]">
            {String(roomNum).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#6B7680] text-center">
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

    let matchesFilter = true;
    if (filterMode === 'awaiting-temp') matchesFilter = !todayReading;
    else if (filterMode === 'awaiting-visit') matchesFilter = !todayVisit;
    else if (filterMode === 'eligible') matchesFilter = eligible;
    else if (filterMode === 'fever-today') matchesFilter = feverToday;

    let isRelevant = true;
    if (lens === 'nurse') isRelevant = !todayReading;
    else if (lens === 'doctor') isRelevant = Boolean(todayReading) && !todayVisit;
    else if (lens === 'admin') isRelevant = eligible || state.dischargeQueue.includes(patient.id);

    const dimmed = !matchesSearch || !matchesFilter || !isRelevant;
    const isSelected = selectedPatientId === patient.id;

    const lastReading = readings[0];
    const lastTempStr = lastReading ? formatTemp(lastReading.temperature) : 'None';

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
          className={`w-full aspect-square min-h-[52px] rounded-lg border bg-white p-1 flex flex-col justify-between text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B] ${
            isSelected
              ? 'border-[#1F6F6B] ring-2 ring-[#1F6F6B]/40'
              : 'border-[#E7E5E0] hover:border-[#6B7680]'
          } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
        >
          <div className="flex items-start justify-between w-full">
            <span className="font-mono tabular-nums text-[10px] font-semibold text-[#1F2933] leading-none">
              {String(roomNum).padStart(2, '0')}
            </span>
            {eligible && (
              <span
                className="w-2 h-2 bg-[#1F6F6B] rounded-xs shrink-0"
                title="Eligible for discharge"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="w-full space-y-0.5 mt-1">
            {/* Top half: Temperature */}
            <div
              className={`h-2.5 w-full rounded-[2px] border flex items-center justify-center transition-colors duration-150 ${
                !todayReading
                  ? 'border-[#D97706] bg-transparent'
                  : feverToday
                  ? 'border-[#B91C1C] bg-[#FEF2F2]'
                  : 'border-[#4D7C5B] bg-[#E6F0E8]'
              }`}
            >
              {feverToday && (
                <span className="text-[8px] font-bold text-[#991B1B] leading-none">F</span>
              )}
            </div>

            {/* Bottom half: Doctor Visit */}
            <div
              className={`h-2.5 w-full rounded-[2px] border flex items-center justify-center transition-colors duration-150 ${
                todayVisit
                  ? 'border-[#4D7C5B] bg-[#E6F0E8]'
                  : !todayReading
                  ? 'border-[#D4D2C9] bg-[#FAFAF8]'
                  : 'border-[#D97706] bg-transparent'
              }`}
            >
              {!todayReading && !todayVisit && (
                <Lock className="w-2 h-2 text-[#6B7680]" strokeWidth={1.75} aria-hidden="true" />
              )}
            </div>
          </div>
        </button>

        {hoveredRoom === roomNum && (
          <div className="hidden lg:block absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-44 p-2.5 rounded-lg border border-[#E7E5E0] bg-white shadow-md pointer-events-none text-xs">
            <p className="font-semibold text-[#1F2933] truncate">{patient.name}</p>
            <p className="font-mono tabular-nums text-[11px] text-[#6B7680] mt-0.5">
              Last temp: {lastTempStr}
            </p>
            <p className="font-mono tabular-nums text-[11px] text-[#6B7680]">
              Streak: {streak} {streak === 1 ? 'day' : 'days'}
              {eligible ? ' (Eligible)' : ''}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1F2933] pb-20 md:pb-8">
      <Navbar />

      <main id="main-content" className="no-print max-w-[1120px] mx-auto px-4 py-6 space-y-5">
        {/* Critical Mortality > 15% Alert Banner */}
        {outcomes.isAboveBenchmark && (
          <div
            role="alert"
            className="p-3.5 rounded-xl border border-[#B91C1C] bg-[#FEF2F2] text-[#991B1B] flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span>
              <strong>Critical alert:</strong> Facility mortality rate (
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

        {/* Header & Primary Actions */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif-heading text-3xl sm:text-[36px] font-semibold text-[#1F2933] leading-tight">
              The Ward Board
            </h1>
            <p className="text-sm text-[#6B7680] mt-0.5">
              74-room quarantine floor plan. Occupied:{' '}
              <span className="font-mono tabular-nums font-semibold text-[#1F2933]">
                {occupancy} of {MAX_CAPACITY}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg border border-[#E7E5E0] bg-white text-sm font-medium text-[#1F2933] hover:border-[#1F6F6B] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              <Printer className="w-4 h-4 text-[#6B7680]" strokeWidth={1.5} aria-hidden="true" />
              <span>Print ward chart</span>
            </button>

            {(role === 'nurse' || role === 'doctor') && (
              <button
                type="button"
                onClick={() => setRoundOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-[#1F6F6B] text-white text-sm font-semibold hover:bg-[#175552] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              >
                <Play className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                <span>Start round</span>
              </button>
            )}
          </div>
        </div>

        {/* DAY PROGRESS STRIP */}
        <section
          aria-label="Day progress strip"
          className="bg-white border border-[#E7E5E0] rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { label: 'Temperatures taken', count: tempsTakenCount, color: 'bg-[#4D7C5B]' },
            { label: 'Doctor visits done', count: visitsDoneCount, color: 'bg-[#1F2933]' },
            { label: 'Ready for discharge', count: eligibleCount, color: 'bg-[#1F6F6B]' },
          ].map((stage) => {
            const pct = Math.min(100, Math.round((stage.count / MAX_CAPACITY) * 100));
            return (
              <div key={stage.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="caption-label text-[#6B7680] font-semibold">
                    {stage.label}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#1F2933]">
                    {stage.count} of {MAX_CAPACITY}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#E7E5E0] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-150`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Lens, Filters, Search & View Switch */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Role Lens */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="caption-label text-[#6B7680] font-semibold">Lens</span>
              <div
                role="group"
                aria-label="Board role lens"
                className="inline-flex rounded-lg border border-[#E7E5E0] bg-white p-0.5 flex-wrap"
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
                      className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B] ${
                        active
                          ? 'bg-[#1F2933] text-white'
                          : 'text-[#6B7680] hover:text-[#1F2933]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search & Board/List Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search room # or patient..."
                aria-label="Filter rooms by room number or patient name"
                className="flex-1 sm:w-60 px-3 py-2 min-h-[44px] rounded-lg border border-[#E7E5E0] bg-white text-sm text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              />
              <div
                role="group"
                aria-label="View switch"
                className="inline-flex rounded-lg border border-[#E7E5E0] bg-white p-0.5 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  aria-pressed={viewMode === 'board'}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[40px] text-xs font-medium rounded-md cursor-pointer ${
                    viewMode === 'board' ? 'bg-[#1F6F6B] text-white' : 'text-[#6B7680]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  <span>Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[40px] text-xs font-medium rounded-md cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#1F6F6B] text-white' : 'text-[#6B7680]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'awaiting-temp', label: 'Awaiting temperature' },
                { key: 'awaiting-visit', label: 'Awaiting visit' },
                { key: 'eligible', label: 'Eligible' },
                { key: 'fever-today', label: 'Fever today' },
              ] as { key: FilterMode; label: string }[]
            ).map((f) => {
              const active = filterMode === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterMode(f.key)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg border text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B] ${
                    active
                      ? 'border-[#1F6F6B] bg-[#F0FDFA] text-[#1F6F6B]'
                      : 'border-[#E7E5E0] bg-white text-[#6B7680] hover:text-[#1F2933]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Split: Board/List (left ~65%) + Persistent Patient Detail Panel (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
          {viewMode === 'board' ? (
            <section
              aria-label="74-room architectural ward floor plan"
              className="bg-white border border-[#E7E5E0] rounded-xl p-5 space-y-5"
            >
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3 border-b border-[#E7E5E0] text-xs text-[#6B7680]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-2 border border-[#D97706] rounded-[1px]" />
                  Pending
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-2 border border-[#4D7C5B] bg-[#E6F0E8] rounded-[1px]" />
                  Done / Clear
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-3 h-2.5 border border-[#B91C1C] bg-[#FEF2F2] text-[7px] font-bold text-[#991B1B]">
                    F
                  </span>
                  Fever (&ge; 38.0 &deg;C)
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#6B7680]" strokeWidth={1.75} aria-hidden="true" />
                  Visit locked (awaiting temp)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 bg-[#1F6F6B] rounded-xs" />
                  Discharge eligible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 border border-dashed border-[#D4D2C9] rounded-[1px]" />
                  Vacant
                </span>
              </div>

              {/* Wing A: Rooms 1-37 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="caption-label text-[#6B7680] font-semibold">
                    West Wing — Rooms 01 to 37
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-[#6B7680]">
                    Top: Temp / Bottom: Visit
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                  {Array.from({ length: 37 }, (_, i) => renderRoomCell(i + 1))}
                </div>
              </div>

              {/* Central Corridor & Nurses' Station */}
              <div className="py-2.5 px-4 border-y border-dashed border-[#D4D2C9] bg-[#FAFAF8] flex flex-wrap items-center justify-between gap-2">
                <span className="caption-label text-[#6B7680]">
                  Central Ward Corridor
                </span>
                <div className="px-3 py-1 rounded-lg border border-[#E7E5E0] bg-white text-xs font-semibold text-[#1F2933]">
                  Nurses&apos; station
                </div>
                <span className="font-mono tabular-nums text-[11px] text-[#6B7680]">
                  Capacity: 74 Beds
                </span>
              </div>

              {/* Wing B: Rooms 38-74 */}
              <div className="space-y-2">
                <span className="caption-label text-[#6B7680] font-semibold block">
                  East Wing — Rooms 38 to 74
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                  {Array.from({ length: 37 }, (_, i) => renderRoomCell(i + 38))}
                </div>
              </div>
            </section>
          ) : (
            /* LIST VIEW (Priority sorted: fever first, then eligible awaiting confirmation, then rest) */
            <section
              aria-label="Patient list view"
              className="bg-white border border-[#E7E5E0] rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-[#E7E5E0] bg-[#FAFAF8] flex items-center justify-between text-xs text-[#6B7680]">
                <span className="caption-label font-semibold">
                  Priority List ({listPatients.length} shown)
                </span>
                <span>Sorted: Fever today first, then discharge-eligible</span>
              </div>
              {listPatients.length === 0 ? (
                <p className="p-6 text-sm text-[#6B7680]">
                  No patients match the selected filter.
                </p>
              ) : (
                <div className="divide-y divide-[#E7E5E0]">
                  {listPatients.map((p) => {
                    const r = getTodayReading(p.id);
                    const v = getTodayVisit(p.id);
                    const streak = calculateFeverFreeStreak(
                      getPatientReadings(p.id),
                      state.currentDate,
                    );
                    const fever = r ? hasFever(r.temperature) : false;
                    const eligible = streak >= 3;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setMobileSheetOpen(true);
                        }}
                        className={`w-full p-4 text-left flex flex-wrap items-center justify-between gap-3 hover:bg-[#FAFAF8] transition-colors cursor-pointer ${
                          selectedPatientId === p.id ? 'bg-[#F0FDFA]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono tabular-nums text-xs font-semibold px-2 py-1 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8]">
                            R{String(p.roomNumber).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-[#1F2933]">{p.name}</p>
                            <p className="font-mono tabular-nums text-xs text-[#6B7680]">
                              Streak: {streak}d {eligible ? '• Eligible' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded-lg border font-mono tabular-nums ${
                              !r
                                ? 'border-[#D97706] text-[#92400E]'
                                : fever
                                ? 'border-[#B91C1C] bg-[#FEF2F2] text-[#991B1B] font-semibold'
                                : 'border-[#4D7C5B] bg-[#E6F0E8] text-[#284732]'
                            }`}
                          >
                            {r ? formatTemp(r.temperature) : 'Temp pending'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-lg border ${
                              v
                                ? 'border-[#4D7C5B] bg-[#E6F0E8] text-[#284732]'
                                : !r
                                ? 'border-dashed border-[#D4D2C9] text-[#6B7680]'
                                : 'border-[#D97706] text-[#92400E]'
                            }`}
                          >
                            {v ? 'Visited' : !r ? 'Locked' : 'Visit pending'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* DESKTOP PERSISTENT SIDE PANEL */}
          <aside
            aria-label="Selected patient detail"
            className="hidden lg:block border border-[#E7E5E0] rounded-xl overflow-hidden sticky top-20 max-h-[calc(100vh-100px)]"
          >
            <PatientDetailPanel
              patientId={selectedPatientId}
              onNotify={notify}
            />
          </aside>
        </div>
      </main>

      {/* PRINT-ONLY CLEAN BLACK-AND-WHITE WARD CHART */}
      <section className="hidden print-only p-4 text-black text-xs space-y-4">
        <div className="flex justify-between border-b border-black pb-2">
          <div>
            <h1 className="text-lg font-bold">QuarantineCare — Daily Ward Chart</h1>
            <p>Date: {state.currentDate} | Occupied: {occupancy} / {MAX_CAPACITY}</p>
          </div>
          <div className="text-right">
            <p>Temps Pending: {pendingTemps.length} | Visits Pending: {pendingVisits.length}</p>
            <p>Eligible for Discharge: {eligibleCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: MAX_CAPACITY }, (_, i) => {
            const roomNum = i + 1;
            const p = roomMap.get(roomNum);
            const r = p ? getTodayReading(p.id) : undefined;
            const v = p ? getTodayVisit(p.id) : undefined;
            return (
              <div key={roomNum} className="border border-black p-1 text-[10px]">
                <div className="font-bold font-mono">R{String(roomNum).padStart(2, '0')}</div>
                {p ? (
                  <>
                    <div className="truncate">{p.name.split(' ')[0]}</div>
                    <div>T:{r ? `${r.temperature.toFixed(1)}` : '--'} V:{v ? 'Y' : 'N'}</div>
                  </>
                ) : (
                  <div>VACANT</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black">
          <div>
            <h2 className="font-bold mb-1">Awaiting Temperature ({pendingTemps.length})</h2>
            <p className="font-mono">
              {pendingTemps.map((p) => `R${p.roomNumber}`).join(', ') || 'None'}
            </p>
          </div>
          <div>
            <h2 className="font-bold mb-1">Awaiting Doctor Visit ({pendingVisits.length})</h2>
            <p className="font-mono">
              {pendingVisits.map((p) => `R${p.roomNumber}`).join(', ') || 'None'}
            </p>
          </div>
        </div>
      </section>

      {/* MOBILE BOTTOM SHEET */}
      {mobileSheetOpen && (
        <div
          className="no-print lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-[#1F2933]/40"
          role="dialog"
          aria-modal="true"
          aria-label="Patient detail sheet"
        >
          <div className="bg-white rounded-t-xl border-t border-[#E7E5E0] max-h-[85vh] overflow-y-auto">
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
