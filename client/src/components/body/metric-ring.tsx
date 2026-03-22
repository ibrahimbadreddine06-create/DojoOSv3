import React, { useEffect, useState } from "react";

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
  sm: { diameter: 80, strokeWidth: 9, fontSize: "text-lg", unitSize: "text-[9px]", labelSize: "text-[9px]" },
  md: { diameter: 110, strokeWidth: 11, fontSize: "text-xl", unitSize: "text-[10px]", labelSize: "text-[10px]" },
  lg: { diameter: 140, strokeWidth: 13, fontSize: "text-3xl", unitSize: "text-xs", labelSize: "text-xs" },
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

  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  useEffect(() => {
    if (!animate) {
      setAnimatedProgress(clampedProgress);
      return;
    }
    let start: number | null = null;
    const target = clampedProgress;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const prog = Math.min(elapsed / 800, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setAnimatedProgress(eased * target);
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [clampedProgress, animate]);

  const strokeDashoffset = circumference - animatedProgress * circumference;
  const center = diameter / 2;
  // Unique filter ID per ring
  const filterId = `ring-glow-${label.replace(/\W/g, "")}`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative rounded-full"
        style={{
          width: diameter,
          height: diameter,
          // Strong colored outer glow
          filter: animatedProgress > 0.05
            ? `drop-shadow(0 0 10px ${color}88) drop-shadow(0 0 4px ${color}55)`
            : "none",
        }}
      >
        <svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
          style={{ transform: "rotate(-90deg)", display: "block" }}
        >
          <defs>
            <linearGradient id={`grad-${filterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {/* Track ring - clearly visible */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={0.18}
          />
          {/* Progress ring - bold with gradient */}
          {animatedProgress > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`url(#grad-${filterId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.05s linear" }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <div className="mb-0.5">{icon}</div>}
          <span
            className={`font-mono font-black tabular-nums leading-none ${fontSize}`}
            style={{ color: animatedProgress > 0.05 ? color : undefined }}
          >
            {value > 999 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
          </span>
          {unit && (
            <span className={`font-medium leading-none mt-0.5 ${unitSize}`} style={{ color: `${color}99` }}>
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
          <p className={`text-muted-foreground/60 leading-none mt-0.5 ${labelSize}`}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
