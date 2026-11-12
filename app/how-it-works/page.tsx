'use client';

import React from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] px-4 py-10 sm:py-16">
      <main className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2 border-b border-[#e2e0d8] pb-5">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-[#0f766e] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0f766e] rounded"
          >
            &larr; Back to role selection
          </Link>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#141413]">
            How QuarantineCare Works
          </h1>
          <p className="text-sm text-[#5c5b57]">
            Daily clinical workflow for the 74-room quarantine and treatment facility.
          </p>
        </header>

        <section className="bg-white border border-[#e2e0d8] rounded-lg p-6 space-y-4 text-sm text-[#141413]">
          <div className="space-y-1">
            <span className="caption-label text-[#0f766e] font-semibold">1. Nurse — Daily Temperature Rounds</span>
            <p className="text-[#5c5b57]">
              Nurses use the Ward Board or Round Mode to record one official temperature per patient per day (valid range 34.0&deg;C–43.0&deg;C). Duplicate same-day entries are blocked with a warning showing the existing reading.
            </p>
          </div>

          <div className="space-y-1 pt-3 border-t border-[#e2e0d8]">
            <span className="caption-label text-[#0f766e] font-semibold">2. Doctor — Sequenced Visits &amp; Discharge Readiness</span>
            <p className="text-[#5c5b57]">
              Doctor visits remain locked until today&apos;s temperature is recorded. Once unlocked, Round Mode surfaces fever patients (&ge; 38.0&deg;C) first. Patients with 3 consecutive fever-free days (with no missing days) are flagged eligible for Doctor confirmation.
            </p>
          </div>

          <div className="space-y-1 pt-3 border-t border-[#e2e0d8]">
            <span className="caption-label text-[#0f766e] font-semibold">3. Admin — Bed Turnover, Outcomes &amp; Audit</span>
            <p className="text-[#5c5b57]">
              Admin executes Doctor-confirmed discharges to free rooms, tracks facility mortality against the 15% expected benchmark, and reviews the immutable audit log of all readings, corrections, visits, and outcomes.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

