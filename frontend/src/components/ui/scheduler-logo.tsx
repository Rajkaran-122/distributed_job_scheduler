import * as React from 'react';

interface SchedulerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  withPulse?: boolean;
}

export function SchedulerLogo({
  className = '',
  size = 'md',
  showText = false,
  withPulse = true,
}: SchedulerLogoProps) {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-14 w-14',
  };

  const svgSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${svgSize} drop-shadow-[0_0_10px_rgba(59,130,246,0.35)] transition-transform duration-300 group-hover:scale-105`}
        >
          <defs>
            <linearGradient id="sched-grad-core" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="sched-grad-ring" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Hexagonal Outer Orbit Shell */}
          <polygon
            points="24,3 41,12.5 41,35.5 24,45 7,35.5 7,12.5"
            stroke="url(#sched-grad-ring)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-80"
          />

          {/* Interconnecting Lattice Circuit Nodes */}
          <path
            d="M24 10 L37 24 L24 38 L11 24 Z"
            stroke="#3B82F6"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            className="opacity-60"
          />

          {/* Radial Bus Lines connecting to Core */}
          <line x1="24" y1="10" x2="24" y2="19" stroke="#60A5FA" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="37" y1="24" x2="29" y2="24" stroke="#3B82F6" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="24" y1="38" x2="24" y2="29" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="11" y1="24" x2="19" y2="24" stroke="#3B82F6" strokeWidth="1.75" strokeLinecap="round" />

          {/* Perimeter Orbital Nodes */}
          <circle cx="24" cy="3" r="2.25" fill="#60A5FA" />
          <circle cx="41" cy="12.5" r="2" fill="#3B82F6" />
          <circle cx="41" cy="35.5" r="2" fill="#2563EB" />
          <circle cx="24" cy="45" r="2.25" fill="#1D4ED8" />
          <circle cx="7" cy="35.5" r="2" fill="#2563EB" />
          <circle cx="7" cy="12.5" r="2" fill="#60A5FA" />

          {/* Central Control Plane Core */}
          <rect
            x="19"
            y="19"
            width="10"
            height="10"
            rx="2.5"
            transform="rotate(45 24 24)"
            fill="url(#sched-grad-core)"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
        </svg>

        {/* Live Status Beacon Indicator in Blue */}
        {withPulse && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[#0B0E14]" />
          </span>
        )}
      </div>

      {showText && (
        <div className="leading-tight flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
              Scheduler
            </span>
            <span className="rounded bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.2 text-[9px] font-mono font-semibold uppercase tracking-wider text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
              Control Plane
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">
            Distributed Execution Engine
          </span>
        </div>
      )}
    </div>
  );
}
