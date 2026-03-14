import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Lock, Mail, Chrome, ArrowRight, Loader2, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AuthPhase = "splash" | "landing" | "register" | "login" | "success";

// Custom animation configs for that "premium app" feel
const springTransition = { type: "spring", bounce: 0, duration: 0.8 };
const staggeredContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};
const slideUpItem = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: springTransition }
};

export default function AuthPage() {
    const [phase, setPhase] = useState<AuthPhase>("splash");

    // Auth state
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Prevent hydration issues with animations
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Automatically transition from splash to landing after 2.5 seconds
        const timer = setTimeout(() => {
            if (phase === "splash") {
                setPhase("landing");
            }
        }, 2500);
        return () => clearTimeout(timer);
    }, [phase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isLogin = phase === "login";

        if (!isLogin && password !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure your passwords match.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = isLogin ? "/api/login" : "/api/register";
            const payload = isLogin ? { username, password } : { username, password, email };

            await apiRequest("POST", endpoint, payload);
            await queryClient.invalidateQueries({ queryKey: ["/api/user"] });

            setPhase("success");

            setTimeout(() => {
                setLocation("/");
            }, 2500);

        } catch (error: any) {
            toast({
                title: "Authentication failed",
                description: error.message,
                variant: "destructive",
            });
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "/api/auth/google";
    };

    if (!mounted) return null;

    return (
        <div className="dark min-h-[100dvh] w-full flex flex-col bg-black text-white overflow-hidden font-sans selection:bg-primary/30 relative">

            {/* --- IMMERSIVE BACKGROUND EFFECTS --- */}
            {/* Cinematic Noise Texture Overlay */}
            <div
                className="fixed inset-0 z-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
            {/* Dynamic Ambient Orbs */}
            <motion.div
                className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none z-0"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* --- FOREGROUND CONTENT --- */}
            <AnimatePresence mode="wait">

                {/* PHASE 1: MICRO-INTERACTION SPLASH */}
                {phase === "splash" && (
                    <motion.div
                        key="splash"
                        className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col items-center gap-8"
                        >
                            <div className="text-center space-y-3">
                                <motion.div className="flex gap-1 justify-center overflow-hidden">
                                    {/* Text reveal letter by letter */}
                                    {"DOJO".split("").map((letter, i) => (
                                        <motion.span
                                            key={i}
                                            className="text-5xl font-black tracking-tighter"
                                            initial={{ y: "100%", opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.8, delay: 0.2 + (i * 0.05), ease: [0.22, 1, 0.36, 1] }}
                                        >
                                            {letter}
                                        </motion.span>
                                    ))}
                                    <motion.span
                                        className="text-5xl font-black tracking-tighter text-primary ml-2"
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        OS
                                    </motion.span>
                                </motion.div>

                                <motion.p
                                    className="text-white/40 tracking-[0.3em] text-xs uppercase font-semibold"
                                    initial={{ opacity: 0, filter: "blur(5px)" }}
                                    animate={{ opacity: 1, filter: "blur(0px)" }}
                                    transition={{ duration: 1, delay: 1 }}
                                >
                                    Master Your Life
                                </motion.p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* PHASE 2: LANDING (ACTION SELECTION) */}
                {phase === "landing" && (
                    <motion.div
                        key="landing"
                        className="flex-1 flex flex-col justify-end p-6 pb-12 w-full max-w-sm mx-auto relative z-10"
                        variants={staggeredContainer}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div variants={slideUpItem} className="flex-1 flex flex-col items-center justify-center mb-16">
                            <h2 className="text-4xl font-bold tracking-tight text-center mb-4 leading-tight">
                                Welcome to<br />Dojo
                            </h2>
                            <p className="text-white/50 text-center text-lg max-w-[260px] leading-relaxed">
                                Your personal operating system for discipline.
                            </p>
                        </motion.div>

                        <motion.div variants={slideUpItem} className="space-y-4 w-full">
                            <Button
                                className="w-full h-14 text-base font-semibold rounded-2xl bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                                onClick={() => setPhase("register")}
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 ml-2 opacity-50" />
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full h-14 text-base font-semibold rounded-2xl bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                                onClick={() => setPhase("login")}
                            >
                                Log in
                            </Button>
                        </motion.div>
                    </motion.div>
                )}

                {/* PHASE 3 & 4: AUTH FORMS (GLASSMORPHISM) */}
                {(phase === "register" || phase === "login") && (
                    <motion.div
                        key="form"
                        className="flex-1 flex flex-col w-full max-w-md mx-auto relative z-10"
                        initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -40, filter: "blur(10px)" }}
                        transition={springTransition}
                    >
                        {/* Header Area */}
                        <div className="p-4 pt-10 flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPhase("landing")}
                                className="rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors w-12 h-12"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="px-8 pb-8 flex-1 flex flex-col">
                            <motion.div
                                className="mb-10 mt-6"
                                variants={staggeredContainer}
                                initial="hidden"
                                animate="show"
                            >
                                <motion.h2 variants={slideUpItem} className="text-4xl font-bold tracking-tight mb-3">
                                    {phase === "register" ? "Create Account" : "Access Dojo"}
                                </motion.h2>
                                <motion.p variants={slideUpItem} className="text-white/50 text-lg">
                                    {phase === "register"
                                        ? "Enter your details to begin."
                                        : "Enter your credentials."}
                                </motion.p>
                            </motion.div>

                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                                <motion.div
                                    className="space-y-4"
                                    variants={staggeredContainer}
                                    initial="hidden"
                                    animate="show"
                                >
                                    {phase === "register" && (
                                        <motion.div variants={slideUpItem} className="space-y-1">
                                            <div className="relative group">
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Email address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="px-6 h-14 rounded-2xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:bg-white/[0.06] focus:border-white/30 transition-all text-base backdrop-blur-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.01)]"
                                                    autoComplete="email"
                                                    required={phase === "register"}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <motion.div variants={slideUpItem} className="space-y-1">
                                        <div className="relative group">
                                            <Input
                                                id="username"
                                                placeholder="Username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="px-6 h-14 rounded-2xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:bg-white/[0.06] focus:border-white/30 transition-all text-base backdrop-blur-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.01)]"
                                                autoComplete="off"
                                                required
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div variants={slideUpItem} className="space-y-1">
                                        <div className="relative group">
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="px-6 h-14 rounded-2xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:bg-white/[0.06] focus:border-white/30 transition-all text-base backdrop-blur-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.01)]"
                                                required
                                            />
                                        </div>
                                    </motion.div>

                                    {phase === "register" && (
                                        <motion.div variants={slideUpItem} className="space-y-1">
                                            <div className="relative group">
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    placeholder="Confirm password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="px-6 h-14 rounded-2xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:bg-white/[0.06] focus:border-white/30 transition-all text-base backdrop-blur-sm shadow-[inset_0_0_10px_rgba(255,255,255,0.01)]"
                                                    required={phase === "register"}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>

                                <motion.div
                                    className="mt-auto space-y-4 pt-10 pb-6"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, ...springTransition }}
                                >
                                    <Button
                                        type="submit"
                                        className="w-full h-14 text-base font-bold rounded-2xl bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            phase === "login" ? "Sign In" : "Continue"
                                        )}
                                    </Button>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-4 text-white/40 font-semibold tracking-wider">Or</span></div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl bg-transparent border-white/10 hover:bg-white/5 hover:border-white/20 text-white text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        onClick={handleGoogleLogin}
                                        type="button"
                                    >
                                        <Chrome className="mr-3 h-5 w-5 opacity-70" />
                                        Continue with Google
                                    </Button>
                                </motion.div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* PHASE 5: SUCCESS / HANDOFF */}
                {phase === "success" && (
                    <motion.div
                        key="success"
                        className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <motion.div
                            className="flex flex-col items-center"
                            initial={{ scale: 0.9, filter: "blur(10px)" }}
                            animate={{ scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                        >
                            <h2 className="text-4xl font-bold tracking-tight mb-3">Verified</h2>
                            <p className="text-white/40 font-medium tracking-widest uppercase text-sm">Building Environment...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

