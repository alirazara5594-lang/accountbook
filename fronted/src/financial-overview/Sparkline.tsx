import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}

export function Sparkline({ data, color = '#0d9488', height = 30, fill = true }: SparklineProps) {
  const w = 100;
  const h = 30;
  const id = React.useId().replace(/[:]/g, '');
  if (!data || data.length < 2) return <div style={{ height }} aria-hidden />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 5);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = pts.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <polygon points={area} fill={`url(#spark-${id})`} />}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}