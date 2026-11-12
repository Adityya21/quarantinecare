'use client';

import React from 'react';

interface WardCorridorBandProps {
  onChooseRole: () => void;
}

export default function WardCorridorBand({ onChooseRole }: WardCorridorBandProps) {
  return (
    <section
      aria-label="Ward corridor overview"
      className="no-print relative w-full bg-[#0F2E2D] border-t border-[rgba(244,243,238,0.12)] mt-10 md:mt-16 h-[240px] md:h-[280px] lg:h-[340px] overflow-hidden flex items-center"
    >
      {/* Option 2: Custom one-point perspective ward corridor inline SVG (< 4 KB) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 340"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vanishing point at (1040, 165) */}
        {/* Ceiling & floor perspective lines */}
        <line x1="360" y1="0" x2="1040" y2="165" stroke="#8FD3CC" strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="1440" y1="15" x2="1040" y2="165" stroke="#8FD3CC" strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="360" y1="340" x2="1040" y2="165" stroke="#8FD3CC" strokeOpacity="0.24" strokeWidth="1.5" />
        <line x1="1440" y1="320" x2="1040" y2="165" stroke="#8FD3CC" strokeOpacity="0.24" strokeWidth="1.5" />

        {/* Central floor guide line */}
        <line x1="720" y1="340" x2="1040" y2="165" stroke="#8FD3CC" strokeOpacity="0.16" strokeWidth="1.5" strokeDasharray="6 6" />

        {/* Far end corridor frame */}
        <rect x="990" y="135" width="100" height="60" stroke="#8FD3CC" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Left wing doors (receding toward vanishing point) */}
        <polygon points="560,65 650,86 650,254 560,278" stroke="#8FD3CC" strokeOpacity="0.28" strokeWidth="1.5" />
        <text x="582" y="108" fill="#8FD3CC" fillOpacity="0.35" fontSize="11" fontFamily="monospace">01</text>

        <polygon points="695,97 765,113 765,227 695,244" stroke="#8FD3CC" strokeOpacity="0.24" strokeWidth="1.5" />
        <text x="712" y="130" fill="#8FD3CC" fillOpacity="0.30" fontSize="10" fontFamily="monospace">02</text>

        <polygon points="805,121 858,132 858,208 805,219" stroke="#8FD3CC" strokeOpacity="0.20" strokeWidth="1.5" />
        <text x="818" y="148" fill="#8FD3CC" fillOpacity="0.25" fontSize="9" fontFamily="monospace">03</text>

        {/* Right wing doors (receding toward vanishing point) */}
        <polygon points="1350,46 1270,74 1270,260 1350,288" stroke="#8FD3CC" strokeOpacity="0.28" strokeWidth="1.5" />
        <text x="1296" y="96" fill="#8FD3CC" fillOpacity="0.35" fontSize="11" fontFamily="monospace">38</text>

        <polygon points="1230,88 1170,108 1170,224 1230,245" stroke="#8FD3CC" strokeOpacity="0.24" strokeWidth="1.5" />
        <text x="1188" y="126" fill="#8FD3CC" fillOpacity="0.30" fontSize="10" fontFamily="monospace">39</text>

        <polygon points="1138,118 1098,131 1098,199 1138,213" stroke="#8FD3CC" strokeOpacity="0.20" strokeWidth="1.5" />
        <text x="1108" y="146" fill="#8FD3CC" fillOpacity="0.25" fontSize="9" fontFamily="monospace">40</text>

        {/* Foreground Nurses' station outline (bottom-right) */}
        <path d="M1120 340 L1160 250 L1380 250 L1410 340" stroke="#8FD3CC" strokeOpacity="0.34" strokeWidth="1.5" />
        <line x1="1152" y1="268" x2="1388" y2="268" stroke="#8FD3CC" strokeOpacity="0.22" strokeWidth="1.5" />
      </svg>

      {/* Content aligned to 1120px container */}
      <div className="relative z-10 max-w-[1120px] mx-auto px-4 w-full">
        <div className="max-w-lg space-y-3">
          <span className="caption-label text-[#8FD3CC] font-semibold block">
            BUILT FOR THE WARD
          </span>
          <h2 className="font-serif-heading text-[28px] md:text-[36px] leading-[1.15] font-semibold text-[#F4F3EE]">
            Every room accounted for, every day.
          </h2>
          <p className="text-base text-[#A9C2BF] leading-relaxed">
            See who needs a temperature, who needs a visit and who can go home.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onChooseRole}
              className="w-full sm:w-auto px-5 min-h-[44px] rounded-[8px] border border-[#F4F3EE] text-[#F4F3EE] text-sm font-semibold hover:bg-[#163F3D] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8FD3CC] focus:ring-offset-2 focus:ring-offset-[#0F2E2D]"
            >
              Choose your role
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

