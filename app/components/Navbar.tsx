'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import { formatDate } from '@/app/lib/logic';
import type { Role } from '@/app/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const {
    role,
    setRole,
    state,
    temperatureUnit,
    setTemperatureUnit,
    advanceDay,
    getDischargeEligible,
  } = useApp();

  const currentRole: Role = role ?? 'nurse';
  const eligibleCount = getDischargeEligible().length;
  const dischargeBadgeCount = Math.max(eligibleCount, state.dischargeQueue.length);

  const navLinkClass = (href: string) => {
    const active = pathname === href;
    return `px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0f766e] ${
      active
        ? 'bg-[#0f766e] text-white'
        : 'text-[#5c5b57] hover:text-[#141413] hover:bg-[#f1efe8]'
    }`;
  };

  const roles: { key: Role; label: string }[] = [
    { key: 'nurse', label: 'Nurse' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'admin', label: 'Admin' },
  ];

  return (
    <>
      <header className="bg-white border-b border-[#e2e0d8] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
            {/* Left: Brand + Desktop Nav */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-[#141413] font-serif-heading text-xl font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-[#0f766e] rounded px-1"
              >
                <span className="inline-block w-2.5 h-2.5 bg-[#0f766e] rounded-xs" aria-hidden="true" />
                <span>QuarantineCare</span>
              </Link>

              <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                  Ward Board
                </Link>

                {(currentRole === 'doctor' || currentRole === 'admin') && (
                  <Link href="/outcomes" className={navLinkClass('/outcomes')}>
                    Outcomes
                  </Link>
                )}

                {currentRole === 'admin' && (
                  <>
                    <Link
                      href="/discharge"
                      className={`${navLinkClass('/discharge')} flex items-center gap-1.5`}
                    >
                      <span>Discharge Queue</span>
                      {dischargeBadgeCount > 0 && (
                        <span className="font-mono tabular-nums px-1.5 py-0.5 text-[11px] font-bold rounded bg-[#0f766e] text-white border border-white/30">
                          {dischargeBadgeCount}
                        </span>
                      )}
                    </Link>
                    <Link href="/audit" className={navLinkClass('/audit')}>
                      Audit Log
                    </Link>
                  </>
                )}

                <Link href="/submission" className={navLinkClass('/submission')}>
                  Submission
                </Link>
              </nav>
            </div>

            {/* Right: Persistent Switch Role + Demo Date + Unit Toggle */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Switch role segmented control */}
              <div className="flex items-center gap-1.5">
                <span className="caption-label text-[#5c5b57] hidden xl:inline">
                  Switch role
                </span>
                <div
                  role="group"
                  aria-label="Switch role"
                  className="inline-flex rounded border border-[#e2e0d8] bg-[#fafaf7] p-0.5"
                >
                  {roles.map((r) => {
                    const active = role === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key)}
                        aria-pressed={active}
                        className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e] ${
                          active
                            ? 'bg-[#141413] text-white'
                            : 'text-[#5c5b57] hover:text-[#141413]'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulated date + Demo Next Day */}
              <div className="flex items-center gap-1.5 border-l border-[#e2e0d8] pl-2 sm:pl-3">
                <span
                  className="font-mono tabular-nums text-xs text-[#5c5b57] hidden sm:inline"
                  title="Simulated facility date"
                >
                  {formatDate(state.currentDate)}
                </span>
                <button
                  type="button"
                  onClick={advanceDay}
                  className="px-2.5 py-1.5 min-h-[32px] text-xs font-medium rounded border border-[#0f766e] text-[#0f766e] bg-white hover:bg-[#f0fdfa] transition-colors duration-150 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                  title="Demo control: Advance simulated date by 1 day"
                >
                  Demo: Next Day
                </button>
              </div>

              {/* C/F toggle */}
              <button
                type="button"
                onClick={() => setTemperatureUnit(temperatureUnit === 'C' ? 'F' : 'C')}
                aria-label={`Switch temperature unit, currently ${temperatureUnit}`}
                className="font-mono tabular-nums px-2.5 py-1.5 min-h-[32px] text-xs font-medium rounded border border-[#e2e0d8] bg-[#fafaf7] text-[#141413] hover:bg-[#f1efe8] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                &deg;{temperatureUnit}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#e2e0d8] flex items-center justify-around px-1 py-1.5"
      >
        <Link
          href="/dashboard"
          className={`px-2.5 py-2 rounded text-xs font-medium min-h-[40px] flex items-center ${
            pathname === '/dashboard' ? 'text-[#0f766e] font-semibold' : 'text-[#5c5b57]'
          }`}
        >
          Board
        </Link>

        {(currentRole === 'doctor' || currentRole === 'admin') && (
          <Link
            href="/outcomes"
            className={`px-2.5 py-2 rounded text-xs font-medium min-h-[40px] flex items-center ${
              pathname === '/outcomes' ? 'text-[#0f766e] font-semibold' : 'text-[#5c5b57]'
            }`}
          >
            Outcomes
          </Link>
        )}

        {currentRole === 'admin' && (
          <>
            <Link
              href="/discharge"
              className={`px-2.5 py-2 rounded text-xs font-medium min-h-[40px] flex items-center gap-1 ${
                pathname === '/discharge' ? 'text-[#0f766e] font-semibold' : 'text-[#5c5b57]'
              }`}
            >
              <span>Discharge</span>
              {dischargeBadgeCount > 0 && (
                <span className="font-mono tabular-nums px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#0f766e] text-white">
                  {dischargeBadgeCount}
                </span>
              )}
            </Link>
            <Link
              href="/audit"
              className={`px-2.5 py-2 rounded text-xs font-medium min-h-[40px] flex items-center ${
                pathname === '/audit' ? 'text-[#0f766e] font-semibold' : 'text-[#5c5b57]'
              }`}
            >
              Audit
            </Link>
          </>
        )}

        <Link
          href="/submission"
          className={`px-2.5 py-2 rounded text-xs font-medium min-h-[40px] flex items-center ${
            pathname === '/submission' ? 'text-[#0f766e] font-semibold' : 'text-[#5c5b57]'
          }`}
        >
          Submission
        </Link>
      </nav>
    </>
  );
}
