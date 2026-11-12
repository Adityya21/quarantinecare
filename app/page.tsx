'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import type { Role } from '@/app/lib/types';

const roles: {
  role: Role;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    role: 'nurse',
    title: 'Nurse',
    subtitle: 'Daily Temperature Rounds',
    description:
      'View the 74-room Ward Board with the Nurse lens, run focused temperature rounds, and prevent duplicate same-day readings.',
  },
  {
    role: 'doctor',
    title: 'Doctor',
    subtitle: 'Clinical Visits & Outcomes',
    description:
      'Review fever-free streaks, log daily visits (unlocked only after temperature is taken), confirm discharge readiness, and record outcomes.',
  },
  {
    role: 'admin',
    title: 'Admin',
    subtitle: 'Discharges, Occupancy & Audit',
    description:
      'Execute doctor-confirmed discharges to free beds, monitor mortality vs. the 15% benchmark, and inspect the full audit log.',
  },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const { setRole, resetData } = useApp();

  const handleSelectRole = (selected: Role) => {
    setRole(selected);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col justify-between px-4 py-10 sm:py-16">
      <main className="max-w-4xl mx-auto w-full space-y-10">
        {/* Header */}
        <header className="space-y-3 border-b border-[#e2e0d8] pb-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#0f766e] rounded-xs" aria-hidden="true" />
            <span className="caption-label text-[#5c5b57] font-semibold">
              74-Bed Quarantine &amp; Treatment Facility
            </span>
          </div>
          <h1 className="font-serif-heading text-4xl sm:text-[42px] font-semibold text-[#141413] leading-tight">
            QuarantineCare
          </h1>
          <p className="text-base text-[#5c5b57] max-w-2xl">
            Architectural Ward Board for daily temperature tracking, sequenced doctor visits, 3-day fever-free discharge readiness, and outcomes benchmarking.
          </p>
        </header>

        {/* Role Cards */}
        <section aria-label="Select role" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => handleSelectRole(item.role)}
              className="group bg-white border border-[#e2e0d8] hover:border-[#0f766e] rounded-lg p-6 text-left transition-colors duration-150 flex flex-col justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
            >
              <div className="space-y-2">
                <span className="caption-label text-[#0f766e] font-semibold block">
                  {item.subtitle}
                </span>
                <h2 className="font-serif-heading text-2xl font-semibold text-[#141413]">
                  {item.title}
                </h2>
                <p className="text-sm text-[#5c5b57] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <span className="inline-flex items-center text-sm font-semibold text-[#0f766e] group-hover:underline">
                Enter as {item.title} &rarr;
              </span>
            </button>
          ))}
        </section>

        {/* Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e2e0d8] text-xs text-[#5c5b57]">
          <p>
            Demo prototype with localStorage persistence. Real authentication and role-based SSO are deferred to post-MVP.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/submission"
              className="px-3 py-2 rounded border border-[#e2e0d8] bg-white text-[#141413] font-medium hover:border-[#0f766e] transition-colors"
            >
              Assessment Submission &amp; Rules
            </Link>
            <button
              type="button"
              onClick={() => {
                resetData();
                router.refresh();
              }}
              className="px-3 py-2 rounded border border-[#e2e0d8] bg-white text-[#991b1b] font-medium hover:border-[#b91c1c] transition-colors cursor-pointer"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
