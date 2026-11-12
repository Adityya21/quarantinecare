'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SlidersHorizontal, LogOut, Calendar } from 'lucide-react';
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
    resetData,
    loadScenario,
    getDischargeEligible,
  } = useApp();

  const [demoOpen, setDemoOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDemoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!role) return null;

  const currentRole: Role = role;
  const eligibleCount = getDischargeEligible().length;
  const dischargeBadgeCount = Math.max(eligibleCount, state.dischargeQueue.length);

  const navLinkClass = (href: string) => {
    const active = pathname === href;
    return `px-3 py-2 min-h-[40px] inline-flex items-center rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1F6F6B] ${
      active
        ? 'bg-[#1F6F6B] text-white'
        : 'text-[#6B7680] hover:text-[#1F2933] hover:bg-[#F3F2EE]'
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
      <header className="no-print bg-white border-b border-[#E7E5E0] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
            {/* Left: Brand + Desktop Nav */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                onClick={() => setRole(null)}
                className="flex items-center gap-2 text-[#1F2933] font-serif-heading text-xl font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-[#1F6F6B] rounded-lg px-1"
              >
                <span className="inline-block w-2.5 h-2.5 bg-[#1F6F6B] rounded-xs" aria-hidden="true" />
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
                      className={`${navLinkClass('/discharge')} gap-1.5`}
                    >
                      <span>Discharge Queue</span>
                      {dischargeBadgeCount > 0 && (
                        <span className="font-mono tabular-nums px-1.5 py-0.5 text-[11px] font-bold rounded bg-[#1F6F6B] text-white border border-white/30">
                          {dischargeBadgeCount}
                        </span>
                      )}
                    </Link>
                    <Link href="/audit" className={navLinkClass('/audit')}>
                      Audit Log
                    </Link>
                  </>
                )}

                <Link href="/how-it-works" className={navLinkClass('/how-it-works')}>
                  How it works
                </Link>
              </nav>
            </div>

            {/* Right: Active Role Badge + Date + Demo Controls + C/F + Log out */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-[#1F2933]"
                title="Active session role"
              >
                {roleLabel[currentRole]}
              </span>

              <span
                className="hidden sm:inline-flex items-center gap-1.5 font-mono tabular-nums text-xs text-[#6B7680] border-l border-[#E7E5E0] pl-2"
                title="Simulated facility date"
              >
                <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>{formatDate(state.currentDate)}</span>
              </span>

              {/* Demo controls dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setDemoOpen((v) => !v)}
                  aria-expanded={demoOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border border-[#E7E5E0] bg-white text-[#1F2933] hover:border-[#1F6F6B] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#1F6F6B]" strokeWidth={1.5} aria-hidden="true" />
                  <span>Demo controls</span>
                </button>

                {demoOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E7E5E0] rounded-xl shadow-lg p-2 space-y-1 z-50 text-xs"
                  >
                    <p className="caption-label text-[#6B7680] px-2 py-1">
                      Simulated Date: {formatDate(state.currentDate)}
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        advanceDay();
                        setDemoOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FAFAF8] text-[#1F2933] font-medium cursor-pointer"
                    >
                      Advance to next day
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        resetData();
                        setDemoOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FAFAF8] text-[#1F2933] font-medium cursor-pointer"
                    >
                      Reset demo data
                    </button>

                    <div className="border-t border-[#E7E5E0] my-1 pt-1">
                      <p className="caption-label text-[#6B7680] px-2 py-1">
                        Load scenario
                      </p>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          loadScenario('normal');
                          setDemoOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FAFAF8] text-[#1F2933] cursor-pointer"
                      >
                        Normal day
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          loadScenario('busy-morning');
                          setDemoOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FAFAF8] text-[#1F2933] cursor-pointer"
                      >
                        Busy morning (temps pending)
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          loadScenario('high-mortality');
                          setDemoOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FEF2F2] text-[#991B1B] font-medium cursor-pointer"
                      >
                        Mortality above expected
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* C/F toggle */}
              <button
                type="button"
                onClick={() => setTemperatureUnit(temperatureUnit === 'C' ? 'F' : 'C')}
                aria-label={`Switch temperature unit, currently ${temperatureUnit}`}
                className="font-mono tabular-nums px-2.5 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-[#1F2933] hover:bg-[#F3F2EE] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              >
                &deg;{temperatureUnit}
              </button>

              {/* Log out */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border border-[#E7E5E0] bg-white text-[#991B1B] hover:border-[#B91C1C] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile bottom navigation"
        className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E7E5E0] flex items-center justify-around px-1 py-1"
      >
        <Link
          href="/dashboard"
          className={`px-2.5 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center ${
            pathname === '/dashboard' ? 'text-[#1F6F6B] font-semibold' : 'text-[#6B7680]'
          }`}
        >
          Board
        </Link>

        {(currentRole === 'doctor' || currentRole === 'admin') && (
          <Link
            href="/outcomes"
            className={`px-2.5 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center ${
              pathname === '/outcomes' ? 'text-[#1F6F6B] font-semibold' : 'text-[#6B7680]'
            }`}
          >
            Outcomes
          </Link>
        )}

        {currentRole === 'admin' && (
          <>
            <Link
              href="/discharge"
              className={`px-2.5 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center gap-1 ${
                pathname === '/discharge' ? 'text-[#1F6F6B] font-semibold' : 'text-[#6B7680]'
              }`}
            >
              <span>Discharge</span>
              {dischargeBadgeCount > 0 && (
                <span className="font-mono tabular-nums px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#1F6F6B] text-white">
                  {dischargeBadgeCount}
                </span>
              )}
            </Link>
            <Link
              href="/audit"
              className={`px-2.5 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center ${
                pathname === '/audit' ? 'text-[#1F6F6B] font-semibold' : 'text-[#6B7680]'
              }`}
            >
              Audit
            </Link>
          </>
        )}

        <Link
          href="/how-it-works"
          className={`px-2.5 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center ${
            pathname === '/how-it-works' ? 'text-[#1F6F6B] font-semibold' : 'text-[#6B7680]'
          }`}
        >
          Guide
        </Link>
      </nav>
    </>
  );
}
