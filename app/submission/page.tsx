'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { useApp } from '@/app/lib/context';

export default function SubmissionPage() {
  const { role } = useApp();

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Assessment Submission &amp; System Rules
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                QuarantineCare MVP — Product Specification, Architecture, Business Rules &amp; Sprint Prioritization
              </p>
            </div>
            {!role && (
              <Link
                href="/"
                className="px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                ← Select Role
              </Link>
            )}
          </div>

          {/* Quick Jump Nav */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            <a href="#q1" className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700">
              Q1: Roles &amp; Features
            </a>
            <a href="#q2" className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700">
              Q2: UI Flow &amp; Workflows
            </a>
            <a href="#q3" className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700">
              Q3: Business Rules
            </a>
            <a href="#q4" className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700">
              Q4: Sprint Prioritization
            </a>
            <a href="#assumptions" className="px-3 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-xs font-medium text-amber-800">
              Assumptions Made
            </a>
          </div>
        </div>

        {/* Q1 */}
        <section id="q1" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Q1. User Types &amp; Feature Matrix (MVP vs. Later)
          </h2>
          <p className="text-sm text-slate-600">
            The facility has three distinct operational roles: <strong>Nurse</strong> (daily temperature collection),{' '}
            <strong>Doctor</strong> (clinical review, daily visits, treatment notes, discharge confirmation, outcome recording), and{' '}
            <strong>Admin</strong> (bed occupancy, discharge execution, outcomes benchmarking, audit oversight).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="p-3 border border-slate-200 font-semibold">Feature</th>
                  <th className="p-3 border border-slate-200 font-semibold text-center">Nurse</th>
                  <th className="p-3 border border-slate-200 font-semibold text-center">Doctor</th>
                  <th className="p-3 border border-slate-200 font-semibold text-center">Admin</th>
                  <th className="p-3 border border-slate-200 font-semibold text-center">Phase</th>
                  <th className="p-3 border border-slate-200 font-semibold">Problem Statement Traceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">View 74-room grid &amp; daily status chips</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;no one knows which patients have had their temperatures measured, and which patients have been visited&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">Record daily temperature (with duplicate guard)</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Correct only</td>
                  <td className="p-3 border border-slate-200 text-center">Correct only</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;measured multiple times on the same day, and sometimes... not measured at all&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">View patient temperature history &amp; 3-day streak</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;doctor reviews these journals when deciding what treatment to administer&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">Record doctor visit &amp; notes (blocked if no temp)</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;doctor visits a patient before their temperature has been taken – doctor has to waste precious minutes&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">Auto-flag &amp; confirm discharge readiness (3+ days)</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;cured once they have reported 3 full days without a fever&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">Discharge queue, in-app badge &amp; execute discharge</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center">View only</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;patients end up staying an extra day or two... doctors fail to promptly inform admin staff&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">Record Deceased outcome</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;track the quality of our treatment... mortality rate&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">Outcomes dashboard vs. 15% / 85% benchmark</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">&ldquo;no way of measuring our performance against the 85% success rate benchmark&rdquo;</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-medium">Audit log of all clinical &amp; admin actions</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center">No</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">MVP</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">Accountability for temperature corrections, discharges, and outcomes</td>
                </tr>
                <tr className="bg-[#fafaf7]">
                  <td className="p-3 border border-slate-200 font-medium">Real authentication &amp; SSO / RBAC</td>
                  <td className="p-3 border border-slate-200 text-center">All</td>
                  <td className="p-3 border border-slate-200 text-center">All</td>
                  <td className="p-3 border border-slate-200 text-center">All</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-semibold">Later</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">Production security; MVP uses a simple role picker to ship ASAP</td>
                </tr>
                <tr className="bg-[#fafaf7]">
                  <td className="p-3 border border-slate-200 font-medium">SMS / push alerts for discharge &amp; high mortality</td>
                  <td className="p-3 border border-slate-200 text-center">—</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-semibold">Later</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">Nice-to-have escalation; MVP uses in-app badge &amp; banner</td>
                </tr>
                <tr className="bg-[#fafaf7]">
                  <td className="p-3 border border-slate-200 font-medium">Staff shift scheduling &amp; workload balancing</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center">Yes</td>
                  <td className="p-3 border border-slate-200 text-center"><span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-semibold">Later</span></td>
                  <td className="p-3 border border-slate-200 text-slate-600">Addresses &ldquo;understaffed&rdquo; long-term; nice-to-have after core tracking</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Q2 */}
        <section id="q2" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Q2. Screen-by-Screen UI Flow &amp; Feature Workflows
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-[#fafaf7] border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-800">Screen-by-Screen Flow</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                <li><strong>Role Select (<code>/</code>):</strong> User picks Nurse, Doctor, or Admin.</li>
                <li><strong>Dashboard / Room Grid (<code>/dashboard</code>):</strong> 74 colour-coded rooms, summary counters (Occupied/74, Temps Pending, Visits Pending, Eligible), filters, and search.</li>
                <li><strong>Patient Detail (<code>/patient/[id]</code>):</strong> Temp history table, fever-free streak counter, visit history, status chips, and role-gated actions.</li>
                <li><strong>Record Temperature Modal:</strong> Nurse enters daily temp; validates 34.0–43.0°C; warns on duplicate; Doctor/Admin can correct with reason.</li>
                <li><strong>Record Visit Modal:</strong> Doctor enters notes; disabled with warning if today&apos;s temp is missing; optional discharge confirmation if streak &ge; 3.</li>
                <li><strong>Discharge Queue (<code>/discharge</code>):</strong> Admin views Doctor-confirmed &amp; newly eligible patients and executes discharge to free rooms.</li>
                <li><strong>Outcomes Dashboard (<code>/outcomes</code>):</strong> Admin/Doctor view mortality &amp; success rates vs. 15%/85% benchmarks, alert banner, small-sample note.</li>
                <li><strong>Audit Log (<code>/audit</code>):</strong> Admin reviews timestamped history of every entry, correction, visit, discharge, and death.</li>
              </ol>
            </div>

            <div className="p-4 rounded-lg bg-[#fafaf7] border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-800">Core Feature Workflows</h3>
              <ul className="space-y-2 text-slate-700">
                <li><strong>Temperature Recording:</strong> Nurse filters &ldquo;Awaiting Temperature&rdquo; &rarr; taps room &rarr; enters temp &rarr; system validates range &amp; checks for today&apos;s duplicate &rarr; saves in °C, updates chip to green, recalculates streak &amp; eligibility.</li>
                <li><strong>Doctor Visit:</strong> Doctor filters &ldquo;Awaiting Doctor Visit&rdquo; &rarr; taps room &rarr; if no temp today, &ldquo;Record Visit&rdquo; is blocked &rarr; if temp exists, Doctor records notes &amp; optionally confirms discharge.</li>
                <li><strong>Discharge Flow:</strong> 3 consecutive fever-free days &rarr; auto-flagged eligible &rarr; Doctor confirms &rarr; Admin notified via badge &rarr; Admin executes discharge &rarr; room freed (status = discharged).</li>
                <li><strong>Deceased Outcome:</strong> Doctor clicks &ldquo;Record Deceased&rdquo; &rarr; confirms irreversible dialog &rarr; room freed &rarr; Outcomes Dashboard recalculates mortality vs. 15% benchmark.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto">
            <div className="text-teal-300 font-bold mb-2">DAILY WORKFLOW FLOWCHART</div>
            <pre className="leading-relaxed">{`[Start of Day]
      │
      ▼
[Nurse: Filter "Awaiting Temp"] ──► [Enter Temp (34.0–43.0°C)]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼ (Already recorded today)                    ▼ (First entry today)
         [Show Duplicate Warning]                      [Save in °C + Update "Temp Taken" Green]
         [Block Nurse Overwrite]                                  │
                                                                  ▼
                                                       [Recalculate Fever-Free Streak]
                                                                  │
                                            ┌─────────────────────┴─────────────────────┐
                                            ▼ (Streak < 3)                              ▼ (Streak >= 3)
                                 [Continue Monitoring]                       [Auto-Flag Eligible + Notify Admin]
                                            │                                           │
                                            └─────────────────────┬─────────────────────┘
                                                                  ▼
[Doctor: Open Patient] ──► {Temp Taken Today?} ──(NO)──► [Block "Record Visit" + Show Warning]
                                  │
                                (YES)
                                  ▼
                       [Record Visit & Notes] ──► (If Eligible) ──► [Confirm Discharge]
                                                                             │
                                                                             ▼
                                                       [Admin: Discharge Queue] ──► [Execute Discharge]
                                                                                             │
                                                                                             ▼
                                                                              [Free Room + Update Outcomes %]`}</pre>
          </div>
        </section>

        {/* Q3 */}
        <section id="q3" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Q3. Additional Logical Constraints &amp; Business Rules
          </h2>

          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">A. Temperature Validation &amp; Duplicates</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>WHEN</strong> a user enters a temperature &lt; 34.0°C or &gt; 43.0°C (<strong>ASSUMPTION</strong>: valid physiological range) <strong>THEN</strong> block submission and display a validation error.</li>
                <li><strong>WHEN</strong> a Nurse attempts to record a second temperature for the same patient on the same day <strong>THEN</strong> block the entry and display a warning showing the existing reading, timestamp, and nurse name.</li>
                <li><strong>WHEN</strong> a Doctor or Admin corrects an existing temperature <strong>THEN</strong> require a written reason, store the new value, and preserve the previous value in the audit log.</li>
                <li><strong>WHEN</strong> a temperature is &ge; 38.0°C / 100.4°F (<strong>ASSUMPTION</strong>: clinical fever threshold) <strong>THEN</strong> classify it as a fever reading.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">B. Fever-Free Streak &amp; Discharge</h3>
              <ol className="list-decimal list-inside space-y-1" start={5}>
                <li><strong>WHEN</strong> calculating fever-free streak <strong>THEN</strong> count consecutive calendar days backwards from simulated Today with a recorded reading &lt; 38.0°C.</li>
                <li><strong>WHEN</strong> any day has a missing temperature reading <strong>THEN</strong> break the streak (a missing reading is never treated as fever-free).</li>
                <li><strong>WHEN</strong> any reading is &ge; 38.0°C <strong>THEN</strong> reset the fever-free streak to 0.</li>
                <li><strong>WHEN</strong> fever-free streak &ge; 3 days <strong>THEN</strong> auto-flag the patient as eligible for discharge and notify Admin via an in-app badge.</li>
                <li><strong>WHEN</strong> Admin attempts to discharge a patient who is not eligible or not confirmed <strong>THEN</strong> disallow the action.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">C. Doctor Visits &amp; Outcomes</h3>
              <ol className="list-decimal list-inside space-y-1" start={10}>
                <li><strong>WHEN</strong> today&apos;s temperature is not yet recorded <strong>THEN</strong> disable &ldquo;Record Visit&rdquo; and show warning &ldquo;Temperature not taken yet&rdquo;.</li>
                <li><strong>WHEN</strong> a patient already has a doctor visit today <strong>THEN</strong> disallow a second visit record for the same day.</li>
                <li><strong>WHEN</strong> a Doctor clicks &ldquo;Record Deceased&rdquo; <strong>THEN</strong> require a confirmation dialog before marking deceased and freeing the room.</li>
                <li><strong>WHEN</strong> closed cases = 0 <strong>THEN</strong> display &ldquo;N/A&rdquo; for mortality and success rates (prevent divide-by-zero).</li>
                <li><strong>WHEN</strong> mortality rate = deceased / (discharged + deceased) (<strong>ASSUMPTION</strong>: closed-case formula) exceeds 15% <strong>THEN</strong> show an alert banner across the app.</li>
                <li><strong>WHEN</strong> total closed cases &lt; 20 (<strong>ASSUMPTION</strong>: small-sample threshold) <strong>THEN</strong> display a statistical reliability warning note.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">D. State Integrity, Permissions &amp; Later Constraints</h3>
              <ol className="list-decimal list-inside space-y-1" start={16}>
                <li><strong>WHEN</strong> a patient&apos;s status is <code>discharged</code> or <code>deceased</code> <strong>THEN</strong> block all new temperature, visit, or discharge actions for that patient.</li>
                <li><strong>WHEN</strong> any entry is attempted for a future date beyond simulated Today <strong>THEN</strong> block the entry (UI only allows recording for Today).</li>
                <li><strong>WHEN</strong> occupied beds = 74/74 <strong>THEN</strong> block new patient admissions until a room is freed by discharge or death.</li>
                <li><strong>WHEN</strong> a Nurse logs in <strong>THEN</strong> disallow recording visits, editing notes, discharging, viewing outcomes, or viewing the audit log.</li>
                <li><strong>WHEN</strong> an Admin logs in <strong>THEN</strong> disallow recording temperatures or doctor visits.</li>
                <li><strong>WHEN</strong> any state-changing action occurs <strong>THEN</strong> append an immutable entry to the audit log with role, user, timestamp, and details.</li>
                <li><strong>LATER (Post-MVP):</strong> Offline queuing &amp; concurrent-edit conflict resolution (optimistic locking / server timestamps) when migrating from localStorage to a backend database.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Q4 */}
        <section id="q4" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Q4. Sprint Capacity &amp; Value-Maximizing Feature Selection
          </h2>
          <div className="text-sm text-slate-700 space-y-3">
            <p>
              <strong>Capacity calculation:</strong> Sprint velocity = 25 points. Already planned = 3 &times; 5 = 15 points.
              Remaining capacity = <strong>25 &minus; 15 = 10 points</strong>.
            </p>
            <p>
              <strong>Value scale:</strong> Given High = 2&times; Medium and Medium = 3&times; Low &rArr;{' '}
              <strong>Low = 1, Medium = 3, High = 6</strong>.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="p-2.5 border border-slate-200">Feature</th>
                    <th className="p-2.5 border border-slate-200">Priority</th>
                    <th className="p-2.5 border border-slate-200 text-right">Value</th>
                    <th className="p-2.5 border border-slate-200 text-right">Effort</th>
                    <th className="p-2.5 border border-slate-200 text-right">Value / Effort</th>
                    <th className="p-2.5 border border-slate-200 text-center">Selected?</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { f: 'J', p: 'Low', v: 1, e: 0.1, r: '10.00', s: true },
                    { f: 'A', p: 'High', v: 6, e: 1.0, r: '6.00', s: true },
                    { f: 'I', p: 'Low', v: 1, e: 0.3, r: '3.33', s: true },
                    { f: 'F', p: 'Medium', v: 3, e: 1.0, r: '3.00', s: true },
                    { f: 'G', p: 'Low', v: 1, e: 0.4, r: '2.50', s: true },
                    { f: 'B', p: 'High', v: 6, e: 3.0, r: '2.00', s: true },
                    { f: 'H', p: 'Low', v: 1, e: 0.5, r: '2.00', s: true },
                    { f: 'D', p: 'Medium', v: 3, e: 2.0, r: '1.50', s: true },
                    { f: 'C', p: 'High', v: 6, e: 5.0, r: '1.20', s: false },
                    { f: 'E', p: 'Medium', v: 3, e: 3.0, r: '1.00', s: false },
                  ].map((row) => (
                    <tr key={row.f} className={row.s ? 'bg-teal-50/40' : 'bg-[#fafaf7] text-slate-500'}>
                      <td className="p-2.5 border border-slate-200 font-bold">{row.f}</td>
                      <td className="p-2.5 border border-slate-200">{row.p}</td>
                      <td className="p-2.5 border border-slate-200 text-right">{row.v}</td>
                      <td className="p-2.5 border border-slate-200 text-right">{row.e}</td>
                      <td className="p-2.5 border border-slate-200 text-right font-mono">{row.r}</td>
                      <td className="p-2.5 border border-slate-200 text-center font-semibold">
                        {row.s ? 'Yes Yes' : 'No No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 space-y-1">
              <p><strong>Selected Set:</strong> A, B, D, F, G, H, I, J</p>
              <p><strong>Total Value:</strong> 6 + 6 + 3 + 3 + 1 + 1 + 1 + 1 = <strong>22</strong></p>
              <p><strong>Total Effort:</strong> 1 + 3 + 2 + 1 + 0.4 + 0.5 + 0.3 + 0.1 = <strong>8.3 points</strong> (Unused capacity: <strong>1.7 points</strong>)</p>
              <p className="text-slate-700 pt-1">
                <strong>Why C (5) &amp; E (3) are excluded:</strong> Neither fits in the remaining 1.7 points. Swapping them in gives equal or lower value at higher effort (e.g., replacing D with E gives value 22 at effort 9.3; replacing B+D with C gives value 22 at effort 8.3? Wait: B+D = effort 5, value 9 vs C = effort 5, value 6 — strictly worse).
              </p>
            </div>
          </div>
        </section>

        {/* Assumptions */}
        <section id="assumptions" className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-900 border-b border-amber-100 pb-3">
            Assumptions Made (In-App Rules Reference)
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700">
            <li><strong>ASSUMPTION — Fever Threshold (38.0°C / 100.4°F):</strong> Not specified in problem statement; 38.0°C is the standard clinical fever cutoff.</li>
            <li><strong>ASSUMPTION — Valid Temperature Range (34.0°C – 43.0°C):</strong> Protects against typos/implausible human body temperatures.</li>
            <li><strong>ASSUMPTION — Mortality Formula:</strong> <code>deceased / (cured-and-discharged + deceased)</code> over closed cases only; active patients are excluded until outcome is known.</li>
            <li><strong>ASSUMPTION — Small Sample Threshold (&lt; 20 closed cases):</strong> Percentages are volatile with small N, so a reliability note is shown below 20 closed cases.</li>
            <li><strong>ASSUMPTION — One Official Reading Per Day:</strong> Prevents duplicate readings; corrections require Doctor/Admin role + reason and are preserved in the audit log.</li>
            <li><strong>ASSUMPTION — Simulated &ldquo;Today&rdquo; &amp; No Real Auth:</strong> Demo date control enables live verification of the 3-day rule; role picker substitutes for authentication in MVP.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

