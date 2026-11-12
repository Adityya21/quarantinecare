import type { TemperatureReading } from './types';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

/** ASSUMPTION: standard clinical fever threshold (≥ 38.0 °C) */
export const FEVER_THRESHOLD_C = 38.0;

/** ASSUMPTION: valid human temperature entry range – 34 °C to 43 °C */
export const TEMP_MIN_C = 34.0;
export const TEMP_MAX_C = 43.0;

/** Maximum quarantine facility bed capacity */
export const MAX_CAPACITY = 74;

/** Number of consecutive fever-free calendar days required before discharge */
export const FEVER_FREE_DAYS_FOR_DISCHARGE = 3;

/** ASSUMPTION: mortality rate above 15 % is flagged as above benchmark */
export const MORTALITY_BENCHMARK = 0.15;

/** ASSUMPTION: success (survival) rate benchmark mirrors mortality benchmark */
export const SUCCESS_BENCHMARK = 0.85;

/** ASSUMPTION: percentages are unreliable when total outcomes < 20 */
export const SMALL_SAMPLE_THRESHOLD = 20;

// ──────────────────────────────────────────────────────────────────────────────
// Temperature helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Returns true when `tempCelsius` is at or above the fever threshold (≥ 38.0 °C). */
export function hasFever(tempCelsius: number): boolean {
  return tempCelsius >= FEVER_THRESHOLD_C;
}

/** Returns true when the temperature falls within the valid entry range [34.0, 43.0] °C. */
export function isValidTemperature(tempCelsius: number): boolean {
  return tempCelsius >= TEMP_MIN_C && tempCelsius <= TEMP_MAX_C;
}

/** Convert Celsius → Fahrenheit. */
export function celsiusToFahrenheit(c: number): number {
  return +(c * 9 / 5 + 32).toFixed(1);
}

/** Convert Fahrenheit → Celsius. */
export function fahrenheitToCelsius(f: number): number {
  return +((f - 32) * 5 / 9).toFixed(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Format a Date object (or YYYY-MM-DD string) to YYYY-MM-DD.
 * Operates on the date value as-is (no timezone shifting).
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Return the YYYY-MM-DD string for the day before `dateStr`. */
export function getPreviousDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

/** Return the YYYY-MM-DD string for the day after `dateStr`. */
export function getNextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}

// ──────────────────────────────────────────────────────────────────────────────
// Fever-free streak & discharge eligibility
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Count consecutive calendar days backwards from `currentDate` (inclusive) where
 * a recorded temperature reading exists AND is below the fever threshold.
 *
 * Rules:
 * - A missing day (no reading recorded) **breaks** the streak.
 * - A fever reading (≥ 38.0 °C) **breaks** the streak.
 * - Only the latest reading per day is considered (in case of corrections the
 *   array may hold the corrected value).
 */
export function calculateFeverFreeStreak(
  readings: TemperatureReading[],
  currentDate: string,
): number {
  // Build a map: date → latest temperature for quick lookup
  const tempByDate = new Map<string, number>();
  for (const r of readings) {
    // If multiple readings exist for a day, keep the one recorded latest
    const existing = tempByDate.get(r.date);
    if (existing === undefined || r.temperature !== existing) {
      // Just overwrite – seed data produces one reading per day per patient
      tempByDate.set(r.date, r.temperature);
    }
  }

  let streak = 0;
  let day = currentDate;

  while (true) {
    const temp = tempByDate.get(day);
    if (temp === undefined) break; // missing day breaks streak
    if (hasFever(temp)) break;    // fever breaks streak
    streak++;
    day = getPreviousDay(day);
  }

  return streak;
}

/**
 * A patient is eligible for discharge when their fever-free streak is at least
 * `FEVER_FREE_DAYS_FOR_DISCHARGE` (3) consecutive calendar days.
 */
export function isEligibleForDischarge(
  readings: TemperatureReading[],
  currentDate: string,
): boolean {
  return calculateFeverFreeStreak(readings, currentDate) >= FEVER_FREE_DAYS_FOR_DISCHARGE;
}

// ──────────────────────────────────────────────────────────────────────────────
// Outcome statistics
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Mortality rate = deceased / (discharged + deceased).
 * Returns `null` when the denominator is 0 (no outcomes yet).
 */
export function calculateMortalityRate(
  discharged: number,
  deceased: number,
): number | null {
  const total = discharged + deceased;
  if (total === 0) return null;
  return deceased / total;
}

/**
 * Success (survival) rate = 1 − mortality rate.
 * Returns `null` when mortality rate is null.
 */
export function calculateSuccessRate(
  discharged: number,
  deceased: number,
): number | null {
  const mortality = calculateMortalityRate(discharged, deceased);
  if (mortality === null) return null;
  return 1 - mortality;
}

/** Returns true when the facility mortality rate exceeds the benchmark (15 %). */
export function isMortalityAboveBenchmark(
  discharged: number,
  deceased: number,
): boolean {
  const rate = calculateMortalityRate(discharged, deceased);
  if (rate === null) return false;
  return rate > MORTALITY_BENCHMARK;
}

/** Returns true when total outcomes (discharged + deceased) are below the small-sample threshold (20). */
export function isSmallSample(discharged: number, deceased: number): boolean {
  return discharged + deceased < SMALL_SAMPLE_THRESHOLD;
}

// ──────────────────────────────────────────────────────────────────────────────
// ID generation
// ──────────────────────────────────────────────────────────────────────────────

let _counter = 0;

/**
 * Generate a unique-enough ID for client-side entities.
 * Combines a timestamp with a monotonic counter to avoid collisions within the
 * same millisecond.
 */
export function generateId(): string {
  _counter++;
  return `${Date.now().toString(36)}-${_counter.toString(36)}`;
}
