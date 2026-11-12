export type Role = 'nurse' | 'doctor' | 'admin';
export type PatientStatus = 'admitted' | 'discharged' | 'deceased';

export interface Patient {
  id: string;
  name: string;
  roomNumber: number;
  admissionDate: string; // YYYY-MM-DD
  status: PatientStatus;
  dischargeDate?: string;
  deceasedDate?: string;
}

export interface TemperatureReading {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  temperature: number; // Celsius
  recordedBy: string;
  recordedByRole: Role;
  recordedAt: string; // ISO timestamp
  corrected?: boolean;
  correctedBy?: string;
  correctedByRole?: Role;
  correctedAt?: string;
  correctionReason?: string;
  previousValue?: number;
}

export interface DoctorVisit {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  notes: string;
  recordedBy: string;
  recordedAt: string; // ISO timestamp
  dischargeConfirmed?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'temperature_recorded'
    | 'temperature_corrected'
    | 'visit_recorded'
    | 'discharge_confirmed'
    | 'discharge_executed'
    | 'deceased_recorded';
  patientId: string;
  patientName: string;
  roomNumber: number;
  performedBy: string;
  performedByRole: Role;
  details: string;
}

export interface AppState {
  currentDate: string; // YYYY-MM-DD simulated today
  patients: Patient[];
  temperatureReadings: TemperatureReading[];
  doctorVisits: DoctorVisit[];
  auditLog: AuditLogEntry[];
  dischargeQueue: string[]; // patientIds confirmed by doctor
}
