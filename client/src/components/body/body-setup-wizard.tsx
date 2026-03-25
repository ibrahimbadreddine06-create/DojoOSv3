import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Activity, Utensils, Moon, Sparkles, Check, Smartphone, Flame, Droplets, HeartPulse, Link2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 6;

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

const FASTING_PROGRAMS = [
    { id: "none", label: "No Fasting", desc: "Standard eating window" },
    { id: "14:10", label: "14:10", desc: "14h fast, 10h eating window" },
    { id: "16:8", label: "16:8", desc: "16h fast, 8h eating window" },
    { id: "omad", label: "OMAD", desc: "One Meal A Day" },
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
    sleepGoalHours: string;
    fastingProgram: string;
    appleHealthConnected: boolean;
    appleWebhookUrl?: string;
    googleFitConnected: boolean;
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
        sleepGoalHours: "8",
        fastingProgram: "16:8",
        appleHealthConnected: false,
        googleFitConnected: false,
    });

    // Check URL for Google Fit success
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("success") === "google_fit_connected") {
            setData(prev => ({ ...prev, googleFitConnected: true }));
            toast({ title: "Google Fit Connected Successfully" });
            
            // Clean URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        } else if (searchParams.get("error")) {
            toast({ title: "Integration Failed", variant: "destructive" });
        }
    }, [toast]);

    const generateAppleWebhook = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/health-sync/apple-webhook/generate-token");
            return res.json();
        },
        onSuccess: (data) => {
            updateData("appleWebhookUrl", data.webhookUrl);
            updateData("appleHealthConnected", true);
        }
    });

    const updateData = (field: keyof SetupData, value: any) =>
        setData(prev => ({ ...prev, [field]: value }));

    // Derived logic for display
    const currentWeight = parseFloat(data.weightKg) || 70;
    const currentHeight = parseFloat(data.heightCm) || 175;
    const currentAge = parseFloat(data.age) || 25;
    
    const calculatedTDEE = estimateTDEE(currentWeight, currentHeight, currentAge, data.sex, data.activityLevel);
    const calGoal = data.bodyGoal === "lose_weight" ? calculatedTDEE - 400 : data.bodyGoal === "build_muscle" ? calculatedTDEE + 300 : calculatedTDEE;
    const proteinGoal = Math.round(currentWeight * 1.8);
    const carbsGoal = Math.round((calGoal * 0.45) / 4);
    const fatsGoal = Math.round((calGoal * 0.25) / 9);
    const waterGoal = Math.round(currentWeight * 35); // roughly 35ml per kg

    const saveMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/body-profile", {
                heightCm: currentHeight,
                weightKg: currentWeight,
                age: currentAge,
                sex: data.sex,
                activityLevel: data.activityLevel,
                bodyGoal: data.bodyGoal,
                dailyCalorieGoal: calGoal,
                dailyProteinGoal: proteinGoal,
                dailyCarbsGoal: carbsGoal,
                dailyFatsGoal: fatsGoal,
                waterGoal: waterGoal,
                sleepGoalHours: data.sleepGoalHours || "8",
                fastingProgram: data.fastingProgram === "none" ? null : {
                    preset: data.fastingProgram,
                    fastingHours: data.fastingProgram === "14:10" ? 14 : data.fastingProgram === "16:8" ? 16 : 23,
                    eatingWindowStart: "12:00",
                    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/body-profile"] });
            toast({ title: "Body configuration saved!" });
            setStep(TOTAL_STEPS); // show finish screen
        },
        onError: () => toast({ title: "Failed to save configuration", variant: "destructive" }),
    });

    const next = () => {
        if (step === TOTAL_STEPS - 1) saveMutation.mutate();
        else setStep(s => Math.min(s + 1, TOTAL_STEPS));
    };
    const back = () => setStep(s => Math.max(s - 1, 0));

    const canNext = () => {
        if (step === 2) return !!(data.heightCm && data.weightKg && data.age);
        return true;
    };

    return (
        <div className="min-h-[100dvh] bg-background flex flex-col font-sans">
            {/* Header Progress */}
            <div className="sticky top-0 z-20 flex items-center px-4 h-14 bg-background/90 backdrop-blur-md">
                {step > 0 && step < TOTAL_STEPS && (
                    <button onClick={back} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="mx-auto flex items-center gap-1.5 flex-1 justify-center px-4">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i <= step ? "w-8 bg-foreground" : "w-2 bg-muted")} />
                    ))}
                </div>
                <button onClick={() => setLocation("/body")} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-full hover:bg-muted/50">
                    Skip
                </button>
            </div>

            <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex-1 flex flex-col"
                    >
                        {/* Step 0: Welcome */}
                        {step === 0 && (
                            <div className="flex-1 flex flex-col justify-center gap-8">
                                <div>
                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <h1 className="text-4xl font-black tracking-tight leading-none mb-3">Configure<br/>Body Engine</h1>
                                    <p className="text-muted-foreground text-base leading-relaxed">
                                        Let's set up your core metrics to automatically generate precise targets for your daily physical optimization.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { icon: <Smartphone className="w-4 h-4 text-blue-500" />, text: "Sync real-time health data" },
                                        { icon: <Flame className="w-4 h-4 text-orange-500" />, text: "Compute tailored biometric goals" },
                                        { icon: <Moon className="w-4 h-4 text-indigo-500" />, text: "Automate recovery targets" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-muted/40 border border-border/50 rounded-2xl px-4 py-3.5">
                                            {item.icon}
                                            <span className="text-sm font-semibold">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Health Connections */}
                        {step === 1 && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase mb-1 block">Data Sources</span>
                                    <h2 className="text-3xl font-black tracking-tight">Sync Health</h2>
                                    <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                                        To calculate accurate recovery scores and track passive activity like steps and sleep stages, connect a health data source.
                                    </p>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {/* Google Fit Card */}
                                    <div className={cn("border rounded-2xl p-5 transition-all text-left", data.googleFitConnected ? "border-emerald-500/50 bg-emerald-500/5" : "border-border bg-card")}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-green-500 flex items-center justify-center">
                                                    <Activity className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">Google Fit</p>
                                                    <p className="text-xs text-muted-foreground">Steps, Sleep, Calories</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant={data.googleFitConnected ? "outline" : "default"} 
                                                className={cn("rounded-xl h-9 px-4 text-xs font-bold", data.googleFitConnected && "text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 cursor-default")}
                                                onClick={() => {
                                                    if (!data.googleFitConnected) {
                                                        window.location.href = "/api/health-sync/google-fit/auth";
                                                    }
                                                }}
                                            >
                                                {data.googleFitConnected ? "Connected" : "Connect"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Apple Health Card */}
                                    <div className={cn("border rounded-2xl p-5 transition-all text-left", data.appleHealthConnected ? "border-emerald-500/50 bg-emerald-500/5" : "border-border bg-card")}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                                                    <HeartPulse className="w-5 h-5 text-white dark:text-black" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">Apple Health</p>
                                                    <p className="text-xs text-muted-foreground">Steps, HRV, Sleep</p>
                                                </div>
                                            </div>
                                            {!data.appleWebhookUrl && (
                                                <Button 
                                                    variant="outline"
                                                    className="rounded-xl h-9 px-4 text-xs font-bold"
                                                    disabled={generateAppleWebhook.isPending}
                                                    onClick={() => generateAppleWebhook.mutate()}
                                                >
                                                    Setup Sync
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <AnimatePresence>
                                            {data.appleWebhookUrl && (
                                                <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}} className="space-y-3 overflow-hidden">
                                                    <div className="bg-emerald-500/10 p-3 rounded-lg flex items-start gap-3">
                                                        <Link2 className="w-5 h-5 text-emerald-600 mt-0.5" /> 
                                                        <div>
                                                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Webhook Generated</p>
                                                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">To bridge iOS to DojoOS, create an Apple Shortcut that POSTs your Health data to this secure URL daily:</p>
                                                            
                                                            <div className="mt-2 flex items-center gap-2 bg-background/50 border border-emerald-500/30 rounded p-2">
                                                                <code className="text-[10px] break-all text-emerald-700 dark:text-emerald-400/90 whitespace-pre-wrap flex-1">{data.appleWebhookUrl}</code>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                                                                    navigator.clipboard.writeText(data.appleWebhookUrl!);
                                                                    toast({ title: "Copied Webhook URL" });
                                                                }}>
                                                                    <Copy className="w-3 h-3 text-emerald-600" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal Stats */}
                        {step === 2 && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase mb-1 block">Biometrics</span>
                                    <h2 className="text-3xl font-black tracking-tight">Your Stats</h2>
                                    <p className="text-muted-foreground text-sm mt-2">These physical markers form the foundation of your caloric and metabolic algorithms.</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="col-span-1">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">Height (cm)</label>
                                        <Input type="number" inputMode="decimal" placeholder="178"
                                            value={data.heightCm} onChange={e => updateData("heightCm", e.target.value)}
                                            className="rounded-2xl h-14 text-xl font-bold font-mono text-center bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus:bg-background transition-colors" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">Weight (kg)</label>
                                        <Input type="number" inputMode="decimal" placeholder="75"
                                            value={data.weightKg} onChange={e => updateData("weightKg", e.target.value)}
                                            className="rounded-2xl h-14 text-xl font-bold font-mono text-center bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus:bg-background transition-colors" />
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">Age (Years)</label>
                                        <Input type="number" inputMode="numeric" placeholder="25"
                                            value={data.age} onChange={e => updateData("age", e.target.value)}
                                            className="rounded-2xl h-14 text-xl font-bold font-mono text-center bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus:bg-background transition-colors" />
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block ml-1">Biological Sex</label>
                                    <div className="grid grid-cols-2 gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                                        {["male", "female"].map(s => (
                                            <button key={s} onClick={() => updateData("sex", s)}
                                                className={cn("py-3 rounded-xl text-sm font-bold capitalize transition-all",
                                                    data.sex === s ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50")}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2 ml-1">Required specifically for hormonal and metabolic BMR baseline calculations.</p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Primary Goal & Activity */}
                        {step === 3 && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase mb-1 block">Output Targets</span>
                                    <h2 className="text-3xl font-black tracking-tight">Nutrition Directive</h2>
                                    <p className="text-muted-foreground text-sm mt-2">Set your daily activity modifier and primary objective to generate your intake goals.</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Weekly Activity Level</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ACTIVITY_LEVELS.map(a => (
                                                <button key={a.id} onClick={() => updateData("activityLevel", a.id)}
                                                    className={cn("p-3 rounded-xl border text-left transition-all",
                                                        data.activityLevel === a.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/30")}>
                                                    <p className="font-bold text-xs">{a.label}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{a.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Body Transformation Goal</label>
                                        <div className="space-y-2">
                                            {GOALS.map(g => (
                                                <button key={g.id} onClick={() => updateData("bodyGoal", g.id)}
                                                    className={cn("w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                                                        data.bodyGoal === g.id ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20" : "border-border bg-card hover:border-orange-500/30")}>
                                                    <span className="text-2xl">{g.emoji}</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm text-foreground">{g.label}</p>
                                                    </div>
                                                    {data.bodyGoal === g.id && <Check className="w-5 h-5 text-orange-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Goal Creation Feedback */}
                                {data.heightCm && data.weightKg && (
                                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-auto bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-4 items-center">
                                        <div className="bg-orange-500/20 p-2.5 rounded-full shrink-0">
                                            <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-0.5 uppercase tracking-wide">Goal Generated</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                Targeting <span className="font-black font-mono">{calGoal}</span> kcal with <span className="font-black font-mono">{proteinGoal}g</span> protein daily.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Rest & Fasting Goals */}
                        {step === 4 && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase mb-1 block">Recovery protocols</span>
                                    <h2 className="text-3xl font-black tracking-tight">Rest & Fasting</h2>
                                    <p className="text-muted-foreground text-sm mt-2">Establish baselines for cellular recovery and sleep cycles.</p>
                                </div>

                                <div className="space-y-6 mt-2">
                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Sleep Duration Goal</label>
                                            <span className="font-mono font-black text-xl text-indigo-500">{data.sleepGoalHours} <span className="text-sm font-semibold text-muted-foreground">hrs</span></span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="4" max="12" step="0.5"
                                            value={data.sleepGoalHours}
                                            onChange={(e) => updateData("sleepGoalHours", e.target.value)}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1 font-semibold">
                                            <span>4h</span>
                                            <span>Recommended: 7.5 – 8.5h</span>
                                            <span>12h</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block ml-1">Intermittent Fasting Program</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {FASTING_PROGRAMS.map(f => (
                                                <button key={f.id} onClick={() => updateData("fastingProgram", f.id)}
                                                    className={cn("p-3 rounded-xl border text-left transition-all",
                                                        data.fastingProgram === f.id ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20" : "border-border bg-card hover:border-indigo-500/30")}>
                                                    <p className="font-bold text-sm text-foreground">{f.label}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Goal Creation Feedback */}
                                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-auto bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex gap-4 items-center">
                                    <div className="bg-indigo-500/20 p-2.5 rounded-full shrink-0">
                                        <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-0.5 uppercase tracking-wide">Protocol Set</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            Aiming for <span className="font-black font-mono">{data.sleepGoalHours}h</span> of sleep. 
                                            {data.fastingProgram !== "none" && <span> {data.fastingProgram} fasting enabled.</span>}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Finish screen */}
                        {step === TOTAL_STEPS && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
                                <motion.div initial={{scale: 0.5, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{type: "spring", stiffness: 200, damping: 15}}>
                                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Check className="w-12 h-12" />
                                    </div>
                                </motion.div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">System Initialized</h2>
                                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-[260px] mx-auto">
                                        Your core engine parameters have been established. Dashboards will now reflect personalized targets.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full mt-4 text-left">
                                    <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Nutrition Target</p>
                                        <p className="font-mono font-black text-lg">{calGoal} <span className="text-xs text-muted-foreground font-sans font-medium">kcal</span></p>
                                    </div>
                                    <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Water Target</p>
                                        <p className="font-mono font-black text-lg">{waterGoal} <span className="text-xs text-muted-foreground font-sans font-medium">ml</span></p>
                                    </div>
                                </div>
                                
                                <Button onClick={() => setLocation("/body")} size="lg" className="w-full mt-6 rounded-2xl h-14 font-black text-base shadow-lg shadow-primary/20">
                                    Launch Body Engine
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Bottom CTA */}
                {step < TOTAL_STEPS && (
                    <div className="pt-8 pb-4 bg-background z-10 sticky bottom-0 border-t border-transparent">
                        <Button
                            onClick={next}
                            disabled={!canNext() || saveMutation.isPending}
                            className="w-full h-14 rounded-2xl font-black text-base shadow-sm ring-1 ring-black/5 dark:ring-white/5 active:scale-[0.98] transition-all"
                            size="lg"
                        >
                            {step === TOTAL_STEPS - 1
                                ? saveMutation.isPending ? "Generating Plans..." : "Finalize & Generate Goals"
                                : step === 0 ? "Initialize Setup"
                                    : "Continue"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
