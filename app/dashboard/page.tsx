'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import Navbar from '@/app/components/Navbar';
import {
  isEligibleForDischarge,
  celsiusToFahrenheit,
  hasFever,
  calculateFeverFreeStreak,
  MAX_CAPACITY,
} from '@/app/lib/logic';

type FilterMode = 'all' | 'awaiting-temp' | 'awaiting-visit' | 'eligible-discharge';

export default function DashboardPage() {
  const router = useRouter();
  const {
    state,
    role,
    temperatureUnit: tempUnit,
    getOccupancy,
    getPendingTemps,
    getPendingVisits,
    getDischargeEligible,
    getTodayReading,
    getTodayVisit,
    getPatientReadings,
    getOutcomes,
  } = useApp();

  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');

  // Redirect if no role
  React.useEffect(() => {
    if (!role) router.push('/');
  }, [role, router]);

  const occupancy = getOccupancy();
  const pendingTemps = getPendingTemps();
  const pendingVisits = getPendingVisits();
  const dischargeEligible = getDischargeEligible();
  const outcomes = getOutcomes();

  const admittedPatients = useMemo(
    () => state.patients.filter((p) => p.status === 'admitted'),
    [state.patients]
  );

  const filteredPatients = useMemo(() => {
    let list = admittedPatients;

    // Apply filter
    switch (filter) {
      case 'awaiting-temp':
        list = list.filter((p) => !getTodayReading(p.id));
        break;
      case 'awaiting-visit':
        list = list.filter((p) => !getTodayVisit(p.id));
        break;
      case 'eligible-discharge':
        list = list.filter((p) => {
          const readings = getPatientReadings(p.id);
          return isEligibleForDischarge(readings, state.currentDate);
        });
        break;
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.roomNumber.toString().includes(q)
      );
    }

    return list.sort((a, b) => a.roomNumber - b.roomNumber);
  }, [admittedPatients, filter, search, state.currentDate, getTodayReading, getTodayVisit, getPatientReadings]);

  // Build a map for all 74 rooms
  const roomMap = useMemo(() => {
    const map: Record<number, (typeof state.patients)[0] | null> = {};
    for (let i = 1; i <= MAX_CAPACITY; i++) map[i] = null;
    for (const p of state.patients) {
      if (p.status === 'admitted') map[p.roomNumber] = p;
    }
    return map;
  }, [state.patients]);

  const getRoomStatus = (patient: (typeof state.patients)[0] | null) => {
    if (!patient) return 'empty';
    const hasTemp = !!getTodayReading(patient.id);
    const hasVisit = !!getTodayVisit(patient.id);
    const readings = getPatientReadings(patient.id);
    const eligible = isEligibleForDischarge(readings, state.currentDate);

    if (eligible) return 'eligible';
    if (hasTemp && hasVisit) return 'complete';
    if (hasTemp) return 'temp-only';
    return 'pending';
  };

  const statusStyles: Record<string, string> = {
    complete: 'border-emerald-400 bg-emerald-50',
    'temp-only': 'border-yellow-400 bg-yellow-50',
    pending: 'border-orange-400 bg-orange-50',
    eligible: 'border-blue-400 bg-blue-50 ring-2 ring-blue-200',
    empty: 'border-slate-200 bg-slate-50 opacity-50',
  };

  if (!role) return null;

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All Patients' },
    { key: 'awaiting-temp', label: 'Awaiting Temperature' },
    { key: 'awaiting-visit', label: 'Awaiting Doctor Visit' },
    { key: 'eligible-discharge', label: 'Eligible for Discharge' },
  ];

  // Determine which rooms to show in grid
  const displayRoomNumbers = useMemo(() => {
    if (filter === 'all' && !search.trim()) {
      // Show all 74 rooms
      return Array.from({ length: MAX_CAPACITY }, (_, i) => i + 1);
    }
    // Show only rooms of filtered patients
    return filteredPatients.map((p) => p.roomNumber);
  }, [filter, search, filteredPatients]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mortality alert */}
        {outcomes.isAboveBenchmark && !outcomes.isSmallSample && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium">
            ⚠️ Alert: Facility mortality rate ({((outcomes.mortalityRate ?? 0) * 100).toFixed(1)}%) exceeds 15% benchmark. Please review clinical protocols.
          </div>
        )}

        {/* Summary counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-slate-800">{occupancy}/{MAX_CAPACITY}</div>
            <div className="text-xs text-slate-500">Occupied Rooms</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{pendingTemps.length}</div>
            <div className="text-xs text-slate-500">Temps Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{pendingVisits.length}</div>
            <div className="text-xs text-slate-500">Visits Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative">
            <div className="text-2xl font-bold text-blue-600">{dischargeEligible.length}</div>
            <div className="text-xs text-slate-500">Eligible for Discharge</div>
            {dischargeEligible.length > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Filters & search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 min-h-10 text-sm rounded-lg transition-colors cursor-pointer ${
                  filter === f.key
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by name or room #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 min-h-10 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 sm:ml-auto sm:w-64"
          />
        </div>

        {/* Room grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
          {displayRoomNumbers.map((roomNum) => {
            const patient = roomMap[roomNum] ?? null;
            const status = getRoomStatus(patient);
            const hasTemp = patient ? !!getTodayReading(patient.id) : false;
            const hasVisit = patient ? !!getTodayVisit(patient.id) : false;

            return (
              <button
                key={roomNum}
                onClick={() => {
                  if (patient) router.push(`/patient/${patient.id}`);
                }}
                disabled={!patient}
                className={`relative rounded-lg border-2 p-2 text-left transition-all min-h-20 ${
                  statusStyles[status]
                } ${patient ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
              >
                <div className="text-xs font-bold text-slate-400">#{roomNum}</div>
                {patient ? (
                  <>
                    <div className="text-xs font-medium text-slate-800 truncate mt-0.5">
                      {patient.name.split(' ')[0]}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <span className={`text-xs ${hasTemp ? 'opacity-100' : 'opacity-30'}`}>🌡️</span>
                      <span className={`text-xs ${hasVisit ? 'opacity-100' : 'opacity-30'}`}>👨‍⚕️</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 mt-1">Empty</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-emerald-400 bg-emerald-50 inline-block" />
            Complete
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-yellow-400 bg-yellow-50 inline-block" />
            Temp Only
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-orange-400 bg-orange-50 inline-block" />
            Pending
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-blue-400 bg-blue-50 inline-block" />
            Discharge Eligible
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-slate-200 bg-slate-50 inline-block opacity-50" />
            Empty
          </div>
        </div>
      </div>
    </div>
  );
}
