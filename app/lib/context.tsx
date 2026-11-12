'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import type {
  AppState,
  Role,
  Patient,
  TemperatureReading,
  DoctorVisit,
  AuditLogEntry,
} from './types';

import {
  isValidTemperature,
  hasFever,
  generateId,
  getNextDay,
  calculateFeverFreeStreak,
  FEVER_FREE_DAYS_FOR_DISCHARGE,
  calculateMortalityRate,
  calculateSuccessRate,
  isMortalityAboveBenchmark,
  isSmallSample as isSmallSampleFn,
} from './logic';

import { generateSeedData } from './seed';

// ──────────────────────────────────────────────────────────────────────────────
// localStorage helpers (SSR-safe)
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'quarantine-app-state';

function loadState(): AppState {
  if (typeof window === 'undefined') return generateSeedData();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return generateSeedData();
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Context shape
// ──────────────────────────────────────────────────────────────────────────────

interface OutcomeStats {
  discharged: number;
  deceased: number;
  mortalityRate: number | null;
  successRate: number | null;
  isAboveBenchmark: boolean;
  isSmallSample: boolean;
}

interface AppContextValue {
  // State
  state: AppState;
  role: Role | null;
  temperatureUnit: 'C' | 'F';

  // Setters
  setRole: (role: Role | null) => void;
  setTemperatureUnit: (unit: 'C' | 'F') => void;

  // Day management
  advanceDay: () => void;

  // Temperature
  recordTemperature: (
    patientId: string,
    temperature: number,
    nurseName: string,
  ) => { success: boolean; error?: string; existing?: TemperatureReading };
  correctTemperature: (
    readingId: string,
    newValue: number,
    correctorName: string,
    role: Role,
    reason: string,
  ) => { success: boolean; error?: string };

  // Visits
  recordVisit: (
    patientId: string,
    notes: string,
    doctorName: string,
  ) => { success: boolean; error?: string };

  // Discharge / deceased
  confirmDischarge: (
    patientId: string,
    doctorName: string,
  ) => { success: boolean; error?: string };
  executeDischarge: (
    patientId: string,
    adminName: string,
  ) => { success: boolean; error?: string };
  recordDeceased: (
    patientId: string,
    doctorName: string,
  ) => { success: boolean; error?: string };

  // Reset
  resetData: () => void;

  // Queries
  getPatientReadings: (patientId: string) => TemperatureReading[];
  getPatientVisits: (patientId: string) => DoctorVisit[];
  getTodayReading: (patientId: string) => TemperatureReading | undefined;
  getTodayVisit: (patientId: string) => DoctorVisit | undefined;
  getOccupancy: () => number;
  getDischargeEligible: () => Patient[];
  getPendingTemps: () => Patient[];
  getPendingVisits: () => Patient[];
  getOutcomes: () => OutcomeStats;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ──────────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [role, setRoleRaw] = useState<Role | null>(null);
  const [temperatureUnit, setTemperatureUnitRaw] = useState<'C' | 'F'>('C');

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Persist and set state in one call. */
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const findPatient = useCallback(
    (patientId: string): Patient | undefined =>
      state.patients.find((p) => p.id === patientId),
    [state.patients],
  );

  // ── Role / unit setters ──────────────────────────────────────────────────

  const setRole = useCallback((r: Role | null) => setRoleRaw(r), []);
  const setTemperatureUnit = useCallback((u: 'C' | 'F') => setTemperatureUnitRaw(u), []);

  // ── Day management ───────────────────────────────────────────────────────

  const advanceDay = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      currentDate: getNextDay(prev.currentDate),
    }));
  }, [updateState]);

  // ── Record temperature ───────────────────────────────────────────────────

  const recordTemperature = useCallback(
    (
      patientId: string,
      temperature: number,
      nurseName: string,
    ): { success: boolean; error?: string; existing?: TemperatureReading } => {
      const patient = findPatient(patientId);
      if (!patient) return { success: false, error: 'Patient not found.' };
      if (patient.status !== 'admitted')
        return { success: false, error: 'Patient is not currently admitted.' };

      if (!isValidTemperature(temperature))
        return {
          success: false,
          error: 'Temperature out of valid range (34.0–43.0 °C).',
        };

      // Duplicate check for same day
      const existing = state.temperatureReadings.find(
        (r) => r.patientId === patientId && r.date === state.currentDate,
      );
      if (existing) return { success: true, existing };

      const newReading: TemperatureReading = {
        id: generateId(),
        patientId,
        date: state.currentDate,
        temperature,
        recordedBy: nurseName,
        recordedByRole: 'nurse',
        recordedAt: new Date().toISOString(),
      };

      const auditEntry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'temperature_recorded',
        patientId,
        patientName: patient.name,
        roomNumber: patient.roomNumber,
        performedBy: nurseName,
        performedByRole: 'nurse',
        details: `Temperature recorded: ${temperature}°C${hasFever(temperature) ? ' (FEVER)' : ''}.`,
      };

      updateState((prev) => ({
        ...prev,
        temperatureReadings: [...prev.temperatureReadings, newReading],
        auditLog: [...prev.auditLog, auditEntry],
      }));

      return { success: true };
    },
    [state, findPatient, updateState],
  );

  // ── Correct temperature ──────────────────────────────────────────────────

  const correctTemperature = useCallback(
    (
      readingId: string,
      newValue: number,
      correctorName: string,
      correctorRole: Role,
      reason: string,
    ): { success: boolean; error?: string } => {
      if (correctorRole !== 'doctor' && correctorRole !== 'admin')
        return { success: false, error: 'Only doctors or admins may correct temperatures.' };

      if (!isValidTemperature(newValue))
        return {
          success: false,
          error: 'New temperature out of valid range (34.0–43.0 °C).',
        };

      const reading = state.temperatureReadings.find((r) => r.id === readingId);
      if (!reading) return { success: false, error: 'Reading not found.' };

      const patient = findPatient(reading.patientId);
      if (!patient) return { success: false, error: 'Patient not found.' };

      const updatedReading: TemperatureReading = {
        ...reading,
        previousValue: reading.temperature,
        temperature: newValue,
        corrected: true,
        correctedBy: correctorName,
        correctedByRole: correctorRole,
        correctedAt: new Date().toISOString(),
        correctionReason: reason,
      };

      const auditEntry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'temperature_corrected',
        patientId: reading.patientId,
        patientName: patient.name,
        roomNumber: patient.roomNumber,
        performedBy: correctorName,
        performedByRole: correctorRole,
        details: `Temperature corrected from ${reading.temperature}°C to ${newValue}°C. Reason: ${reason}`,
      };

      updateState((prev) => ({
        ...prev,
        temperatureReadings: prev.temperatureReadings.map((r) =>
          r.id === readingId ? updatedReading : r,
        ),
        auditLog: [...prev.auditLog, auditEntry],
      }));

      return { success: true };
    },
    [state.temperatureReadings, findPatient, updateState],
  );

  // ── Record visit ─────────────────────────────────────────────────────────

  const recordVisit = useCallback(
    (
      patientId: string,
      notes: string,
      doctorName: string,
    ): { success: boolean; error?: string } => {
      const patient = findPatient(patientId);
      if (!patient) return { success: false, error: 'Patient not found.' };
      if (patient.status !== 'admitted')
        return { success: false, error: 'Patient is not currently admitted.' };

      // Check that temperature has been taken today first
      const todayTemp = state.temperatureReadings.find(
        (r) => r.patientId === patientId && r.date === state.currentDate,
      );
      if (!todayTemp)
        return {
          success: false,
          error: "Today's temperature must be recorded before a doctor visit.",
        };

      const newVisit: DoctorVisit = {
        id: generateId(),
        patientId,
        date: state.currentDate,
        notes,
        recordedBy: doctorName,
        recordedAt: new Date().toISOString(),
      };

      const auditEntry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'visit_recorded',
        patientId,
        patientName: patient.name,
        roomNumber: patient.roomNumber,
        performedBy: doctorName,
        performedByRole: 'doctor',
        details: `Doctor visit recorded. Notes: ${notes.substring(0, 100)}`,
      };

      updateState((prev) => ({
        ...prev,
        doctorVisits: [...prev.doctorVisits, newVisit],
        auditLog: [...prev.auditLog, auditEntry],
      }));

      return { success: true };
    },
    [state, findPatient, updateState],
  );

  // ── Confirm discharge (doctor) ───────────────────────────────────────────

  const confirmDischarge = useCallback(
    (
      patientId: string,
      doctorName: string,
    ): { success: boolean; error?: string } => {
      const patient = findPatient(patientId);
      if (!patient) return { success: false, error: 'Patient not found.' };
      if (patient.status !== 'admitted')
        return { success: false, error: 'Patient is not currently admitted.' };

      // Check eligibility
      const readings = state.temperatureReadings.filter(
        (r) => r.patientId === patientId,
      );
      const streak = calculateFeverFreeStreak(readings, state.currentDate);
      if (streak < FEVER_FREE_DAYS_FOR_DISCHARGE)
        return {
          success: false,
          error: `Patient needs ${FEVER_FREE_DAYS_FOR_DISCHARGE} consecutive fever-free days. Current streak: ${streak}.`,
        };

      // Already in queue?
      if (state.dischargeQueue.includes(patientId))
        return { success: false, error: 'Patient is already in the discharge queue.' };

      const auditEntry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'discharge_confirmed',
        patientId,
        patientName: patient.name,
        roomNumber: patient.roomNumber,
        performedBy: doctorName,
        performedByRole: 'doctor',
        details: `Doctor confirmed discharge eligibility (streak: ${streak} days).`,
      };

      updateState((prev) => ({
        ...prev,
        dischargeQueue: [...prev.dischargeQueue, patientId],
        auditLog: [...prev.auditLog, auditEntry],
      }));

      return { success: true };
    },
    [state, findPatient, updateState],
  );

  // ── Execute discharge (admin) ────────────────────────────────────────────

  const executeDischarge = useCallback(
    (
      patientId: string,
      adminName: string,
    ): { success: boolean; error?: string } => {
      const patient = findPatient(patientId);
      if (!patient) return { success: false, error: 'Patient not found.' };
      if (patient.status !== 'admitted')
        return { success: false, error: 'Patient is not currently admitted.' };

      if (!state.dischargeQueue.includes(patientId))
        return {
          success: false,
          error: 'Patient has not been confirmed for discharge by a doctor.',
        };

      const auditEntry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'discharge_executed',
        patientId,
        patientName: patient.name,
        roomNumber: patient.roomNumber,
        performedBy: adminName,
        performedByRole: 'admin',
        details: `Patient discharged from room ${patient.roomNumber}.`,
      };

      updateState((prev) => ({
        ...prev,
        patients: prev.patients.map((p) =>
          p.id === patientId
            ? { ...p, status: 'discharged' as const, dischargeDate: prev.currentDate }
            : p,
        ),
        dischargeQueue: prev.dischargeQueue.filter((id) => id !== patientId),
        auditLog: [...prev.auditLog, auditEntry],
      }));

      return { success: true };
    },
    [state, findPatient, updateState],
  );

  // ── Record deceased ──────────────────────────────────────────────────────

  const recordDeceased = useCallback(
    (
      patientId: string,
      doctorName: string,
    ): { success: boolean; error?: string } => {
      const patient = findPatient(patientId);
      if (!patient) return { success: false, error: 'Patient not found.' };
      if (patient.status !== 'admitted')
        return { success: false, error: 'Patient is not currently admitted.' };

      const auditEntry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: 'deceased_recorded',
        patientId,
        patientName: patient.name,
        roomNumber: patient.roomNumber,
        performedBy: doctorName,
        performedByRole: 'doctor',
        details: `Patient in room ${patient.roomNumber} recorded as deceased.`,
      };

      updateState((prev) => ({
        ...prev,
        patients: prev.patients.map((p) =>
          p.id === patientId
            ? { ...p, status: 'deceased' as const, deceasedDate: prev.currentDate }
            : p,
        ),
        dischargeQueue: prev.dischargeQueue.filter((id) => id !== patientId),
        auditLog: [...prev.auditLog, auditEntry],
      }));

      return { success: true };
    },
    [state, findPatient, updateState],
  );

  // ── Reset data ───────────────────────────────────────────────────────────

  const resetData = useCallback(() => {
    const fresh = generateSeedData();
    saveState(fresh);
    setState(fresh);
  }, []);

  // ── Query helpers ────────────────────────────────────────────────────────

  const getPatientReadings = useCallback(
    (patientId: string): TemperatureReading[] =>
      state.temperatureReadings.filter((r) => r.patientId === patientId),
    [state.temperatureReadings],
  );

  const getPatientVisits = useCallback(
    (patientId: string): DoctorVisit[] =>
      state.doctorVisits.filter((v) => v.patientId === patientId),
    [state.doctorVisits],
  );

  const getTodayReading = useCallback(
    (patientId: string): TemperatureReading | undefined =>
      state.temperatureReadings.find(
        (r) => r.patientId === patientId && r.date === state.currentDate,
      ),
    [state.temperatureReadings, state.currentDate],
  );

  const getTodayVisit = useCallback(
    (patientId: string): DoctorVisit | undefined =>
      state.doctorVisits.find(
        (v) => v.patientId === patientId && v.date === state.currentDate,
      ),
    [state.doctorVisits, state.currentDate],
  );

  const getOccupancy = useCallback(
    (): number => state.patients.filter((p) => p.status === 'admitted').length,
    [state.patients],
  );

  const getDischargeEligible = useCallback(
    (): Patient[] =>
      state.patients.filter((p) => {
        if (p.status !== 'admitted') return false;
        const readings = state.temperatureReadings.filter(
          (r) => r.patientId === p.id,
        );
        return (
          calculateFeverFreeStreak(readings, state.currentDate) >=
          FEVER_FREE_DAYS_FOR_DISCHARGE
        );
      }),
    [state.patients, state.temperatureReadings, state.currentDate],
  );

  const getPendingTemps = useCallback(
    (): Patient[] =>
      state.patients.filter((p) => {
        if (p.status !== 'admitted') return false;
        return !state.temperatureReadings.some(
          (r) => r.patientId === p.id && r.date === state.currentDate,
        );
      }),
    [state.patients, state.temperatureReadings, state.currentDate],
  );

  const getPendingVisits = useCallback(
    (): Patient[] =>
      state.patients.filter((p) => {
        if (p.status !== 'admitted') return false;
        return !state.doctorVisits.some(
          (v) => v.patientId === p.id && v.date === state.currentDate,
        );
      }),
    [state.patients, state.doctorVisits, state.currentDate],
  );

  const getOutcomes = useCallback((): OutcomeStats => {
    const discharged = state.patients.filter(
      (p) => p.status === 'discharged',
    ).length;
    const deceased = state.patients.filter(
      (p) => p.status === 'deceased',
    ).length;
    return {
      discharged,
      deceased,
      mortalityRate: calculateMortalityRate(discharged, deceased),
      successRate: calculateSuccessRate(discharged, deceased),
      isAboveBenchmark: isMortalityAboveBenchmark(discharged, deceased),
      isSmallSample: isSmallSampleFn(discharged, deceased),
    };
  }, [state.patients]);

  // ── Memoized context value ───────────────────────────────────────────────

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      role,
      temperatureUnit,
      setRole,
      setTemperatureUnit,
      advanceDay,
      recordTemperature,
      correctTemperature,
      recordVisit,
      confirmDischarge,
      executeDischarge,
      recordDeceased,
      resetData,
      getPatientReadings,
      getPatientVisits,
      getTodayReading,
      getTodayVisit,
      getOccupancy,
      getDischargeEligible,
      getPendingTemps,
      getPendingVisits,
      getOutcomes,
    }),
    [
      state,
      role,
      temperatureUnit,
      setRole,
      setTemperatureUnit,
      advanceDay,
      recordTemperature,
      correctTemperature,
      recordVisit,
      confirmDischarge,
      executeDischarge,
      recordDeceased,
      resetData,
      getPatientReadings,
      getPatientVisits,
      getTodayReading,
      getTodayVisit,
      getOccupancy,
      getDischargeEligible,
      getPendingTemps,
      getPendingVisits,
      getOutcomes,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error('useAppContext must be used within an <AppProvider>.');
  return ctx;
}

export const useApp = useAppContext;
