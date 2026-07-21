import React from "react";
import { defineWidget, WidgetDefinition } from "./module-grid";
import { Battery, Flame, Heart, Sparkles, Clock, Compass, Activity, Droplet, CheckCircle } from "lucide-react";
import { format } from "date-fns";

// Reusable flat gauge indicator
function FlatCircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  color = "#3b82f6",
  backgroundColor = "#f1f5f9",
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="transition-all duration-300"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="transition-all duration-300"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-900 leading-none">{Math.round(value)}</span>
          {label && <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{label}</span>}
        </div>
      </div>
    </div>
  );
}

// 1. Body Readiness Widget
export const bodyReadinessWidget = defineWidget({
  id: "body_readiness",
  label: "Body Readiness",
  icon: Heart,
  defaultW: 2,
  defaultH: 2,
  visualizations: [
    { id: "ring", label: "Readiness Ring" },
    { id: "components", label: "Component Bars" },
  ],
  render: ({ size, shape, visualizationId }) => {
    // For MVP, we can read from the query cache or simulate
    const readiness = 78; // mock or fetch from context
    const components = {
      sleep: 82,
      activity: 70,
      nutrition: 85,
      hygiene: 90,
    };

    if (visualizationId === "components" || shape === "horizontal") {
      return (
        <div className="flex flex-col h-full justify-between p-4 bg-white select-none">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Readiness</p>
              <h3 className="text-lg font-black text-slate-900 leading-tight">Details</h3>
            </div>
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
              Optimal
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 flex-1 items-end mt-2">
            {Object.entries(components).map(([key, val]) => (
              <div key={key} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full bg-slate-100 rounded-full h-24 relative overflow-hidden flex flex-col justify-end">
                  <div
                    className="bg-blue-500 rounded-full transition-all duration-500"
                    style={{ height: `${val}%`, backgroundColor: key === "sleep" ? "#6366f1" : key === "activity" ? "#f59e0b" : key === "nutrition" ? "#10b981" : "#ec4899" }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 capitalize">{key}</span>
                <span className="text-xs font-black text-slate-900 leading-none">{val}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full justify-between p-4 bg-white select-none">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Readiness</p>
          <h3 className="text-lg font-black text-slate-900 leading-tight">Body Readiness</h3>
        </div>
        <div className="flex items-center justify-center my-2 flex-1">
          <FlatCircularProgress value={readiness} size={110} strokeWidth={10} color="#10b981" label="Score" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">Your body is well-rested and ready for high effort today.</p>
        </div>
      </div>
    );
  },
});

// 2. Energy Reserve Widget
export const energyReserveWidget = defineWidget({
  id: "energy_reserve",
  label: "Energy Reserve",
  icon: Battery,
  defaultW: 2,
  defaultH: 1,
  visualizations: [
    { id: "battery", label: "Battery blocks" },
  ],
  render: ({ size, shape }) => {
    const charge = 64; // mock
    const blocksCount = 5;
    const activeBlocks = Math.round((charge / 100) * blocksCount);

    return (
      <div className="flex flex-col h-full justify-between p-4 bg-white select-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Energy</p>
            <h3 className="text-sm font-black text-slate-900 leading-tight">Energy Reserve</h3>
          </div>
          <span className="text-2xl font-black text-slate-900">{charge}%</span>
        </div>
        <div className="flex gap-1.5 mt-3 my-1">
          {Array.from({ length: blocksCount }).map((_, i) => (
            <div
              key={i}
              className="h-6 flex-1 rounded-md transition-all duration-300"
              style={{
                backgroundColor: i < activeBlocks ? "#3b82f6" : "#f1f5f9",
              }}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground font-medium truncate">Recharging. Sleep quality was favorable.</p>
      </div>
    );
  },
});

// 3. Today's Load & Tasks
export const bodyTasksWidget = defineWidget({
  id: "body_tasks_today",
  label: "Body Tasks Today",
  icon: CheckCircle,
  defaultW: 2,
  defaultH: 1,
  visualizations: [
    { id: "list", label: "Planned Tasks" },
  ],
  render: () => {
    const tasks = [
      { name: "Morning Routine", done: true, time: "08:30" },
      { name: "Leg Workout", done: false, time: "16:00" },
      { name: "Sleep Wind-down", done: false, time: "22:00" },
    ];

    return (
      <div className="flex flex-col h-full justify-between p-4 bg-white select-none">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Schedule</p>
          <h3 className="text-sm font-black text-slate-900 leading-tight">Body Tasks Today</h3>
        </div>
        <div className="space-y-1.5 mt-2 flex-1">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-50 last:border-0">
              <span className={task.done ? "line-through text-muted-foreground" : "font-semibold text-slate-800"}>
                {task.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                {task.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

export const hubWidgetsList = [bodyReadinessWidget, energyReserveWidget, bodyTasksWidget];
