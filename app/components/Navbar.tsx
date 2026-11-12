'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useApp } from '@/app/lib/context';
import { formatDate } from '@/app/lib/logic';
import type { Role } from '@/app/lib/types';

interface NavbarProps {
  mode?: 'public' | 'app';
  onQuickTour?: () => void;
}

export default function Navbar({ mode, onQuickTour }: NavbarProps) {
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isPublic = mode === 'public' || pathname === '/' || (!role && pathname === '/how-it-works');
  const activeRole: Role | null = role;

  if (!isPublic && !activeRole) return null;

  const eligibleCount = getDischargeEligible().length;
  const dischargeBadgeCount = Math.max(eligibleCount, state.dischargeQueue.length);

  const roleLabel: Record<Role, string> = {
    nurse: 'Nurse',
    doctor: 'Doctor',
    admin: 'Admin staff',
  };

  const handleSwitchRole = () => {
    setSettingsOpen(false);
    setRole(null);
    router.push('/');
  };

  const focusDark =
    'focus:outline-none focus:ring-2 focus:ring-[#8FD3CC] focus:ring-offset-2 focus:ring-offset-[#0F2E2D]';

  const publicLinkClass = (active: boolean) =>
    `text-sm transition-colors duration-150 rounded px-1 py-2 ${focusDark} ${
      active
        ? 'text-[#F4F3EE] underline decoration-[#8FD3CC] underline-offset-[6px]'
        : 'text-[#A9C2BF] hover:text-[#F4F3EE] hover:underline hover:decoration-[#8FD3CC] underline-offset-[6px]'
    }`;

  return (
    <>
      {/* Skip to main content */}
      <a
        href="#main-content"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-[#163F3D] focus:text-[#F4F3EE] focus:text-sm focus:font-medium ${focusDark}`}
      >
        Skip to main content
      </a>

      <header className="no-print sticky top-0 z-30 h-16 bg-[#0F2E2D] border-b border-[rgba(244,243,238,0.12)]">
        <div className="max-w-[1120px] mx-auto px-4 h-full flex items-center justify-between gap-4">
          {/* Left: Brand Logo Mark + Wordmark (never truncates) */}
          <Link
            href="/"
            onClick={() => {
              if (pathname !== '/') setRole(null);
            }}
            aria-label="QuarantineCare home"
            className={`inline-flex items-center gap-[10px] shrink-0 rounded py-1 ${focusDark}`}
          >
            <BrandLogo size={20} />
            <span className="font-serif-heading text-[20px] leading-none font-semibold text-[#F4F3EE]">
              QuarantineCare
            </span>
          </Link>

          {/* Right side */}
          {isPublic ? (
            <nav aria-label="Landing navigation" className="flex items-center gap-5 shrink-0">
              <Link
                href="/how-it-works"
                className={publicLinkClass(pathname === '/how-it-works')}
              >
                How it works
              </Link>
              {onQuickTour ? (
                <button
                  type="button"
                  onClick={onQuickTour}
                  className={`${publicLinkClass(false)} cursor-pointer`}
                >
                  Quick tour
                </button>
              ) : (
                <Link href="/#quick-tour" className={publicLinkClass(false)}>
                  Quick tour
                </Link>
              )}
            </nav>
          ) : (
            activeRole && (
              <div className="flex items-center gap-2.5 min-w-0" ref={menuRef}>
                {/* 1. Role pill (visible on mobile & desktop, truncates if needed) */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgba(244,243,238,0.12)] text-xs font-medium text-[#F4F3EE] max-w-[130px] truncate"
                  title={roleLabel[activeRole]}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FD3CC] shrink-0" aria-hidden="true" />
                  <span className="truncate">{roleLabel[activeRole]}</span>
                </span>

                {/* 2. App date chip (desktop >= 768px) */}
                <span
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#163F3D] text-[#A9C2BF] text-xs shrink-0"
                  title="Simulated facility date"
                >
                  <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#8FD3CC]">
                    TODAY
                  </span>
                  <span className="font-mono tabular-nums">{formatDate(state.currentDate)}</span>
                </span>

                {/* 3. Switch role ghost button (desktop >= 768px, 44px tap height) */}
                <button
                  type="button"
                  onClick={handleSwitchRole}
                  className={`hidden md:inline-flex items-center px-3 min-h-[44px] rounded-lg text-xs font-medium text-[#F4F3EE] hover:bg-[#163F3D] transition-colors duration-150 cursor-pointer shrink-0 ${focusDark}`}
                >
                  Switch role
                </button>

                {/* 4. Settings icon button (always visible, 44px tap target) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((v) => !v)}
                    aria-label="Settings"
                    aria-expanded={settingsOpen}
                    aria-haspopup="dialog"
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#F4F3EE] hover:bg-[#163F3D] transition-colors duration-150 cursor-pointer ${focusDark}`}
                  >
                    {settingsOpen ? (
                      <X className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </button>

                  {settingsOpen && (
                    <div
                      role="dialog"
                      aria-label="Settings and demo controls"
                      className="absolute right-0 mt-2 w-72 bg-[#0F2E2D] border border-[rgba(244,243,238,0.12)] rounded-xl shadow-lg p-3 space-y-3 z-50 text-xs text-[#F4F3EE]"
                    >
                      {/* Mobile-only context items moved into settings sheet */}
                      <div className="md:hidden space-y-2 pb-2 border-b border-[rgba(244,243,238,0.12)]">
                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#163F3D] text-[#A9C2BF]">
                          <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#8FD3CC]">
                            TODAY
                          </span>
                          <span className="font-mono tabular-nums">{formatDate(state.currentDate)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSwitchRole}
                          className={`w-full text-left px-2.5 py-2.5 min-h-[44px] rounded-lg hover:bg-[#163F3D] font-medium cursor-pointer ${focusDark}`}
                        >
                          Switch role
                        </button>
                      </div>

                      {/* App Navigation Links inside settings */}
                      <div className="space-y-1 pb-2 border-b border-[rgba(244,243,238,0.12)]">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-[#A9C2BF] px-2 py-0.5">
                          Navigation
                        </p>
                        <Link
                          href="/dashboard"
                          onClick={() => setSettingsOpen(false)}
                          className={`block px-2.5 py-2 rounded-lg hover:bg-[#163F3D] ${focusDark}`}
                        >
                          Ward Board
                        </Link>
                        {(activeRole === 'doctor' || activeRole === 'admin') && (
                          <Link
                            href="/outcomes"
                            onClick={() => setSettingsOpen(false)}
                            className={`block px-2.5 py-2 rounded-lg hover:bg-[#163F3D] ${focusDark}`}
                          >
                            Outcomes
                          </Link>
                        )}
                        {activeRole === 'admin' && (
                          <>
                            <Link
                              href="/discharge"
                              onClick={() => setSettingsOpen(false)}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[#163F3D] ${focusDark}`}
                            >
                              <span>Discharge Queue</span>
                              {dischargeBadgeCount > 0 && (
                                <span className="font-mono tabular-nums px-1.5 py-0.5 rounded bg-[#163F3D] text-[#8FD3CC]">
                                  {dischargeBadgeCount}
                                </span>
                              )}
                            </Link>
                            <Link
                              href="/audit"
                              onClick={() => setSettingsOpen(false)}
                              className={`block px-2.5 py-2 rounded-lg hover:bg-[#163F3D] ${focusDark}`}
                            >
                              Audit Log
                            </Link>
                          </>
                        )}
                        <Link
                          href="/how-it-works"
                          onClick={() => setSettingsOpen(false)}
                          className={`block px-2.5 py-2 rounded-lg hover:bg-[#163F3D] ${focusDark}`}
                        >
                          How it works
                        </Link>
                      </div>

                      {/* Temperature Unit */}
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[#A9C2BF]">Temperature unit</span>
                        <button
                          type="button"
                          onClick={() =>
                            setTemperatureUnit(temperatureUnit === 'C' ? 'F' : 'C')
                          }
                          className={`font-mono tabular-nums px-3 py-1.5 min-h-[36px] rounded-lg bg-[#163F3D] text-[#F4F3EE] cursor-pointer ${focusDark}`}
                        >
                          &deg;{temperatureUnit}
                        </button>
                      </div>

                      {/* Demo Controls */}
                      <div className="space-y-1 pt-2 border-t border-[rgba(244,243,238,0.12)]">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-[#A9C2BF] px-2 py-0.5">
                          Demo controls
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            advanceDay();
                            setSettingsOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#163F3D] text-[#F4F3EE] cursor-pointer ${focusDark}`}
                        >
                          Advance to next day
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resetData();
                            setSettingsOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#163F3D] text-[#F4F3EE] cursor-pointer ${focusDark}`}
                        >
                          Reset demo data
                        </button>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-[#A9C2BF] px-2 pt-1.5">
                          Load scenario
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            loadScenario('normal');
                            setSettingsOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#163F3D] text-[#A9C2BF] hover:text-[#F4F3EE] cursor-pointer ${focusDark}`}
                        >
                          Normal day
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            loadScenario('busy-morning');
                            setSettingsOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#163F3D] text-[#A9C2BF] hover:text-[#F4F3EE] cursor-pointer ${focusDark}`}
                        >
                          Busy morning
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            loadScenario('high-mortality');
                            setSettingsOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#163F3D] text-[#8FD3CC] cursor-pointer ${focusDark}`}
                        >
                          Mortality above expected
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation (app screens only) */}
      {!isPublic && activeRole && (
        <nav
          aria-label="Mobile bottom navigation"
          className="no-print md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E7E5E0] flex items-center justify-around px-1 py-1"
        >
          <Link
            href="/dashboard"
            className={`px-2.5 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center ${
              pathname === '/dashboard' ? 'text-[#1F6F6B] font-semibold' : 'text-[#6B7680]'
            }`}
          >
            Board
          </Link>

          {(activeRole === 'doctor' || activeRole === 'admin') && (
            <Link
              href="/outcomes"
              className={`px-2.5 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center ${
                pathname === '/outcomes' ? 'text-[#1F6F6B] font-semibold' : 'text-[#6B7680]'
              }`}
            >
              Outcomes
            </Link>
          )}

          {activeRole === 'admin' && (
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
      )}
    </>
  );
}
