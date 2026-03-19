import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Activity, Utensils, Moon, Sparkles, Check, Target, Scale, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 4;

const GOALS = [
    { id: "lose_weight", label: "Lose Weight", emoji: "🔥", desc: "Calorie deficit + cardio focus" },
    { id: "build_muscle", label: "Build Muscle", emoji: "💪", desc: "Surplus + strength training" },
    { id: "maintain", label: "Stay Fit", emoji: "⚖️", desc: "Maintenance calories + variety" },
    { id: "improve_endurance", label: "Endurance", emoji: "🏃", desc: "Cardio & stamina" },
];

const ACTIVITY_LEVELS = [
    { id: "sedentary", label: "Sedentary", desc: "Desk job, little exercise" },
    { id: "light", label: "Lightly Active", desc: "Light exercise 1–3 days/week" },
    { id: "moderate", label: "Moderately Active", desc: "Exercise 3–5 days/week" },
    { id: "active", label: "Very Active", desc: "Hard exercise 6–7 days/week" },
];

// TDEE estimation (Mifflin-St Jeor)
function estimateTDEE(weight: number, height: number, age: number, sex: string, activity: string): number {
    const bmr = sex === "female"
        ? 10 * weight + 6.25 * height - 5 * age - 161
        : 10 * weight + 6.25 * height - 5 * age + 5;
    const multipliers: Record<string, number> = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725,
    };
    return Math.round(bmr * (multipliers[activity] || 1.55));
}

interface SetupData {
    heightCm: string;
    weightKg: string;
    age: string;
    sex: string;
    bodyGoal: string;
    activityLevel: string;
    dailyCalorieGoal: string;
    dailyProteinGoal: string;
    dailyCarbsGoal: string;
    dailyFatsGoal: string;
    sleepGoalHours: string;
}

export function BodySetupWizard() {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<SetupData>({
        heightCm: "",
        weightKg: "",
        age: "",
        sex: "male",
        bodyGoal: "lose_weight",
        activityLevel: "moderate",
        dailyCalorieGoal: "",
        dailyProteinGoal: "",
        dailyCarbsGoal: "",
        dailyFatsGoal: "",
        sleepGoalHours: "8",
    });

    const updateData = (field: keyof SetupData, value: string) =>
        setData(prev => ({ ...prev, [field]: value }));

    const saveMutation = useMutation({
        mutationFn: async () => {
            const tdee = estimateTDEE(
                parseFloat(data.weightKg) || 70,
                parseFloat(data.heightCm) || 175,
                parseFloat(data.age) || 25,
                data.sex,
                data.activityLevel
            );
            const calGoal = parseInt(data.dailyCalorieGoal) || (data.bodyGoal === "lose_weight" ? tdee - 400 : data.bodyGoal === "build_muscle" ? tdee + 300 : tdee);
            const proteinGoal = parseInt(data.dailyProteinGoal) || Math.round((parseFloat(data.weightKg) || 70) * 1.8);
            const carbsGoal = parseInt(data.dailyCarbsGoal) || Math.round((calGoal * 0.45) / 4);
            const fatsGoal = parseInt(data.dailyFatsGoal) || Math.round((calGoal * 0.25) / 9);

            await apiRequest("PATCH", "/api/body-profile", {
                heightCm: data.heightCm ? parseFloat(data.heightCm) : undefined,
                weightKg: data.weightKg ? parseFloat(data.weightKg) : undefined,
                age: data.age ? parseInt(data.age) : undefined,
                sex: data.sex,
                activityLevel: data.activityLevel,
                bodyGoal: data.bodyGoal,
                dailyCalorieGoal: calGoal,
                dailyProteinGoal: proteinGoal,
                dailyCarbsGoal: carbsGoal,
                dailyFatsGoal: fatsGoal,
                sleepGoalHours: data.sleepGoalHours || "8",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/body-profile"] });
            toast({ title: "Body profile set up!" });
            setStep(TOTAL_STEPS); // show finish screen
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });

    const next = () => {
        if (step === TOTAL_STEPS - 1) saveMutation.mutate();
        else setStep(s => Math.min(s + 1, TOTAL_STEPS));
    };
    const back = () => setStep(s => Math.max(s - 1, 0));

    const canNext = () => {
        if (step === 1) return !!(data.heightCm && data.weightKg && data.age);
        return true;
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center px-4 h-12 border-b border-border bg-background/90 backdrop-blur-md">
                {step > 0 && step < TOTAL_STEPS && (
                    <button onClick={back} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="mx-auto flex items-center gap-1.5">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div key={i} className={cn("h-1.5 rounded-full transition-all", i <= step ? "w-6 bg-primary" : "w-1.5 bg-muted")} />
                    ))}
                </div>
                <button onClick={() => setLocation("/body")} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto">
                    Skip
                </button>
            </div>

            <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col"
                    >
                        {/* Step 0: Welcome */}
                        {step === 0 && (
                            <div className="flex-1 flex flex-col justify-center gap-6">
                                <div>
                                    <div className="text-5xl mb-4">💪</div>
                                    <h1 className="text-3xl font-black tracking-tight">Set up Body</h1>
                                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                        Get personalised calorie targets, macro goals, sleep recommendations, and body analytics — all in one place.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { icon: <Activity className="w-4 h-4 text-red-500" />, text: "Activity tracking & workout analytics" },
                                        { icon: <Utensils className="w-4 h-4 text-orange-500" />, text: "Personalised calorie & macro goals" },
                                        { icon: <Moon className="w-4 h-4 text-indigo-500" />, text: "Sleep quality & readiness scoring" },
                                        { icon: <Sparkles className="w-4 h-4 text-violet-500" />, text: "Self-care & hygiene routine tracking" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-2xl px-4 py-3">
                                            {item.icon}
                                            <span className="text-sm font-medium">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground text-center">Takes about 2–3 minutes</p>
                            </div>
                        )}

                        {/* Step 1: Personal stats */}
                        {step === 1 && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Your Stats</h2>
                                    <p className="text-muted-foreground text-sm mt-1">Used to calculate your energy needs</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Height (cm)</label>
                                        <Input type="number" inputMode="decimal" placeholder="e.g. 178"
                                            value={data.heightCm} onChange={e => updateData("heightCm", e.target.value)}
                                            className="rounded-2xl h-12 text-base font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Weight (kg)</label>
                                        <Input type="number" inputMode="decimal" placeholder="e.g. 75"
                                            value={data.weightKg} onChange={e => updateData("weightKg", e.target.value)}
                                            className="rounded-2xl h-12 text-base font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Age</label>
                                        <Input type="number" inputMode="numeric" placeholder="e.g. 24"
                                            value={data.age} onChange={e => updateData("age", e.target.value)}
                                            className="rounded-2xl h-12 text-base font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Sex</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {["male", "female"].map(s => (
                                                <button key={s} onClick={() => updateData("sex", s)}
                                                    className={cn("py-3 rounded-2xl text-sm font-semibold capitalize border transition-all",
                                                        data.sex === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Goal */}
                        {step === 2 && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Your Goal</h2>
                                    <p className="text-muted-foreground text-sm mt-1">This shapes your calorie & macro targets</p>
                                </div>
                                <div className="space-y-2">
                                    {GOALS.map(g => (
                                        <button key={g.id} onClick={() => updateData("bodyGoal", g.id)}
                                            className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                                                data.bodyGoal === g.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                                            <span className="text-2xl">{g.emoji}</span>
                                            <div>
                                                <p className="font-bold text-sm">{g.label}</p>
                                                <p className="text-xs text-muted-foreground">{g.desc}</p>
                                            </div>
                                            {data.bodyGoal === g.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Activity level */}
                        {step === 3 && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Activity Level</h2>
                                    <p className="text-muted-foreground text-sm mt-1">How active are you on a typical week?</p>
                                </div>
                                <div className="space-y-2">
                                    {ACTIVITY_LEVELS.map(a => (
                                        <button key={a.id} onClick={() => updateData("activityLevel", a.id)}
                                            className={cn("w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all",
                                                data.activityLevel === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                                            <div>
                                                <p className="font-bold text-sm">{a.label}</p>
                                                <p className="text-xs text-muted-foreground">{a.desc}</p>
                                            </div>
                                            {data.activityLevel === a.id && <Check className="w-4 h-4 text-primary" />}
                                        </button>
                                    ))}
                                </div>

                                {/* Estimated goals preview */}
                                {data.heightCm && data.weightKg && data.age && (
                                    <div className="bg-muted/40 rounded-2xl p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Estimated Daily Targets</p>
                                        {(() => {
                                            const tdee = estimateTDEE(
                                                parseFloat(data.weightKg), parseFloat(data.heightCm),
                                                parseFloat(data.age), data.sex, data.activityLevel
                                            );
                                            const cal = data.bodyGoal === "lose_weight" ? tdee - 400
                                                : data.bodyGoal === "build_muscle" ? tdee + 300 : tdee;
                                            const protein = Math.round(parseFloat(data.weightKg) * 1.8);
                                            return (
                                                <div className="flex gap-4">
                                                    <div>
                                                        <p className="font-mono font-black text-xl">{cal}</p>
                                                        <p className="text-[10px] text-muted-foreground">kcal / day</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-mono font-black text-xl">{protein}g</p>
                                                        <p className="text-[10px] text-muted-foreground">protein / day</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        <p className="text-[10px] text-muted-foreground mt-2">You can adjust these later in settings</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Finish screen */}
                        {step === TOTAL_STEPS && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
                                <div className="text-6xl">🎉</div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">You're all set!</h2>
                                    <p className="text-muted-foreground mt-2 text-sm">Your Body module is configured with personalised goals.</p>
                                </div>
                                <Button onClick={() => setLocation("/body")} className="w-full max-w-xs rounded-2xl h-12 font-bold">
                                    Go to Body Dashboard
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Bottom CTA */}
                {step < TOTAL_STEPS && (
                    <div className="pt-6">
                        <Button
                            onClick={next}
                            disabled={!canNext() || saveMutation.isPending}
                            className="w-full h-12 rounded-2xl font-bold text-base"
                        >
                            {step === TOTAL_STEPS - 1
                                ? saveMutation.isPending ? "Saving…" : "Finish Setup"
                                : step === 0 ? "Get Started"
                                    : "Continue"}
                            {step > 0 && step < TOTAL_STEPS - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
