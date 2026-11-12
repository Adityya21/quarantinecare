import type {
  AppState,
  Patient,
  TemperatureReading,
  DoctorVisit,
  AuditLogEntry,
  Role,
} from './types';
import { getPreviousDay, hasFever } from './logic';

// ──────────────────────────────────────────────────────────────────────────────
// Fixed name arrays (deterministic)
// ──────────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
  'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith',
  'Dhruv', 'Kabir', 'Ritvik', 'Aarush', 'Kayaan',
  'Darsh', 'Veer', 'Sahil', 'Arnav', 'Rudra',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya',
  'Aadhya', 'Isha', 'Anvi', 'Prisha', 'Riya',
  'Navya', 'Anika', 'Kiara', 'Saanvi', 'Avni',
  'Meera', 'Tara', 'Zara', 'Siya', 'Pihu',
  'Kavya', 'Nisha', 'Pooja', 'Shreya', 'Tanvi',
  'Rohan', 'Karan', 'Nikhil', 'Vikram', 'Rahul',
  'Amit', 'Suresh', 'Deepak', 'Rajesh', 'Manoj',
  'Neha', 'Simran', 'Komal', 'Jyoti', 'Pallavi',
  'Sneha', 'Rashi', 'Bhavna', 'Megha', 'Divya',
  'Aryan', 'Dev', 'Harsh', 'Kunal', 'Manav',
  'Lakshmi', 'Radha', 'Suman', 'Geeta', 'Rekha',
  'Yash', 'Om',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar',
  'Patel', 'Mehta', 'Joshi', 'Rao', 'Reddy',
  'Nair', 'Iyer', 'Pillai', 'Menon', 'Bhat',
  'Das', 'Sen', 'Ghosh', 'Roy', 'Banerjee',
  'Chopra', 'Malhotra', 'Kapoor', 'Bose', 'Dutta',
  'Chauhan', 'Yadav', 'Thakur', 'Pandey', 'Mishra',
  'Kulkarni', 'Deshmukh', 'Patil', 'Shinde', 'Jadhav',
  'Saxena', 'Agarwal', 'Srivastava', 'Tiwari', 'Dubey',
];

const DOCTOR_NAMES = ['Dr. Anand Kulkarni', 'Dr. Priya Mehta', 'Dr. Rajiv Nair'];
const NURSE_NAMES = ['Nurse Sita', 'Nurse Lata', 'Nurse Kavita', 'Nurse Priti', 'Nurse Geeta'];

// ──────────────────────────────────────────────────────────────────────────────
// Deterministic pseudo-random helper (index-based, no Math.random)
// ──────────────────────────────────────────────────────────────────────────────

/** Simple hash-based deterministic value from an index + seed offset. */
function deterministicValue(index: number, seed: number = 0): number {
  // A simple LCG-like hash for determinism
  let h = ((index + 1) * 2654435761 + seed) >>> 0;
  h = ((h ^ (h >> 16)) * 0x45d9f3b) >>> 0;
  h = ((h ^ (h >> 16)) * 0x45d9f3b) >>> 0;
  h = (h ^ (h >> 16)) >>> 0;
  return h;
}

/** Deterministic float [0, 1) */
function deterministicFloat(index: number, seed: number = 0): number {
  return (deterministicValue(index, seed) % 10000) / 10000;
}

/** Pick from an array deterministically. */
function pick<T>(arr: T[], index: number, seed: number = 0): T {
  return arr[deterministicValue(index, seed) % arr.length];
}

// ──────────────────────────────────────────────────────────────────────────────
// Date arithmetic
// ──────────────────────────────────────────────────────────────────────────────

const BASE_DATE = '2024-01-10';

function subtractDays(dateStr: string, days: number): string {
  let d = dateStr;
  for (let i = 0; i < days; i++) d = getPreviousDay(d);
  return d;
}

// ──────────────────────────────────────────────────────────────────────────────
// Seed generator
// ──────────────────────────────────────────────────────────────────────────────

export function generateSeedData(): AppState {
  const patients: Patient[] = [];
  const temperatureReadings: TemperatureReading[] = [];
  const doctorVisits: DoctorVisit[] = [];
  const auditLog: AuditLogEntry[] = [];
  const dischargeQueue: string[] = [];

  let readingCounter = 0;
  let visitCounter = 0;
  let auditCounter = 0;

  // ── Patient category assignments (deterministic, by room number) ────────
  // Rooms 1-20:  3+ fever-free days (eligible for discharge)
  // Rooms 21-35: exactly 2 fever-free days
  // Rooms 36-50: exactly 1 fever-free day
  // Rooms 51-60: fever today
  // Rooms 61-74: 0 days of history or missing days
  // Plus 7 closed cases that don't occupy rooms in the active set:
  //   discharged: rooms 75-79 (ids p-75 through p-79)
  //   deceased:   rooms 80-81 (ids p-80 through p-81)

  function getName(room: number): string {
    const first = FIRST_NAMES[room % FIRST_NAMES.length];
    const last = LAST_NAMES[room % LAST_NAMES.length];
    return `${first} ${last}`;
  }

  function makeTimestamp(dateStr: string, hour: number): string {
    return `${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`;
  }

  // Helper: generate a temperature value deterministically
  function tempValue(room: number, dayOffset: number, wantFever: boolean): number {
    if (wantFever) {
      // fever: 38.0 - 40.5
      const base = 38.0 + (deterministicValue(room, dayOffset * 100) % 25) / 10;
      return +base.toFixed(1);
    }
    // normal: 36.0 - 37.8
    const base = 36.0 + (deterministicValue(room, dayOffset * 100) % 18) / 10;
    return +base.toFixed(1);
  }

  function addReading(
    patientId: string,
    date: string,
    temp: number,
    nurseName: string,
  ): TemperatureReading {
    readingCounter++;
    const reading: TemperatureReading = {
      id: `tr-${readingCounter}`,
      patientId,
      date,
      temperature: temp,
      recordedBy: nurseName,
      recordedByRole: 'nurse',
      recordedAt: makeTimestamp(date, 8 + (readingCounter % 4)),
    };
    temperatureReadings.push(reading);
    return reading;
  }

  function addVisit(
    patientId: string,
    date: string,
    doctorName: string,
    notes: string,
    dischargeConfirmed: boolean = false,
  ): DoctorVisit {
    visitCounter++;
    const visit: DoctorVisit = {
      id: `dv-${visitCounter}`,
      patientId,
      date,
      notes,
      recordedBy: doctorName,
      recordedAt: makeTimestamp(date, 10 + (visitCounter % 4)),
      dischargeConfirmed,
    };
    doctorVisits.push(visit);
    return visit;
  }

  function addAudit(
    action: AuditLogEntry['action'],
    patientId: string,
    patientName: string,
    roomNumber: number,
    performedBy: string,
    performedByRole: Role,
    details: string,
    dateStr: string,
  ) {
    auditCounter++;
    auditLog.push({
      id: `audit-${auditCounter}`,
      timestamp: makeTimestamp(dateStr, 9 + (auditCounter % 6)),
      action,
      patientId,
      patientName,
      roomNumber,
      performedBy,
      performedByRole,
      details,
    });
  }

  // ── Generate admitted patients (rooms 1-74) ─────────────────────────────

  for (let room = 1; room <= 74; room++) {
    const id = `p-${room}`;
    const name = getName(room);
    const daysAdmitted = 3 + (deterministicValue(room, 42) % 5); // 3-7 days ago
    const admissionDate = subtractDays(BASE_DATE, daysAdmitted);
    const nurseName = pick(NURSE_NAMES, room, 7);
    const doctorName = pick(DOCTOR_NAMES, room, 13);

    patients.push({
      id,
      name,
      roomNumber: room,
      admissionDate,
      status: 'admitted',
    });

    if (room <= 20) {
      // ── Category 1: 3+ consecutive fever-free days ──────────────────
      const streakLen = 3 + (deterministicValue(room, 88) % 4); // 3-6 days
      for (let d = 0; d < streakLen; d++) {
        const date = subtractDays(BASE_DATE, d);
        addReading(id, date, tempValue(room, d, false), nurseName);
        addAudit('temperature_recorded', id, name, room, nurseName, 'nurse',
          `Temperature recorded: ${tempValue(room, d, false)}°C`, date);
      }
      // Some have doctor visits
      if (room % 3 === 0) {
        addVisit(id, BASE_DATE, doctorName, 'Patient stable, fever-free streak good.');
        addAudit('visit_recorded', id, name, room, doctorName, 'doctor',
          'Routine visit recorded.', BASE_DATE);
      }
      // A few have discharge confirmed
      if (room <= 5) {
        addVisit(id, BASE_DATE, doctorName, 'Confirmed for discharge.', true);
        dischargeQueue.push(id);
        addAudit('discharge_confirmed', id, name, room, doctorName, 'doctor',
          'Doctor confirmed discharge.', BASE_DATE);
      }
    } else if (room <= 35) {
      // ── Category 2: exactly 2 fever-free days ───────────────────────
      // Today and yesterday normal, day before = fever
      addReading(id, BASE_DATE, tempValue(room, 0, false), nurseName);
      addReading(id, subtractDays(BASE_DATE, 1), tempValue(room, 1, false), nurseName);
      addReading(id, subtractDays(BASE_DATE, 2), tempValue(room, 2, true), nurseName);
      for (let d = 0; d < 3; d++) {
        const date = subtractDays(BASE_DATE, d);
        const isFever = d === 2;
        addAudit('temperature_recorded', id, name, room, nurseName, 'nurse',
          `Temperature recorded: ${tempValue(room, d, isFever)}°C`, date);
      }
      if (room % 4 === 0) {
        addVisit(id, BASE_DATE, doctorName, 'Monitoring, 2 days fever-free.');
        addAudit('visit_recorded', id, name, room, doctorName, 'doctor',
          'Visit recorded.', BASE_DATE);
      }
    } else if (room <= 50) {
      // ── Category 3: exactly 1 fever-free day ───────────────────────
      // Today normal, yesterday fever
      addReading(id, BASE_DATE, tempValue(room, 0, false), nurseName);
      addReading(id, subtractDays(BASE_DATE, 1), tempValue(room, 1, true), nurseName);
      addAudit('temperature_recorded', id, name, room, nurseName, 'nurse',
        `Temperature recorded: ${tempValue(room, 0, false)}°C`, BASE_DATE);
      addAudit('temperature_recorded', id, name, room, nurseName, 'nurse',
        `Temperature recorded: ${tempValue(room, 1, true)}°C`, subtractDays(BASE_DATE, 1));
      if (room % 5 === 0) {
        addVisit(id, BASE_DATE, doctorName, 'Still monitoring, only 1 day fever-free.');
        addAudit('visit_recorded', id, name, room, doctorName, 'doctor',
          'Visit recorded.', BASE_DATE);
      }
    } else if (room <= 60) {
      // ── Category 4: fever today ─────────────────────────────────────
      addReading(id, BASE_DATE, tempValue(room, 0, true), nurseName);
      addAudit('temperature_recorded', id, name, room, nurseName, 'nurse',
        `Temperature recorded: ${tempValue(room, 0, true)}°C (fever)`, BASE_DATE);
      // Maybe some history too
      if (room % 2 === 0) {
        addReading(id, subtractDays(BASE_DATE, 1), tempValue(room, 1, true), nurseName);
      }
      if (room % 3 === 0) {
        addVisit(id, BASE_DATE, doctorName, 'Patient still febrile, continue treatment.');
        addAudit('visit_recorded', id, name, room, doctorName, 'doctor',
          'Visit recorded.', BASE_DATE);
      }
    } else {
      // ── Category 5: rooms 61-74 – no history or missing days ────────
      // Some have zero readings, some have sporadic past readings with gaps
      if (room % 3 === 0) {
        // A reading 3 days ago but nothing since → streak = 0
        addReading(id, subtractDays(BASE_DATE, 3), tempValue(room, 3, false), nurseName);
        addAudit('temperature_recorded', id, name, room, nurseName, 'nurse',
          `Temperature recorded: ${tempValue(room, 3, false)}°C`, subtractDays(BASE_DATE, 3));
      }
      // Otherwise truly empty history
    }
  }

  // ── Closed cases (discharged: rooms 75-79, deceased: rooms 80-81) ───────

  for (let room = 75; room <= 79; room++) {
    const id = `p-${room}`;
    const name = getName(room);
    const admitDate = subtractDays(BASE_DATE, 10 + (room % 3));
    const dischDate = subtractDays(BASE_DATE, 2 + (room % 2));

    patients.push({
      id,
      name,
      roomNumber: room,
      admissionDate: admitDate,
      status: 'discharged',
      dischargeDate: dischDate,
    });

    // Generate some temperature history for these closed cases
    for (let d = 0; d < 5; d++) {
      const date = subtractDays(dischDate, d);
      addReading(id, date, tempValue(room, d, false), pick(NURSE_NAMES, room + d, 3));
    }

    addAudit('discharge_executed', id, name, room, 'Admin Raj', 'admin',
      `Patient discharged on ${dischDate}.`, dischDate);
  }

  for (let room = 80; room <= 81; room++) {
    const id = `p-${room}`;
    const name = getName(room);
    const admitDate = subtractDays(BASE_DATE, 12 + (room % 3));
    const decDate = subtractDays(BASE_DATE, 3 + (room % 2));

    patients.push({
      id,
      name,
      roomNumber: room,
      admissionDate: admitDate,
      status: 'deceased',
      deceasedDate: decDate,
    });

    // Some temperature history
    for (let d = 0; d < 4; d++) {
      const date = subtractDays(decDate, d);
      addReading(id, date, tempValue(room, d, d < 2), pick(NURSE_NAMES, room + d, 5));
    }

    addAudit('deceased_recorded', id, name, room, pick(DOCTOR_NAMES, room, 19), 'doctor',
      `Patient deceased on ${decDate}.`, decDate);
  }

  return {
    currentDate: BASE_DATE,
    patients,
    temperatureReadings,
    doctorVisits,
    auditLog,
    dischargeQueue,
  } as AppState;
}
