'use client';

import React from 'react';

  export default function BrandLogo({ size = 24 }: { size?: number }) {
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
          x="0.75"
          y="0.75"
          width="26.5"
          height="26.5"
          rx="5.25"
          stroke="#8FD3CC"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <path
          d="M14 7V21M7 14H21"
          stroke="#F4F3EE"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="20.5" cy="7.5" r="2" fill="#8FD3CC" />
      </svg>
    );
  }
