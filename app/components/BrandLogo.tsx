'use client';

import React from 'react';

/**
 * 20px rounded square (4px radius) echoing a Ward Board room cell:
 * top half filled chrome-accent (#8FD3CC), bottom half 1.5px outline in chrome-accent.
 */
export default function BrandLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="0.75"
        y="0.75"
        width="18.5"
        height="18.5"
        rx="4"
        stroke="#8FD3CC"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      {/* Top half: filled chrome-accent */}
      <rect x="3" y="3" width="14" height="6" rx="1.5" fill="#8FD3CC" />
      {/* Bottom half: 1.5px outline in chrome-accent */}
      <rect
        x="3.75"
        y="11.25"
        width="12.5"
        height="5"
        rx="1"
        stroke="#8FD3CC"
        strokeWidth="1.5"
      />
    </svg>
  );
}
