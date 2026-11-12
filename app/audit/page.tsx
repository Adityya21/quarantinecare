'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { useApp } from '@/app/lib/context';
import type { AuditLogEntry } from '@/app/lib/types';

const actionLabels: Record<AuditLogEntry['action'], string> = {
  temperature_recorded: 'Temp Recorded',
  temperature_corrected: 'Temp Corrected',
  visit_recorded: 'Visit Logged',
  discharge_confirmed: 'Discharge Confirmed',
  discharge_executed: 'Discharge Executed',
  deceased_recorded: 'Deceased Recorded',
};

export default function AuditLogPage() {
  const { role, state } = useApp();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const entries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...state.auditLog]
      .reverse()
      .filter((entry) => {
        if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
        if (
          q &&
          !entry.patientName.toLowerCase().includes(q) &&
          !String(entry.roomNumber).includes(q) &&
          !entry.details.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      });
  }, [state.auditLog, search, actionFilter]);

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white border border-[#e2e0d8] rounded-lg p-8 space-y-3">
            <span className="caption-label text-[#991b1b] font-semibold">Access Restricted</span>
            <h1 className="font-serif-heading text-2xl font-semibold text-[#141413]">
              Audit Log is restricted to Admin staff
            </h1>
            <p className="text-sm text-[#5c5b57]">
              Use the Switch Role control in the top bar to switch to Admin or return to the Ward Board.
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

  return (
    <div className="min-h-screen bg-[#fafaf7] pb-20 md:pb-8">
      <Navbar />

      <main id="main-content" className="max-w-[1120px] mx-auto px-4 py-6 space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="caption-label text-[#5c5b57] font-semibold">
              Immutable Clinical &amp; Admin Trail
            </span>
            <h1 className="font-serif-heading text-3xl sm:text-[34px] font-semibold text-[#141413]">
              Audit Log
            </h1>
          </div>
          <span className="font-mono tabular-nums text-xs text-[#5c5b57]">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} shown
          </span>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by patient, room #, or details..."
            aria-label="Filter audit log"
            className="flex-1 px-3 py-2 min-h-[40px] rounded border border-[#e2e0d8] bg-white text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by action type"
            className="px-3 py-2 min-h-[40px] rounded border border-[#e2e0d8] bg-white text-sm text-[#141413] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
          >
            <option value="all">All Actions</option>
            {Object.entries(actionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e2e0d8] rounded-lg overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead className="bg-[#fafaf7] border-b border-[#e2e0d8] text-[#5c5b57]">
              <tr>
                <th className="text-left py-3 px-3 font-semibold">Timestamp</th>
                <th className="text-left py-3 px-3 font-semibold">Action</th>
                <th className="text-left py-3 px-3 font-semibold">Patient / Room</th>
                <th className="text-left py-3 px-3 font-semibold">Performed By</th>
                <th className="text-left py-3 px-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e0d8]">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5c5b57]">
                    No audit entries match the current filter.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-[#fafaf7]">
                    <td className="py-2.5 px-3 font-mono tabular-nums text-xs text-[#5c5b57] whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded border text-xs font-medium ${
                          e.action === 'deceased_recorded'
                            ? 'border-[#b91c1c] bg-[#fef2f2] text-[#991b1b]'
                            : e.action === 'temperature_corrected'
                            ? 'border-[#d97706] bg-[#fffbeb] text-[#92400e]'
                            : e.action === 'discharge_executed' || e.action === 'discharge_confirmed'
                            ? 'border-[#0f766e] bg-[#f0fdfa] text-[#0f766e]'
                            : 'border-[#e2e0d8] bg-[#fafaf7] text-[#141413]'
                        }`}
                      >
                        {actionLabels[e.action]}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono tabular-nums text-xs text-[#5c5b57] mr-1.5">
                        R{String(e.roomNumber).padStart(2, '0')}
                      </span>
                      <span className="font-medium text-[#141413]">{e.patientName}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#5c5b57]">
                      {e.performedBy}{' '}
                      <span className="uppercase text-[10px] tracking-wider">
                        ({e.performedByRole})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#141413]">{e.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
