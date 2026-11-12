'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from './BrandLogo';
import { useApp } from '@/app/lib/context';
import type { Role } from '@/app/lib/types';

interface SiteFooterProps {
  onQuickTour?: () => void;
}

export default function SiteFooter({ onQuickTour }: SiteFooterProps) {
  const router = useRouter();
  const { setRole } = useApp();

  const enterAs = (role: Role) => {
    setRole(role);
    router.push('/dashboard');
  };

  const linkClass =
    'text-sm text-[#F4F3EE] hover:text-[#8FD3CC] hover:underline decoration-[#8FD3CC] underline-offset-[6px] transition-colors duration-150 rounded focus:outline-none focus:ring-2 focus:ring-[#8FD3CC] focus:ring-offset-2 focus:ring-offset-[#0F2E2D]';

  return (
    <footer className="no-print bg-[#0F2E2D] text-[#A9C2BF] border-t border-[rgba(244,243,238,0.12)] mt-auto">
      <div className="max-w-[1120px] mx-auto px-4 pt-12 pb-8 space-y-10">
        {/* Top 3-column layout (mobile: brand stacks, two link groups sit side by side) */}
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              aria-label="QuarantineCare home"
              className="inline-flex items-center gap-[10px] rounded focus:outline-none focus:ring-2 focus:ring-[#8FD3CC] focus:ring-offset-2 focus:ring-offset-[#0F2E2D]"
            >
              <BrandLogo size={22} />
              <span className="font-serif-heading text-[20px] leading-none font-semibold text-[#F4F3EE]">
                QuarantineCare
              </span>
            </Link>
            <p className="text-sm text-[#A9C2BF] max-w-sm leading-relaxed">
              Daily temperatures, doctor visits and discharges for a 74-room quarantine facility.
            </p>
          </div>

          {/* Columns 2 & 3: side by side on mobile */}
          <div className="grid grid-cols-2 md:contents gap-6">
            {/* Column 2: PRODUCT */}
            <div className="space-y-3">
              <p className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#A9C2BF]/70">
                PRODUCT
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/how-it-works" className={linkClass}>
                    How it works
                  </Link>
                </li>
                <li>
                  {onQuickTour ? (
                    <button
                      type="button"
                      onClick={onQuickTour}
                      className={`${linkClass} cursor-pointer text-left`}
                    >
                      Quick tour
                    </button>
                  ) : (
                    <Link href="/#quick-tour" className={linkClass}>
                      Quick tour
                    </Link>
                  )}
                </li>
              </ul>
            </div>

            {/* Column 3: ENTER AS */}
            <div className="space-y-3">
              <p className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#A9C2BF]/70">
                ENTER AS
              </p>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => enterAs('nurse')}
                    className={`${linkClass} cursor-pointer text-left`}
                  >
                    Nurse
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => enterAs('doctor')}
                    className={`${linkClass} cursor-pointer text-left`}
                  >
                    Doctor
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => enterAs('admin')}
                    className={`${linkClass} cursor-pointer text-left`}
                  >
                    Admin staff
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Hairline & Metadata */}
        <div className="border-t border-[rgba(244,243,238,0.12)] pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#A9C2BF]">
          <span>
            Demo prototype. Sign-in is not implemented. Data is stored in this browser only.
          </span>
          <span className="font-mono tabular-nums">Version 0.1</span>
        </div>
      </div>
    </footer>
  );
}

