import React from "react";
import { Timer, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type FastingLog, type BodyProfile } from "@shared/schema";

interface FastingCardProps {
  activeLog?: FastingLog;
  bodyProfile?: BodyProfile;
  onConfigureClick: () => void;
}

export function FastingCard({ activeLog, bodyProfile, onConfigureClick }: FastingCardProps) {
  const isConfigured = !!bodyProfile?.fastingProgram;
  const isActive = activeLog?.status === "active";

  const startTime = isActive ? new Date(activeLog.startTime) : null;
  const elapsedMs = startTime ? Date.now() - startTime.getTime() : 0;
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="bg-card border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden min-h-[180px]">
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-orange-500" />
            <span className="text-[11px] font-medium tracking-wider text-muted-foreground">Fasting</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight">
              {!isConfigured ? "Program Off" : isActive ? "Fasting" : "Eating Window"}
            </span>
            <span className="text-[10px] text-muted-foreground/50 font-medium">
              {isConfigured ? (typeof bodyProfile.fastingProgram === 'string' ? bodyProfile.fastingProgram : bodyProfile.fastingProgram?.preset) : "Not configured"}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/40 hover:text-orange-500 hover:bg-orange-500/10"
          onClick={onConfigureClick}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 flex flex-col items-center justify-center relative z-10">
        {isActive ? (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black font-mono tracking-tighter">
              {elapsedHours.toString().padStart(2, '0')}:{elapsedMinutes.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] font-medium text-orange-500/70 mt-1 tracking-wider">Elapsed Time</span>
          </div>
        ) : !isConfigured ? (
          <p className="text-sm text-muted-foreground/50 italic text-center">
            No fasting program — tap Configure to set one up
          </p>
        ) : (
          <div className="text-center italic text-muted-foreground/60 text-xs py-2">
            Eating window active. Next fast starts soon.
          </div>
        )}
      </div>

      {/* Decorative 24h dial hint in background */}
      <div className="absolute -right-4 -bottom-4 w-32 h-32 border-8 border-orange-500/5 rounded-full pointer-events-none" />
    </div>
  );
}
