import React, { useEffect, useRef, useState } from "react";

interface MetricRingProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  sublabel?: string;
  icon?: React.ReactNode;
  animate?: boolean;
}

const SIZE_MAP = {
  sm: { diameter: 80, strokeWidth: 8, fontSize: "text-lg", unitSize: "text-[9px]", labelSize: "text-[9px]" },
  md: { diameter: 110, strokeWidth: 10, fontSize: "text-xl", unitSize: "text-[10px]", labelSize: "text-[10px]" },
  lg: { diameter: 140, strokeWidth: 12, fontSize: "text-3xl", unitSize: "text-xs", labelSize: "text-xs" },
};

export function MetricRing({
  value,
  max,
  label,
  unit,
  color = "#ef4444",
  size = "md",
  sublabel,
  icon,
  animate = true,
}: MetricRingProps) {
  const { diameter, strokeWidth, fontSize, unitSize, labelSize } = SIZE_MAP[size];
  const [animatedProgress, setAnimatedProgress] = useState(0);
  // Stable filter ID based on label to avoid conflicts
  const filterId = `glow-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  useEffect(() => {
    if (!animate) {
      setAnimatedProgress(clampedProgress);
      return;
    }
    // Animate from 0 to target over ~800ms
    let start: number | null = null;
    const target = clampedProgress;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const duration = 800;
      const prog = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - prog, 3);
      setAnimatedProgress(eased * target);
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [clampedProgress, animate]);

  const strokeDashoffset = circumference - animatedProgress * circumference;
  const center = diameter / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative rounded-full"
        style={{
          width: diameter,
          height: diameter,
          boxShadow: `inset 0 2px 8px rgba(0,0,0,0.35), inset 0 -1px 3px rgba(255,255,255,0.04), 0 0 ${animatedProgress > 0.1 ? "16px" : "0px"} ${color}30`
        }}
      >
        {/* Subtle inner gradient for depth */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.03) 0%, transparent 60%)' }}
        />
        <svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          <defs>
            <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={0.22}
          />
          {/* Progress ring with glow */}
          {animatedProgress > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter={`url(#${filterId})`}
              style={{ transition: "stroke-dashoffset 0.05s linear" }}
            />
          )}
        </svg>
        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ top: 0, left: 0 }}
        >
          {icon && <div className="mb-0.5">{icon}</div>}
          <span className={`font-mono font-black tabular-nums leading-none ${fontSize}`}>
            {value > 999 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
          </span>
          {unit && (
            <span className={`text-muted-foreground font-medium leading-none mt-0.5 ${unitSize}`}>
              {unit}
            </span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className={`font-semibold uppercase tracking-widest text-muted-foreground leading-none ${labelSize}`}>
          {label}
        </p>
        {sublabel && (
          <p className={`text-muted-foreground/70 leading-none mt-0.5 ${labelSize}`}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
