'use client';

import React from 'react';
import type { TemperatureReading } from '@/app/lib/types';
import {
  calculateFeverFreeStreak,
  celsiusToFahrenheit,
  getPreviousDay,
  hasFever,
  getEligibilityExplainer,
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
  const explainer = getEligibilityExplainer(readings, currentDate, temperatureUnit);

  const activeStreakIndices = new Set<number>();
  for (let i = 0; i < streak && i < 7; i++) {
    activeStreakIndices.add(6 - i);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="caption-label text-[#6B7680] font-semibold">
          7-Day Fever-Free Streak
        </span>
        <span className="font-mono tabular-nums text-xs font-semibold text-[#1F2933]">
          {streak} {streak === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Ribbon of 7 cells */}
      <div className="relative grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          const reading = readingByDate.get(day);
          const shortDate = day.slice(5);
          const isInStreak = activeStreakIndices.has(idx);

          if (!reading) {
            return (
              <div
                key={day}
                title={`${day}: Missing reading`}
                className="flex flex-col items-center justify-between p-1.5 rounded-lg border border-dashed border-[#A3A199] bg-[#FAFAF8] min-h-[56px]"
              >
                <span className="font-mono tabular-nums text-[10px] text-[#6B7680]">
                  {shortDate}
                </span>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#6B7680]">
                  --
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#6B7680]">
                  Miss
                </span>
              </div>
            );
          }

          const fever = hasFever(reading.temperature);
          const displayVal =
            temperatureUnit === 'F'
              ? `${celsiusToFahrenheit(reading.temperature).toFixed(1)}`
              : `${reading.temperature.toFixed(1)}`;

          if (fever) {
            return (
              <div
                key={day}
                title={`${day}: ${displayVal} °${temperatureUnit} (Fever)`}
                className="flex flex-col items-center justify-between p-1.5 rounded-lg border-2 border-[#B91C1C] bg-[#FEF2F2] min-h-[56px]"
              >
                <span className="font-mono tabular-nums text-[10px] text-[#991B1B]">
                  {shortDate}
                </span>
                <span className="font-mono tabular-nums text-xs font-bold text-[#991B1B]">
                  {displayVal}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#991B1B]">
                  Fever
                </span>
              </div>
            );
          }

          return (
            <div
              key={day}
              title={`${day}: ${displayVal} °${temperatureUnit} (Fever-free)`}
              className={`relative flex flex-col items-center justify-between p-1.5 rounded-lg border min-h-[56px] transition-colors duration-150 ${
                eligible && isInStreak
                  ? 'border-[#1F6F6B] bg-[#E6F0E8]'
                  : 'border-[#4D7C5B] bg-[#E6F0E8]'
              }`}
            >
              <span className="font-mono tabular-nums text-[10px] text-[#284732]">
                {shortDate}
              </span>
              <span className="font-mono tabular-nums text-xs font-bold text-[#1F2933]">
                {displayVal}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#284732]">
                Clear
              </span>
            </div>
          );
        })}
      </div>

      {eligible && (
        <div className="flex items-center gap-2 pt-1">
          <div className="h-[2px] flex-1 bg-[#1F6F6B]" />
          <span className="text-xs font-semibold text-[#1F6F6B] uppercase tracking-wider">
            Eligible for discharge
          </span>
        </div>
      )}

      {/* Computed eligibility explainer */}
      <p className="text-xs text-[#6B7680]">{explainer}</p>
    </div>
  );
}
