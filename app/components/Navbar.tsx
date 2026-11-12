'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import { formatDate } from '@/app/lib/logic';

export default function Navbar() {
  const router = useRouter();
  const { role, setRole, state, temperatureUnit: tempUnit, setTemperatureUnit: setTempUnit, advanceDay, getDischargeEligible } = useApp();

  if (!role) return null;

  const eligibleCount = getDischargeEligible().length;
  const dischargeBadgeCount = Math.max(eligibleCount, state.dischargeQueue.length);

  const roleBadgeColor: Record<string, string> = {
    nurse: 'bg-emerald-100 text-emerald-800',
    doctor: 'bg-blue-100 text-blue-800',
    admin: 'bg-purple-100 text-purple-800',
  };

  const handleLogout = () => {
    setRole(null);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-3 overflow-x-auto">
          {/* Left: brand + nav links */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/dashboard" className="text-lg font-bold text-teal-700 whitespace-nowrap">
              🏥 QuarantineCare
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>

              {(role === 'doctor' || role === 'admin') && (
                <Link
                  href="/outcomes"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Outcomes
                </Link>
              )}

              {role === 'admin' && (
                <>
                  <Link
                    href="/discharge"
                    className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                  >
                    <span>Discharge Queue</span>
                    {dischargeBadgeCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-teal-600 text-white">
                        {dischargeBadgeCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/audit"
                    className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Audit Log
                  </Link>
                </>
              )}

              <Link
                href="/submission"
                className="px-3 py-2 rounded-md text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
              >
                Submission
              </Link>
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${roleBadgeColor[role]}`}>
              {role}
            </span>

            <span className="text-xs text-slate-500 hidden md:inline whitespace-nowrap">
              📅 {formatDate(state.currentDate)}
            </span>

            <button
              onClick={advanceDay}
              className="px-2 py-1 min-h-8 text-xs rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer whitespace-nowrap border border-teal-200"
              title="Demo control: Advance simulated date by one day"
            >
              Demo: Next Day →
            </button>

            <button
              onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
              className="px-2 py-1 min-h-8 text-xs rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              °{tempUnit}
            </button>

            <button
              onClick={handleLogout}
              className="px-2 py-1 min-h-8 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile nav links */}
        <div className="flex sm:hidden items-center gap-1 pb-2 overflow-x-auto">
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            Dashboard
          </Link>
          {(role === 'doctor' || role === 'admin') && (
            <Link
              href="/outcomes"
              className="px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Outcomes
            </Link>
          )}
          {role === 'admin' && (
            <>
              <Link
                href="/discharge"
                className="px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <span>Discharge</span>
                {dischargeBadgeCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-teal-600 text-white">
                    {dischargeBadgeCount}
                  </span>
                )}
              </Link>
              <Link
                href="/audit"
                className="px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                Audit
              </Link>
            </>
          )}
          <Link
            href="/submission"
            className="px-3 py-2 rounded-md text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors whitespace-nowrap"
          >
            Submission
          </Link>
        </div>
      </div>
    </nav>
  );
}
