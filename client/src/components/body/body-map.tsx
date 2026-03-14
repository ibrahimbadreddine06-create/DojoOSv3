import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCw, Activity, Zap, Info, X } from "lucide-react";
import { ANTERIOR_MUSCLES, POSTERIOR_MUSCLES, type MuscleId } from "./body-map-data";
import { useQuery } from "@tanstack/react-query";
import { MuscleStat } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface BodyMapProps {
    showControls?: boolean;
    className?: string;
    onMuscleSelect?: (muscleId: MuscleId | null) => void;
}

export function BodyMap({ showControls = true, className = "", onMuscleSelect }: BodyMapProps) {
    const [view, setView] = useState<"anterior" | "posterior">("anterior");
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleId | null>(null);
    const [hoveredMuscle, setHoveredMuscle] = useState<MuscleId | null>(null);

    const { data: stats } = useQuery<MuscleStat[]>({
        queryKey: ["/api/muscle-stats"],
    });

    const getMuscleColor = (id: string, isSelected: boolean, isHovered: boolean) => {
        if (isSelected) return "rgba(34,197,94,0.6)";
        if (isHovered) return "rgba(180,180,180,0.3)";

        const stat = stats?.find(s => s.muscleId === id);
        if (stat && stat.recoveryScore !== null) {
            const score = stat.recoveryScore || 100;
            if (score < 40) return "rgba(239,68,68,0.4)"; // Red
            if (score < 80) return "rgba(234,179,8,0.3)"; // Yellow
        }
        return "transparent";
    };

    const getRecovery = (id: string) => {
        return stats?.find(s => s.muscleId === id)?.recoveryScore || 100;
    };

    const muscles = view === "anterior" ? ANTERIOR_MUSCLES : POSTERIOR_MUSCLES;
    const activeMuscleId = selectedMuscle || hoveredMuscle;
    const activeMuscle = ANTERIOR_MUSCLES.find(m => m.id === activeMuscleId) || POSTERIOR_MUSCLES.find(m => m.id === activeMuscleId);

    const toggleView = () => {
        setView(v => v === "anterior" ? "posterior" : "anterior");
        setSelectedMuscle(null);
        if (onMuscleSelect) onMuscleSelect(null);
    };

    const handleMuscleClick = (muscleId: MuscleId) => {
        if (onMuscleSelect) {
            // External control mode: just notify parent
            if (selectedMuscle === muscleId) {
                setSelectedMuscle(null);
                onMuscleSelect(null);
            } else {
                setSelectedMuscle(muscleId);
                onMuscleSelect(muscleId);
            }
        } else {
            // Default dialog mode
            setSelectedMuscle(muscleId);
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            {/* 3D-Like Body Visualization Container */}
            <div className="relative w-full aspect-[1/2] rounded-3xl backdrop-blur-sm flex items-center justify-center overflow-hidden">

                {/* View Toggle Button */}
                {showControls && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 z-10 bg-background/50 backdrop-blur-md border border-primary/20 hover:border-primary/50 text-xs h-7 px-2"
                        onClick={(e) => { e.stopPropagation(); toggleView(); }}
                    >
                        <RotateCw className="w-3 h-3 mr-1 text-primary" />
                        {view === "anterior" ? "Front" : "Back"}
                    </Button>
                )}

                {/* SVG Map - Pure Code Implementation */}
                <svg
                    viewBox="0 0 100 220"
                    className="w-full h-full filter cursor-pointer"
                    style={{ filter: "drop-shadow(0 0 10px rgba(34,197,94,0.1))" }}
                    onClick={() => {
                        setSelectedMuscle(null);
                        if (onMuscleSelect) onMuscleSelect(null);
                    }}
                >
                    <defs>
                        <linearGradient id="body-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(34,197,94,0.1)" />
                            <stop offset="50%" stopColor="rgba(34,197,94,0.05)" />
                            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                        </linearGradient>
                        <filter id="hologram-glow">
                            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <AnimatePresence mode="wait">
                        <motion.g
                            key={view}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* BASE LAYER - Render ALL muscles faintly to create the "Full Body" silhouette */}
                            {muscles.map((muscle) => (
                                <g key={`base-${muscle.id}`} className="pointer-events-none">
                                    {muscle.points.map((p, i) => (
                                        <polygon
                                            key={`base-poly-${muscle.id}-${i}`}
                                            points={p}
                                            fill="url(#body-gradient)"
                                            stroke="rgba(34,197,94,0.15)"
                                            strokeWidth="0.5"
                                        />
                                    ))}
                                </g>
                            ))}

                            {/* INTERACTIVE LAYER */}
                            {muscles.map((muscle) => (
                                <g
                                    key={muscle.id}
                                    className="group/muscle"
                                    onMouseEnter={() => setHoveredMuscle(muscle.id)}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    onClick={(e) => { e.stopPropagation(); handleMuscleClick(muscle.id); }}
                                >
                                    {muscle.points.map((p, i) => (
                                        <motion.polygon
                                            key={`${muscle.id}-${i}`}
                                            points={p}
                                            initial={false}
                                            animate={{
                                                fill: getMuscleColor(muscle.id, selectedMuscle === muscle.id, hoveredMuscle === muscle.id),
                                                stroke: selectedMuscle === muscle.id
                                                    ? "#22c55e"
                                                    : hoveredMuscle === muscle.id
                                                        ? "rgba(255,255,255,0.8)"
                                                        : "transparent",
                                                strokeWidth: hoveredMuscle === muscle.id || selectedMuscle === muscle.id ? 1 : 0
                                            }}
                                            transition={{ duration: 0.2 }}
                                            className="cursor-pointer"
                                            style={{ filter: selectedMuscle === muscle.id ? "url(#hologram-glow)" : "none" }}
                                        />
                                    ))}
                                </g>
                            ))}
                        </motion.g>
                    </AnimatePresence>
                </svg>
            </div>

            {/* Default Detail Dialog (only if control not passed to parent) */}
            {!onMuscleSelect && (
                <Dialog open={!!selectedMuscle} onOpenChange={(open) => !open && setSelectedMuscle(null)}>
                    <DialogContent className="sm:max-w-[500px] border-primary/20 bg-background/95 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-primary">
                                <Activity className="w-6 h-6" />
                                {activeMuscle?.name} Analysis
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 pt-4">
                            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-6 rounded-2xl relative overflow-hidden group">
                                <Zap className="absolute -top-4 -right-4 w-24 h-24 text-primary opacity-5 group-hover:opacity-10 transition-opacity" />

                                <div className="relative z-10 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono uppercase text-muted-foreground">Recovery</p>
                                            <p className={cn("text-3xl font-bold tracking-tighter", getRecovery(activeMuscle?.id || "") < 50 ? "text-red-500" : "text-green-400")}>
                                                {getRecovery(activeMuscle?.id || "")}%
                                            </p>
                                            <div className="w-full h-1.5 bg-accent/20 rounded-full mt-2 overflow-hidden">
                                                <motion.div
                                                    className={cn("h-full rounded-full shadow-[0_0_12px]", getRecovery(activeMuscle?.id || "") < 50 ? "bg-red-500 shadow-red-500" : "bg-primary shadow-[#22c55e]")}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${getRecovery(activeMuscle?.id || "")}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono uppercase text-muted-foreground">Volume</p>
                                            <p className="text-3xl font-bold tracking-tighter">
                                                {stats?.find(s => s.muscleId === activeMuscle?.id)?.volumeAccumulated || 0}
                                                <span className="text-sm font-normal opacity-50"> KG</span>
                                            </p>
                                            <p className="text-[10px] font-mono text-green-500 mt-2">Accumulated</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-primary/10 grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-xl bg-background/50 border border-primary/10">
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Last Activity</p>
                                            <p className="text-sm font-bold">Chest Day A</p>
                                            <p className="text-[10px] opacity-60">24.01.2024</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-background/50 border border-primary/10">
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Target State</p>
                                            <p className="text-sm font-bold text-orange-400">Hypertrophy</p>
                                            <p className="text-[10px] opacity-60">Phase 2/4</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

