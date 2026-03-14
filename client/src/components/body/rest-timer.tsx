import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, X, Plus, Minus, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RestTimerProps {
    initialSeconds?: number;
    onComplete?: () => void;
    autoStart?: boolean;
}

export function RestTimer({ initialSeconds = 90, onComplete, autoStart = false }: RestTimerProps) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(autoStart);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((s) => {
                    if (s <= 1) {
                        setIsActive(false);
                        onComplete?.();
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, onComplete]);

    const toggleTimer = () => setIsActive(!isActive);
    const addTime = (amount: number) => setSeconds((s) => s + amount);
    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const progress = Math.max(0, Math.min(100, (seconds / initialSeconds) * 100));

    if (seconds === 0 && !isActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
            >
                {isMinimized ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full h-12 w-12 p-0 border-primary/20 bg-background/80 backdrop-blur-md shadow-lg"
                        onClick={() => setIsMinimized(false)}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold font-mono">{formatTime(seconds)}</span>
                            <Progress value={progress} className="h-1 w-8 mt-1" />
                        </div>
                    </Button>
                ) : (
                    <div className="w-64 bg-background/90 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-xl p-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-sm font-bold uppercase tracking-tight">Rest Timer</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSeconds(0)}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="py-4 flex flex-col items-center">
                            <h2 className="text-4xl font-black font-mono tabular-nums tracking-tighter">
                                {formatTime(seconds)}
                            </h2>
                            <Progress value={progress} className="h-2 w-full mt-4" />
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => addTime(-10)}>-10s</Button>
                            <Button size="sm" variant={isActive ? "secondary" : "default"} onClick={toggleTimer}>
                                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => addTime(10)}>+10s</Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

