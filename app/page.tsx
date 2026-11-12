'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/lib/context';
import type { Role } from '@/app/lib/types';

const roles: { role: Role; emoji: string; title: string; description: string }[] = [
  {
    role: 'nurse',
    emoji: '👩‍⚕️',
    title: 'Nurse',
    description: 'Record daily patient temperatures, monitor fever status, and track pending readings across all rooms.',
  },
  {
    role: 'doctor',
    emoji: '🩺',
    title: 'Doctor',
    description: 'Conduct daily patient visits, confirm discharge eligibility, record outcomes, and review clinical data.',
  },
  {
    role: 'admin',
    emoji: '🏥',
    title: 'Administrator',
    description: 'Execute patient discharges, view facility outcomes, review the audit log, and manage facility operations.',
  },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const { setRole, resetData } = useApp();

  const handleSelectRole = (role: Role) => {
    setRole(role);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-teal-700 mb-2">🏥 QuarantineCare</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Virus quarantine facility management system. Select your role to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mb-10">
        {roles.map(({ role, emoji, title, description }) => (
          <button
            key={role}
            onClick={() => handleSelectRole(role)}
            className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer min-h-12"
          >
            <span className="text-5xl">{emoji}</span>
            <span className="text-xl font-semibold text-slate-800">{title}</span>
            <span className="text-sm text-slate-500 text-center">{description}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={resetData}
          className="px-5 py-3 min-h-12 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          🔄 Reset Demo Data
        </button>
        <p className="text-xs text-slate-400 max-w-md text-center">
          Note: This is a demo prototype. In production, proper authentication would be implemented.
        </p>
      </div>
    </div>
  );
}
