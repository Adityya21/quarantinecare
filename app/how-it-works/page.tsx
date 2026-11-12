'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useApp } from '@/app/lib/context';

const FLOW_STEPS = [
  'Nurse records temperature',
  'Visit unlocks',
  'Doctor reviews',
  'System flags 3 fever-free days',
  'Doctor confirms',
  'Admin discharges',
  'Room freed',
  'Outcomes update',
];

export default function HowItWorksPage() {
  const { role } = useApp();

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1F2933] pb-20 md:pb-8">
      {role ? (
        <Navbar />
      ) : (
        <header className="bg-white border-b border-[#E7E5E0]">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#1F2933] font-serif-heading text-lg font-semibold"
            >
              <span className="inline-block w-2.5 h-2.5 bg-[#1F6F6B] rounded-xs" aria-hidden="true" />
              <span>QuarantineCare</span>
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-[#1F6F6B] hover:underline"
            >
              Back to role selection
            </Link>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-1.5 border-b border-[#E7E5E0] pb-5">
          <span className="caption-label text-[#1F6F6B] font-semibold">
            Product Guide &amp; Clinical Rules
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-[36px] font-semibold text-[#1F2933]">
            How QuarantineCare Works
          </h1>
          <p className="text-sm text-[#6B7680]">
            Daily ward workflow across Nurse, Doctor, and Admin staff for a 74-room quarantine and treatment facility.
          </p>
        </header>

        {/* Clean Horizontal Flow Diagram */}
        <section
          aria-label="Daily clinical flow diagram"
          className="bg-white border border-[#E7E5E0] rounded-xl p-6 space-y-3"
        >
          <span className="caption-label text-[#6B7680] font-semibold block">
            End-to-End Daily Flow
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {FLOW_STEPS.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="px-3 py-2 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-xs font-medium text-[#1F2933]">
                  <span className="font-mono text-[#1F6F6B] font-bold mr-1">{idx + 1}.</span>
                  {step}
                </div>
                {idx < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7680] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Feature Workflows */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E7E5E0] rounded-xl p-6 space-y-2">
            <span className="caption-label text-[#1F6F6B] font-semibold">1. Temperature Tracking (Nurse)</span>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[#6B7680]">
              <li>Open the Ward Board with the Nurse lens or launch Round Mode.</li>
              <li>Enter one daily temperature reading (34.0 to 43.0 &deg;C).</li>
              <li>Out-of-range values are blocked; duplicate same-day readings are disallowed.</li>
              <li>Only a Doctor can correct an existing reading, with a mandatory reason logged to Audit.</li>
            </ol>
          </div>

          <div className="bg-white border border-[#E7E5E0] rounded-xl p-6 space-y-2">
            <span className="caption-label text-[#1F6F6B] font-semibold">2. Sequenced Doctor Visits (Doctor)</span>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[#6B7680]">
              <li>Visit recording stays locked until today&apos;s temperature is recorded.</li>
              <li>Round Mode orders measured patients with fever today first, then longest streak.</li>
              <li>Doctor records treatment notes (one visit per patient per day).</li>
              <li>If a patient reaches 3+ fever-free days, Doctor confirms discharge readiness.</li>
            </ol>
          </div>

          <div className="bg-white border border-[#E7E5E0] rounded-xl p-6 space-y-2">
            <span className="caption-label text-[#1F6F6B] font-semibold">3. Discharge Queue &amp; Bed Turnover (Admin)</span>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[#6B7680]">
              <li>Eligible patients raise an in-app badge on Admin navigation.</li>
              <li>Admin reviews Doctor-confirmed patients in the Discharge Queue.</li>
              <li>Confirming discharge updates patient status to discharged and frees the room.</li>
              <li>Admin cannot discharge a patient who has not met the 3-day rule and Doctor confirmation.</li>
            </ol>
          </div>

          <div className="bg-white border border-[#E7E5E0] rounded-xl p-6 space-y-2">
            <span className="caption-label text-[#1F6F6B] font-semibold">4. Outcomes &amp; Audit Oversight</span>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[#6B7680]">
              <li>Doctor can record a Deceased outcome with a confirmation dialog, freeing the room.</li>
              <li>Outcomes page plots mortality on a 0–30% gauge against the 15% expected benchmark.</li>
              <li>A critical alert banner appears whenever mortality exceeds 15%.</li>
              <li>Every reading, correction, visit, confirmation, discharge, and outcome is audited.</li>
            </ol>
          </div>
        </section>

        {/* ASSUMPTIONS List */}
        <section className="bg-white border border-[#E7E5E0] rounded-xl p-6 space-y-3">
          <span className="caption-label text-[#6B7680] font-semibold block">
            Documented Assumptions
          </span>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-[#6B7680]">
            <li>
              <strong className="text-[#1F2933]">ASSUMPTION — Fever threshold (38.0 &deg;C / 100.4 &deg;F):</strong> Standard clinical fever cutoff; readings at or above this threshold reset the fever-free streak to 0.
            </li>
            <li>
              <strong className="text-[#1F2933]">ASSUMPTION — Valid temperature range (34.0 to 43.0 &deg;C):</strong> Physiologically plausible human body temperature bounds to block entry typos.
            </li>
            <li>
              <strong className="text-[#1F2933]">ASSUMPTION — Mortality formula:</strong> Calculated over closed cases as <code className="font-mono text-xs">deceased / (cured-and-discharged + deceased)</code>; displays N/A when closed cases = 0.
            </li>
            <li>
              <strong className="text-[#1F2933]">ASSUMPTION — Small-sample limit (&lt; 20 closed cases):</strong> Displays a statistical reliability note when fewer than 20 closed cases exist.
            </li>
            <li>
              <strong className="text-[#1F2933]">ASSUMPTION — Missing day rule:</strong> A day without a recorded reading breaks the fever-free streak (missing is never treated as fever-free).
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
