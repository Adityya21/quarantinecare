# QuarantineCare

A 74-room quarantine and treatment facility ward board and clinical tracking web application built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Overview

QuarantineCare replaces manual paper temperature journals with a shared, real-time ward floor plan that tracks daily temperature readings, enforces doctor visit sequencing after temperature measurement, flags patients eligible for discharge after 3 consecutive fever-free days, and monitors facility mortality against the 15% expected benchmark (85% success target).

## Key Features

- **The Ward Board (`/dashboard`)**: Architectural 74-room floor plan (West Wing 01-37 and East Wing 38-74 facing a central corridor and Nurses' station). Each room cell displays stacked status bars (top: temperature, bottom: doctor visit with a lock glyph until today's temperature is recorded), discharge-eligibility corner tabs, role lenses, filters, priority-sorted list view, and a black-and-white print stylesheet.
- **Round Mode**: Focused one-patient-at-a-time workflow for Nurses (pending temperatures with auto-advance) and Doctors (measured patients sorted fever-first, then longest fever-free streak, with keyboard navigation).
- **Patient Chart & Streak Ribbon (`/patient/[id]` and side panel / mobile sheet)**: 7-day visual fever-free streak ribbon with a computed plain-text eligibility explainer, temperature history, and visit notes.
- **Discharge Queue (`/discharge`)**: Admin workflow to execute Doctor-confirmed discharges with confirmation dialogs, freeing rooms and updating bed occupancy.
- **Treatment Outcomes (`/outcomes`)**: Horizontal 0-30% mortality gauge against the 15% expected benchmark, critical alert banner when mortality exceeds 15%, and small-sample reliability notice below 20 closed cases.
- **Audit Log (`/audit`)**: Immutable chronological trail of all temperature recordings, Doctor corrections (with mandatory reason), visits, discharge confirmations, executions, and outcomes.
- **Demo Controls**: In-app settings menu to advance the simulated date, reset demo data, or load scenarios (`Normal day`, `Busy morning`, `Mortality above expected`).

## Roles & Permissions

- **Nurse**: View patients, record one daily temperature (34.0-43.0 C), run temperature rounds. Cannot record visits, correct readings, discharge patients, or view outcomes/audit.
- **Doctor**: View all patients, log visits (unlocked after today's temperature exists), correct temperatures with a mandatory reason, confirm discharge readiness, record deceased outcomes, and view outcomes.
- **Admin staff**: Execute Doctor-confirmed discharges, monitor occupancy and outcomes, and inspect the audit log. Cannot record temperatures or visits.

## Documented Assumptions

- **Fever threshold**: `38.0 C` (`100.4 F`) or higher resets the fever-free streak to `0`.
- **Valid temperature range**: `34.0 C` to `43.0 C`; out-of-range entries are blocked.
- **Missing days**: Any calendar day without a recorded reading breaks the fever-free streak.
- **Mortality formula**: `deceased / (cured-and-discharged + deceased)` over closed cases (`N/A` when closed cases = `0`).
- **Small-sample limit**: Displays a reliability notice when total closed cases `< 20`.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + `next/font/google` (`Fraunces`, `Inter`, `JetBrains Mono`)
- **Icons**: `lucide-react`
- **State & Persistence**: React Context + SSR-safe `localStorage` (no backend, database, or environment variables required)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

## Deploying to Vercel

```bash
npx vercel login
npx vercel --prod
```

Or push this repository to GitHub and import it at [vercel.com/new](https://vercel.com/new).
