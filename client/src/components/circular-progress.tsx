import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";

interface CircularProgressProps {
  completed: boolean;
  progress?: number; // 0-100, for sub-blocks showing task completion
  diameter?: number;
  strokeWidth?: number;
  onClick?: (e: React.MouseEvent) => void;
  colorVar?: string; // CSS variable name like '--module-planner'
  className?: string;
}

export function CircularProgress({
  completed,
  progress = 0,
  diameter = 16,
  strokeWidth = 1.5,
  onClick,
  colorVar = '--primary',
  className = "",
}: CircularProgressProps) {
  const [isHovered, setIsHovered] = useState(false);
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = diameter / 2;

  return (
    <div
      className={`flex-shrink-0 cursor-pointer transition-transform ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="transition-opacity"
        style={{ opacity: isHovered ? 0.8 : 1 }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`hsl(var(${colorVar}) / 0.2)`}
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        {progress > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`hsl(var(${colorVar}))`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}

        {/* Checkmark for completed */}
        {completed && (
          <g>
            <path
              d={`M ${center - diameter * 0.15} ${center} L ${center - diameter * 0.05} ${center + diameter * 0.15} L ${center + diameter * 0.15} ${center - diameter * 0.1}`}
              stroke={`hsl(var(${colorVar}))`}
              strokeWidth={strokeWidth * 1.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

