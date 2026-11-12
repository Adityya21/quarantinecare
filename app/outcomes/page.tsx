'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { useApp } from '@/app/lib/context';
import { MAX_CAPACITY, SMALL_SAMPLE_THRESHOLD } from '@/app/lib/logic';

export default function OutcomesPage() {
  const { role, getOutcomes, getOccupancy, getDischargeEligible } = useApp();

  if (role === 'nurse') {
    return (
      <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white border border-[#e2e0d8] rounded-lg p-8 space-y-3">
            <span className="caption-label text-[#991b1b] font-semibold">Access Restricted</span>
            <h1 className="font-serif-heading text-2xl font-semibold text-[#141413]">
              Outcomes Dashboard is restricted to Doctor and Admin roles
            </h1>
            <p className="text-sm text-[#5c5b57]">
              Use the Switch Role control in the top bar or return to the Ward Board.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-2 px-4 py-2.5 rounded bg-[#0f766e] text-white text-sm font-medium"
            >
              Return to Ward Board
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const outcomes = getOutcomes();
  const occupancy = getOccupancy();
  const eligible = getDischargeEligible().length;
  const totalClosed = outcomes.discharged + outcomes.deceased;

  const mortalityPct =
    outcomes.mortalityRate !== null ? outcomes.mortalityRate * 100 : null;
  const successPct =
    outcomes.successRate !== null ? outcomes.successRate * 100 : null;

  // Position on 0% - 30% horizontal gauge track
  const markerLeftPct =
    mortalityPct !== null ? Math.min(100, Math.max(0, (mortalityPct / 30) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-1">
          <span className="caption-label text-[#5c5b57] font-semibold">
            Clinical Performance &amp; Quality Benchmark
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-[34px] font-semibold text-[#141413]">
            Treatment Outcomes
          </h1>
          <p className="text-sm text-[#5c5b57]">
            Comparing closed-case outcomes against the expected 15% mortality / 85% success benchmark.
          </p>
        </header>

        {/* Alert banner when mortality > 15% */}
        {outcomes.isAboveBenchmark && mortalityPct !== null && (
          <div
            role="alert"
            className="p-4 rounded-lg border border-[#b91c1c] bg-[#fef2f2] text-[#991b1b] text-sm"
          >
            <strong>Alert:</strong> Facility mortality rate (
            <span className="font-mono tabular-nums font-bold">
              {mortalityPct.toFixed(1)}%
            </span>
            ) exceeds the 15.0% expected benchmark. Review clinical protocols immediately.
          </div>
        )}

        {/* Small sample note (< 20 closed cases) */}
        {outcomes.isSmallSample && (
          <div className="p-3.5 rounded-lg border border-[#e2e0d8] bg-white text-xs text-[#5c5b57]">
            <strong>Small sample note (ASSUMPTION &lt; {SMALL_SAMPLE_THRESHOLD} cases):</strong>{' '}
            Only{' '}
            <span className="font-mono tabular-nums font-semibold text-[#141413]">
              {totalClosed}
            </span>{' '}
            closed {totalClosed === 1 ? 'case' : 'cases'} recorded. Percentages may be statistically volatile until at least {SMALL_SAMPLE_THRESHOLD} cases close.
          </div>
        )}

        {/* HORIZONTAL MORTALITY GAUGE (0% to 30%, tick at 15%) */}
        <section
          aria-label="Mortality rate gauge"
          className="bg-white border border-[#e2e0d8] rounded-lg p-6 space-y-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="caption-label text-[#5c5b57] font-semibold block">
                Mortality Rate vs. 15% Benchmark
              </span>
              <p className="font-mono tabular-nums text-3xl font-bold text-[#141413] mt-1">
                {mortalityPct !== null ? `${mortalityPct.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <span className="caption-label text-[#5c5b57] block">
                Success Rate (Target &ge; 85%)
              </span>
              <p
                className={`font-mono tabular-nums text-2xl font-bold mt-1 ${
                  successPct === null
                    ? 'text-[#5c5b57]'
                    : successPct >= 85
                    ? 'text-[#0f766e]'
                    : 'text-[#b91c1c]'
                }`}
              >
                {successPct !== null ? `${successPct.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>

          {totalClosed === 0 ? (
            <p className="text-sm text-[#5c5b57] py-4 border-t border-[#e2e0d8]">
              No closed cases yet. Mortality and success rates display as N/A until a patient is discharged or recorded as deceased.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Gauge Track */}
              <div className="relative pt-6 pb-7">
                {/* Track bar: 0% to 30% */}
                <div className="h-2.5 w-full rounded-full bg-[#e2e0d8] relative">
                  {/* Safe zone 0-15% (left half) */}
                  <div className="h-full w-1/2 bg-[#e6f0e8] rounded-l-full border-r border-[#141413]" />
                </div>

                {/* Fixed tick at 15% (50% of 0-30% track) */}
                <div
                  className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center"
                  aria-label="Expected 15% benchmark"
                >
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-[#141413] whitespace-nowrap mb-1">
                    Expected (15%)
                  </span>
                  <div className="w-[2px] h-5 bg-[#141413]" />
                </div>

                {/* Facility current rate marker */}
                {mortalityPct !== null && (
                  <div
                    className="absolute top-7 -translate-x-1/2 flex flex-col items-center transition-all duration-150"
                    style={{ left: `${markerLeftPct}%` }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        outcomes.isAboveBenchmark ? 'bg-[#b91c1c]' : 'bg-[#0f766e]'
                      }`}
                    />
                    <span
                      className={`font-mono tabular-nums text-xs font-bold mt-1 whitespace-nowrap ${
                        outcomes.isAboveBenchmark ? 'text-[#b91c1c]' : 'text-[#0f766e]'
                      }`}
                    >
                      Facility: {mortalityPct.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Scale labels */}
                <div className="flex justify-between font-mono tabular-nums text-[11px] text-[#5c5b57] mt-5">
                  <span>0%</span>
                  <span>15%</span>
                  <span>30%+</span>
                </div>
              </div>

              {/* Simple count line */}
              <p className="font-mono tabular-nums text-sm font-medium text-[#141413] pt-3 border-t border-[#e2e0d8]">
                Cured {outcomes.discharged}, Deceased {outcomes.deceased}, Closed cases {totalClosed}
              </p>
            </div>
          )}
        </section>

        {/* Facility Bed Summary */}
        <section className="bg-white border border-[#e2e0d8] rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="caption-label text-[#5c5b57] block">Occupied Beds</span>
            <span className="font-mono tabular-nums text-xl font-bold text-[#141413]">
              {occupancy} of {MAX_CAPACITY}
            </span>
          </div>
          <div>
            <span className="caption-label text-[#5c5b57] block">Available Beds</span>
            <span className="font-mono tabular-nums text-xl font-bold text-[#0f766e]">
              {MAX_CAPACITY - occupancy}
            </span>
          </div>
          <div>
            <span className="caption-label text-[#5c5b57] block">Eligible for Discharge</span>
            <span className="font-mono tabular-nums text-xl font-bold text-[#141413]">
              {eligible}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
