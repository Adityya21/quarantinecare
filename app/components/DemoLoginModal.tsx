'use client';

import React, { useState, useEffect } from 'react';
import { X, KeyRound } from 'lucide-react';
import type { Role } from '@/app/lib/types';

export const DEMO_CREDENTIALS: Record<
  Role,
  { label: string; staffId: string; passcode: string }
> = {
  nurse: {
    label: 'Nurse',
    staffId: 'nurse.joy',
    passcode: 'ward-101',
  },
  doctor: {
    label: 'Doctor',
    staffId: 'dr.patel',
    passcode: 'clinical-202',
  },
  admin: {
    label: 'Admin staff',
    staffId: 'admin.raj',
    passcode: 'ops-303',
  },
};

interface DemoLoginModalProps {
  role: Role | null;
  onClose: () => void;
  onSuccess: (role: Role) => void;
}

export default function DemoLoginModal({
  role,
  onClose,
  onSuccess,
}: DemoLoginModalProps) {
  const [staffId, setStaffId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setStaffId('');
      setPasscode('');
      setError(null);
    }
  }, [role]);

  useEffect(() => {
    if (!role) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [role, onClose]);

  if (!role) return null;

  const creds = DEMO_CREDENTIALS[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      staffId.trim().toLowerCase() === creds.staffId &&
      passcode.trim() === creds.passcode
    ) {
      onSuccess(role);
    } else {
      setError(
        `Invalid credentials for ${creds.label}. Use Staff ID "${creds.staffId}" and Passcode "${creds.passcode}".`,
      );
    }
  };

  const handleFillDemo = () => {
    setStaffId(creds.staffId);
    setPasscode(creds.passcode);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/40"
      role="dialog"
      aria-modal="true"
      aria-label={`Sign in as ${creds.label}`}
    >
      <div className="bg-white border border-[#E7E5E0] rounded-xl w-full max-w-md shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E5E0] flex items-center justify-between gap-3">
          <div>
            <span className="caption-label text-[#1F6F6B] font-semibold block">
              Demo Role Verification
            </span>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#1F2933]">
              Sign in as {creds.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign-in dialog"
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E7E5E0] text-[#6B7680] hover:text-[#1F2933] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
          >
            <X className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Demo credentials reference box */}
          <div className="p-3.5 rounded-lg border border-[#E7E5E0] bg-[#FAFAF8] text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#1F2933]">
                <KeyRound className="w-3.5 h-3.5 text-[#1F6F6B]" strokeWidth={1.5} aria-hidden="true" />
                <span>Demo Credentials ({creds.label})</span>
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-semibold text-[#1F6F6B] hover:underline cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
              >
                Use demo credentials
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono tabular-nums text-[#6B7680]">
              <div>
                Staff ID: <strong className="text-[#1F2933]">{creds.staffId}</strong>
              </div>
              <div>
                Passcode: <strong className="text-[#1F2933]">{creds.passcode}</strong>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="demo-staff-id"
              className="caption-label text-[#6B7680] font-semibold block mb-1.5"
            >
              Staff ID
            </label>
            <input
              id="demo-staff-id"
              type="text"
              autoFocus
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder={creds.staffId}
              className="w-full font-mono px-3 py-2.5 min-h-[44px] rounded-lg border border-[#E7E5E0] text-sm text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            />
          </div>

          <div>
            <label
              htmlFor="demo-passcode"
              className="caption-label text-[#6B7680] font-semibold block mb-1.5"
            >
              Passcode
            </label>
            <input
              id="demo-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter demo passcode"
              className="w-full font-mono px-3 py-2.5 min-h-[44px] rounded-lg border border-[#E7E5E0] text-sm text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] text-xs font-medium text-[#991B1B]"
            >
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-lg border border-[#E7E5E0] text-sm font-medium text-[#6B7680] hover:text-[#1F2933] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 min-h-[44px] rounded-lg bg-[#1F6F6B] text-white text-sm font-semibold hover:bg-[#175552] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F6F6B]"
            >
              Sign in &amp; Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
