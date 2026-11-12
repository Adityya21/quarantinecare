'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/app/lib/context';
import {
  calculateMortalityRate,
  calculateSuccessRate,
  isMortalityAboveBenchmark,
  isSmallSample,
  MAX_CAPACITY,
  MORTALITY_BENCHMARK,
  SUCCESS_BENCHMARK,
} from '@/app/lib/logic';
import Navbar from '@/app/components/Navbar';

export default function OutcomesPage() {
  const { role, state, getOccupancy, getDischargeEligible } = useApp();

  // Access denied for nurse
  if (role === 'nurse') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
            <p className="text-slate-500 mb-6">
              The Outcomes Dashboard is only accessible to doctors and administrators.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Compute stats
  const discharged = state.patients.filter((p) => p.status === 'discharged').length;
  const deceased = state.patients.filter((p) => p.status === 'deceased').length;
  const totalClosed = discharged + deceased;

  const mortalityRate = calculateMortalityRate(discharged, deceased);
  const successRate = calculateSuccessRate(discharged, deceased);
  const aboveBenchmark = isMortalityAboveBenchmark(discharged, deceased);
  const smallSample = isSmallSample(discharged, deceased);

  const occupancy = getOccupancy();
  const availableBeds = MAX_CAPACITY - occupancy;
  const eligibleCount = getDischargeEligible().length;

  const formatRate = (rate: number | null): string => {
    if (rate === null) return 'N/A';
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Treatment Outcomes</h1>
          <p className="text-sm text-slate-500 mb-6">
            Performance metrics and treatment outcome analysis.
          </p>

          {/* Mortality Alert Banner */}
          {aboveBenchmark && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-800 font-medium flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                ALERT: Mortality rate ({formatRate(mortalityRate)}) exceeds the 15% benchmark. Review treatment protocols.
              </span>
            </div>
          )}

          {/* ASSUMPTION: Small sample warning when closed cases < 20 */}
          {smallSample && totalClosed > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-start gap-2">
              <span className="text-lg">📊</span>
              <span>
                Note: Only {totalClosed} closed case{totalClosed !== 1 ? 's' : ''} recorded.
                Percentages may not be statistically reliable (small sample size &lt; 20 cases).
              </span>
            </div>
          )}

          {totalClosed === 0 && (
            <div className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm text-center">
              No closed cases yet. Metrics will appear once patients are discharged or recorded as deceased.
            </div>
          )}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            <MetricCard
              label="Total Closed"
              value={totalClosed.toString()}
              sublabel="discharged + deceased"
              color="slate"
            />
            <MetricCard
              label="Cured & Discharged"
              value={discharged.toString()}
              sublabel={totalClosed > 0 ? `${((discharged / totalClosed) * 100).toFixed(1)}%` : 'N/A'}
              color="green"
            />
            <MetricCard
              label="Deceased"
              value={deceased.toString()}
              sublabel={totalClosed > 0 ? `${((deceased / totalClosed) * 100).toFixed(1)}%` : 'N/A'}
              color="red"
            />
            <MetricCard
              label="Mortality Rate"
              value={formatRate(mortalityRate)}
              sublabel={aboveBenchmark ? '> 15% benchmark' : '≤ 15% benchmark'}
              color={aboveBenchmark ? 'red' : 'green'}
              highlight={aboveBenchmark}
            />
            <MetricCard
              label="Success Rate"
              value={formatRate(successRate)}
              sublabel={successRate !== null && successRate >= SUCCESS_BENCHMARK ? '≥ 85% target' : '< 85% target'}
              color={successRate !== null && successRate >= SUCCESS_BENCHMARK ? 'green' : 'amber'}
            />
          </div>

          {/* Current Facility Status */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Current Facility Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500 mb-1">Occupied Beds</div>
                <div className="text-2xl font-bold text-slate-800">
                  {occupancy}<span className="text-base text-slate-400">/{MAX_CAPACITY}</span>
                </div>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${(occupancy / MAX_CAPACITY) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500 mb-1">Available Beds</div>
                <div className="text-2xl font-bold text-teal-600">{availableBeds}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500 mb-1">Eligible for Discharge</div>
                <div className="text-2xl font-bold text-green-600">{eligibleCount}</div>
              </div>
            </div>
          </section>

          {/* Benchmark Comparison */}
          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Benchmark Comparison</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
              {/* Mortality Benchmark */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Mortality Rate</span>
                  <div className="text-sm text-slate-500">
                    Expected: <span className="font-semibold">{(MORTALITY_BENCHMARK * 100).toFixed(0)}%</span>
                    {' · '}
                    Actual:{' '}
                    <span
                      className={`font-semibold ${
                        aboveBenchmark ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatRate(mortalityRate)}
                    </span>
                  </div>
                </div>
                <div className="relative w-full bg-slate-100 rounded-full h-4">
                  {/* Benchmark marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${MORTALITY_BENCHMARK * 100}%` }}
                    title={`Benchmark: ${(MORTALITY_BENCHMARK * 100).toFixed(0)}%`}
                  />
                  {/* Actual bar */}
                  <div
                    className={`h-4 rounded-full transition-all ${
                      aboveBenchmark ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: mortalityRate !== null ? `${Math.min(mortalityRate * 100, 100)}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Success Benchmark */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Success Rate</span>
                  <div className="text-sm text-slate-500">
                    Expected: <span className="font-semibold">{(SUCCESS_BENCHMARK * 100).toFixed(0)}%</span>
                    {' · '}
                    Actual:{' '}
                    <span
                      className={`font-semibold ${
                        successRate !== null && successRate >= SUCCESS_BENCHMARK
                          ? 'text-green-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {formatRate(successRate)}
                    </span>
                  </div>
                </div>
                <div className="relative w-full bg-slate-100 rounded-full h-4">
                  {/* Benchmark marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${SUCCESS_BENCHMARK * 100}%` }}
                    title={`Benchmark: ${(SUCCESS_BENCHMARK * 100).toFixed(0)}%`}
                  />
                  {/* Actual bar */}
                  <div
                    className={`h-4 rounded-full transition-all ${
                      successRate !== null && successRate >= SUCCESS_BENCHMARK
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: successRate !== null ? `${Math.min(successRate * 100, 100)}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/* ── Metric Card ────────────────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sublabel,
  color,
  highlight,
}: {
  label: string;
  value: string;
  sublabel: string;
  color: 'green' | 'red' | 'amber' | 'slate';
  highlight?: boolean;
}) {
  const borderColor = highlight ? 'border-red-300' : 'border-slate-200';
  const bgColor = highlight ? 'bg-red-50' : 'bg-white';

  const valueColor: Record<string, string> = {
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    slate: 'text-slate-800',
  };

  return (
    <div className={`${bgColor} rounded-xl border ${borderColor} p-4`}>
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueColor[color]}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sublabel}</div>
    </div>
  );
}
