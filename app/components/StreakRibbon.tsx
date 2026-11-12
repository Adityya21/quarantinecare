'use client';

import React from 'react';
import type { TemperatureReading } from '@/app/lib/types';
import {
  calculateFeverFreeStreak,
  celsiusToFahrenheit,
  getPreviousDay,
  hasFever,
} from '@/app/lib/logic';

interface StreakRibbonProps {
  readings: TemperatureReading[];
  currentDate: string;
  temperatureUnit: 'C' | 'F';
}

export default function StreakRibbon({
  readings,
  currentDate,
  temperatureUnit,
}: StreakRibbonProps) {
  // Build the last 7 calendar days (oldest -> newest, left -> right)
  const days: string[] = [];
  let cursor = currentDate;
  for (let i = 0; i < 7; i++) {
    days.unshift(cursor);
    cursor = getPreviousDay(cursor);
  }

  const readingByDate = new Map<string, TemperatureReading>();
  for (const r of readings) {
    readingByDate.set(r.date, r);
  }

  const streak = calculateFeverFreeStreak(readings, currentDate);
  const eligible = streak >= 3;

  // Identify indices (from right) that belong to the active fever-free streak
  const activeStreakIndices = new Set<number>();
  for (let i = 0; i < streak && i < 7; i++) {
    activeStreakIndices.add(6 - i);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="caption-label text-[#5c5b57] font-semibold">
          7-Day Fever-Free Streak
        </span>
        <span className="font-mono tabular-nums text-xs font-semibold text-[#141413]">
          {streak} {streak === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Ribbon of 7 cells */}
      <div className="relative grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          const reading = readingByDate.get(day);
          const shortDate = day.slice(5); // MM-DD
          const isInStreak = activeStreakIndices.has(idx);

          if (!reading) {
            return (
              <div
                key={day}
                title={`${day}: Missing reading (breaks streak)`}
                className="flex flex-col items-center justify-between p-1.5 rounded border border-dashed border-[#a3a199] bg-[#fafaf7] min-h-[56px]"
              >
                <span className="font-mono tabular-nums text-[10px] text-[#5c5b57]">
                  {shortDate}
                </span>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#5c5b57]">
                  --
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#5c5b57]">
                  Miss
                </span>
              </div>
            );
          }

          const fever = hasFever(reading.temperature);
          const displayVal =
            temperatureUnit === 'F'
              ? `${celsiusToFahrenheit(reading.temperature)}`
              : `${reading.temperature.toFixed(1)}`;

          if (fever) {
            return (
              <div
                key={day}
                title={`${day}: ${displayVal}°${temperatureUnit} (Fever)`}
                className="flex flex-col items-center justify-between p-1.5 rounded border-2 border-[#b91c1c] bg-[#fef2f2] min-h-[56px]"
              >
                <span className="font-mono tabular-nums text-[10px] text-[#991b1b]">
                  {shortDate}
                </span>
                <span className="font-mono tabular-nums text-xs font-bold text-[#991b1b]">
                  {displayVal}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#991b1b]">
                  Fever
                </span>
              </div>
            );
          }

          return (
            <div
              key={day}
              title={`${day}: ${displayVal}°${temperatureUnit} (Fever-free)`}
              className={`relative flex flex-col items-center justify-between p-1.5 rounded border min-h-[56px] transition-colors duration-150 ${
                eligible && isInStreak
                  ? 'border-[#0f766e] bg-[#e6f0e8]'
                  : 'border-[#4d7c5b] bg-[#e6f0e8]'
              }`}
            >
              <span className="font-mono tabular-nums text-[10px] text-[#284732]">
                {shortDate}
              </span>
              <span className="font-mono tabular-nums text-xs font-bold text-[#141413]">
                {displayVal}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#284732]">
                Clear
              </span>
            </div>
          );
        })}
      </div>

      {/* Connecting teal line + Eligible label when streak >= 3 */}
      {eligible ? (
        <div className="flex items-center gap-2 pt-1">
          <div className="h-[2px] flex-1 bg-[#0f766e]" />
          <span className="text-xs font-semibold text-[#0f766e] uppercase tracking-wider">
            Eligible for discharge (3+ consecutive clear days)
          </span>
        </div>
      ) : (
        <p className="text-xs text-[#5c5b57]">
          Missing days (dashed) and fever readings (&ge; 38.0&deg;C) break the 3-day streak.
        </p>
      )}
    </div>
  );
}

