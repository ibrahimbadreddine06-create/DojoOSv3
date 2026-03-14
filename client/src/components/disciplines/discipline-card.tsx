
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { type Discipline } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Trophy, History } from "lucide-react";
import { TrainingDialog } from "./training-dialog";
// import * as Icons from "lucide-react"; // Dynamically load icons if needed

interface DisciplineCardProps {
    discipline: Discipline;
}

export function DisciplineCard({ discipline }: DisciplineCardProps) {
    const [isTrainingOpen, setIsTrainingOpen] = useState(false);

    // Calculate progress percentage
    const progress = Math.min(100, Math.max(0, ((discipline.currentXp || 0) / (discipline.maxXp || 100)) * 100));

    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {discipline.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs font-normal">
                        Lvl {discipline.level}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        {/* Icon placeholder or dynamic icon */}
                        <div className={`p-3 rounded-full w-fit bg-primary/10 ${discipline.color || "text-primary"}`}>
                            <Zap className="h-6 w-6" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>XP</span>
                                <span>{discipline.currentXp} / {discipline.maxXp}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button className="w-full" onClick={() => setIsTrainingOpen(true)}>
                        <Zap className="mr-2 h-4 w-4" /> Train
                    </Button>
                    <Button variant="ghost" size="icon">
                        <History className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>

            <TrainingDialog
                discipline={discipline}
                isOpen={isTrainingOpen}
                onClose={() => setIsTrainingOpen(false)}
            />
        </>
    );
}

