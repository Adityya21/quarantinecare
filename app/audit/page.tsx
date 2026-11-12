'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/app/lib/context';
import Navbar from '@/app/components/Navbar';
import type { AuditLogEntry } from '@/app/lib/types';

const ACTION_LABELS: Record<AuditLogEntry['action'], string> = {
  temperature_recorded: 'Temp Recorded',
  temperature_corrected: 'Temp Corrected',
  visit_recorded: 'Visit Recorded',
  discharge_confirmed: 'Discharge Confirmed',
  discharge_executed: 'Discharge Executed',
  deceased_recorded: 'Deceased Recorded',
};

const ACTION_COLORS: Record<AuditLogEntry['action'], string> = {
  temperature_recorded: 'bg-green-100 text-green-700',
  temperature_corrected: 'bg-orange-100 text-orange-700',
  visit_recorded: 'bg-blue-100 text-blue-700',
  discharge_confirmed: 'bg-purple-100 text-purple-700',
  discharge_executed: 'bg-purple-100 text-purple-700',
  deceased_recorded: 'bg-red-100 text-red-700',
};

const ROLE_COLORS: Record<string, string> = {
  nurse: 'bg-emerald-100 text-emerald-700',
  doctor: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function AuditPage() {
  const { role, state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Access denied for non-admin
  if (role !== 'admin') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
            <p className="text-slate-500 mb-6">
              The Audit Log is only accessible to administrators.
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

  // Filter and sort entries (newest first)
  const filteredEntries = useMemo(() => {
    let entries = [...state.auditLog];

    // Filter by search query (patient name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      entries = entries.filter(
        (e) =>
          e.patientName.toLowerCase().includes(q) ||
          e.performedBy.toLowerCase().includes(q)
      );
    }

    // Filter by action type
    if (actionFilter !== 'all') {
      entries = entries.filter((e) => e.action === actionFilter);
    }

    // Sort newest first
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return entries;
  }, [state.auditLog, searchQuery, actionFilter]);

  const actionTypes = Array.from(new Set(state.auditLog.map((e) => e.action)));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
              <p className="text-sm text-slate-500">
                {filteredEntries.length} of {state.auditLog.length} entries
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by patient or staff name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 min-h-12 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 min-h-12 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All Actions</option>
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {ACTION_LABELS[action]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Entries */}
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              {state.auditLog.length === 0
                ? 'No audit log entries yet.'
                : 'No entries match your filters.'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Timestamp
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Action
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Patient
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Performed By
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {formatTimestamp(entry.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.action]}`}
                          >
                            {ACTION_LABELS[entry.action]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{entry.patientName}</div>
                          <div className="text-xs text-slate-400">Room {entry.roomNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700">{entry.performedBy}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${
                                ROLE_COLORS[entry.performedByRole] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {entry.performedByRole}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {entry.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.action]}`}
                      >
                        {ACTION_LABELS[entry.action]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {entry.patientName}
                      <span className="text-slate-400 font-normal"> · Room {entry.roomNumber}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      By {entry.performedBy}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          ROLE_COLORS[entry.performedByRole] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {entry.performedByRole}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2">{entry.details}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
