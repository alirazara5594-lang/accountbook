import React from 'react';

interface AmsLogoProps {
  variant?: 'full' | 'sidebar' | 'icon' | 'monogram';
  className?: string;
  height?: number | string;
}

export default function AmsLogo({
  variant = 'full',
  className = '',
  height = 36,
}: AmsLogoProps) {
  const isSidebar = variant === 'sidebar';
  const textColor = isSidebar ? '#ffffff' : '#0f172a';
  const subtextColor = isSidebar ? '#93c5fd' : '#475569';
  const dividerColor = isSidebar ? 'rgba(255, 255, 255, 0.25)' : '#94a3b8';

  if (variant === 'icon' || variant === 'monogram') {
    return (
      <svg
        viewBox="0 0 162 58"
        height={height}
        className={`ams-logo-svg ${className}`}
        style={{ display: 'block', overflow: 'visible' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ams-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="ams-bar-1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="ams-bar-2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="ams-bar-3" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
        </defs>

        {/* 3 Green Rising Bar Pillars with Clean Negative Space */}
        <g className="ams-growth-bars">
          <path d="M 29.5 45 L 29.5 35 Q 31.5 33 33.5 35 L 33.5 45 Z" fill="url(#ams-bar-1)" />
          <path d="M 35.5 45 L 35.5 27 Q 37.6 24.8 39.7 27 L 39.7 45 Z" fill="url(#ams-bar-2)" />
          <path d="M 41.8 45 L 41.8 19 Q 44 16.5 46.2 19 L 46.2 45 Z" fill="url(#ams-bar-3)" />
        </g>

        {/* Continuous Geometric AMS Monogram with Growth Arrow */}
        <path
          d="M 12 34 Q 24 34 29 24 L 41 8 Q 43.5 4 46 8 L 56 46 Q 57 49 61 49"
          stroke="url(#ams-line-grad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 61 49 Q 65 49 67 42 L 74 18 Q 77 12 80 18 L 88 34 Q 90 38 92 34 L 100 18 Q 103 12 106 18 L 112 42 Q 114 49 119 49"
          stroke="url(#ams-line-grad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 119 49 Q 134 49 135 40 Q 136 31 124 29 Q 112 27 114 18 Q 116 10 128 10 L 145 10"
          stroke="url(#ams-line-grad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M 140 5 L 150 10 L 140 15 Z" fill="#38bdf8" />
      </svg>
    );
  }

  return (
    <div
      className={`ams-brand-identity-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSidebar ? '7px' : '12px',
        userSelect: 'none',
      }}
    >
      <svg
        viewBox="0 0 156 56"
        height={height}
        className="ams-monogram-svg"
        style={{ display: 'block', flexShrink: 0 }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ams-line-grad-full" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="ams-bar-full-1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="ams-bar-full-2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="ams-bar-full-3" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
        </defs>

        {/* 3 Green Rising Bar Pillars with Clean Negative Space */}
        <g className="ams-growth-bars">
          <path d="M 29.5 45 L 29.5 35 Q 31.5 33 33.5 35 L 33.5 45 Z" fill="url(#ams-bar-full-1)" />
          <path d="M 35.5 45 L 35.5 27 Q 37.6 24.8 39.7 27 L 39.7 45 Z" fill="url(#ams-bar-full-2)" />
          <path d="M 41.8 45 L 41.8 19 Q 44 16.5 46.2 19 L 46.2 45 Z" fill="url(#ams-bar-full-3)" />
        </g>

        <path
          d="M 12 34 Q 24 34 29 24 L 41 8 Q 43.5 4 46 8 L 56 46 Q 57 49 61 49"
          stroke="url(#ams-line-grad-full)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 61 49 Q 65 49 67 42 L 74 18 Q 77 12 80 18 L 88 34 Q 90 38 92 34 L 100 18 Q 103 12 106 18 L 112 42 Q 114 49 119 49"
          stroke="url(#ams-line-grad-full)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 119 49 Q 134 49 135 40 Q 136 31 124 29 Q 112 27 114 18 Q 116 10 128 10 L 145 10"
          stroke="url(#ams-line-grad-full)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M 140 5 L 150 10 L 140 15 Z" fill="#38bdf8" />
      </svg>

      <div
        className="ams-brand-divider"
        style={{
          width: '1px',
          height: isSidebar ? '26px' : '34px',
          backgroundColor: dividerColor,
          flexShrink: 0,
        }}
      />

      <div
        className="ams-brand-text-block"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          lineHeight: 1.1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
            fontSize: isSidebar ? '9.5px' : '11.5px',
            fontWeight: 800,
            letterSpacing: '0.4px',
            color: textColor,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Accounting
        </span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
            fontSize: isSidebar ? '9px' : '11px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            color: textColor,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Management
        </span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
            fontSize: isSidebar ? '9px' : '11px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            color: '#38bdf8',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Solutions
        </span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
            fontSize: isSidebar ? '6.5px' : '7.5px',
            fontWeight: 800,
            letterSpacing: '0.8px',
            color: '#c084fc',
            textTransform: 'uppercase',
            marginTop: '1.5px',
            textShadow: isSidebar ? '0 0 8px rgba(192, 132, 252, 0.4)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Enterprise ERP
        </span>
      </div>
    </div>
  );
}
