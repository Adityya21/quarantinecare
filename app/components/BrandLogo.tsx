'use client';

import React from 'react';

export default function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="28" height="28" rx="6" fill="#1F6F6B" />
      <rect
        x="1"
        y="1"
        width="26"
        height="26"
        rx="5"
        stroke="#FAFAF8"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
      {/* Clinical cross + architectural ward bar */}
      <path
        d="M14 7V21M7 14H21"
        stroke="#FAFAF8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="20.5" cy="7.5" r="2" fill="#E6F0E8" />
    </svg>
  );
}

