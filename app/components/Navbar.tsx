'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import { formatDate } from '@/app/lib/logic';
import type { Role } from '@/app/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    role,
    setRole,
    state,
    temperatureUnit,
    setTemperatureUnit,
    advanceDay,
    getDischargeEligible,
  } = useApp();

  if (!role) return null;

  const currentRole: Role = role;
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

  const roleLabel: Record<Role, string> = {
    nurse: 'Nurse',
    doctor: 'Doctor',
    admin: 'Admin',
  };

  const handleLogout = () => {
    setRole(null);
    router.push('/');
  };

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
              </nav>
            </div>

            {/* Right: Current Role Badge + Demo Date + Unit Toggle + Log out */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span
                className="px-2.5 py-1 text-xs font-semibold rounded border border-[#e2e0d8] bg-[#fafaf7] text-[#141413]"
                title="Active session role"
              >
                {roleLabel[currentRole]}
              </span>

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

              {/* Log out */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 min-h-[32px] text-xs font-medium rounded border border-[#e2e0d8] bg-white text-[#991b1b] hover:border-[#b91c1c] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              >
                Log out
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
      </nav>
    </>
  );
}
