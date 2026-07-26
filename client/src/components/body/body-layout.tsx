import { motion } from "framer-motion";
import { Dumbbell, Moon, Sparkles, Utensils, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { isBodyPresentationMode, setBodyPresentationMode } from "@/lib/body-presentation-data";
import { queryClient } from "@/lib/queryClient";

interface BodyLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { id: "hub", icon: Home, label: "Hub", path: "/body", activeColor: "#3b82f6" },
    { id: "activity", icon: Dumbbell, label: "Activity", path: "/body/activity", activeColor: "#ef4444" },
    { id: "nutrition", icon: Utensils, label: "Nutrition", path: "/body/nutrition", activeColor: "#f97316" },
    { id: "sleep", icon: Moon, label: "Rest", path: "/body/sleep", activeColor: "#6366f1" },
    { id: "looks", icon: Sparkles, label: "Hygiene & Looks", path: "/body/looks", activeColor: "#8b5cf6" },
];

export function BodyLayout({ children }: BodyLayoutProps) {
    const [location] = useLocation();
    const presentation = isBodyPresentationMode();

    const togglePresentation = () => {
        setBodyPresentationMode(!presentation);
        queryClient.clear();
        window.location.reload();
    };

    const activeItem = navItems.slice().reverse().find(item =>
        item.id === "hub" ? location === "/body" : location.startsWith(item.path)
    );

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
            {import.meta.env.DEV && (
                <button
                    type="button"
                    onClick={togglePresentation}
                    className="fixed right-4 top-16 z-50 rounded-full border border-black/10 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#18202a] shadow-[0_8px_24px_rgba(24,32,42,.12)] backdrop-blur-md transition-transform hover:-translate-y-0.5"
                >
                    {presentation ? "Sample data · Exit" : "Preview sample data"}
                </button>
            )}
            {presentation && (
                <div className="fixed inset-x-0 top-0 z-50 flex h-7 items-center justify-center bg-[#18202a] text-[10px] font-semibold uppercase tracking-[.12em] text-white">
                    Presentation Mode · Sample data · Nothing is saved
                </div>
            )}
            {/* Main content */}
            <main className={presentation ? "flex-1 pt-7" : "flex-1"} style={{ paddingBottom: 'calc(3.5rem + max(0.5rem, env(safe-area-inset-bottom)))' }}>
                {children}
            </main>

            {/* Bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/40"
                style={{
                    background: 'rgba(var(--background-rgb, 255,255,255), 0.97)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                <div className="flex items-center pt-1"
                    style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
                    {navItems.map((item) => {
                        const isActive = item.id === "hub"
                            ? location === "/body"
                            : location.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link key={item.id} href={item.path} className="flex-1">
                                <div className="relative flex items-center justify-center cursor-pointer w-full py-2 hover:bg-muted/30 rounded-lg transition-colors group">
                                    {/* Active indicator line — centered above icon */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navIndicator"
                                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full h-0.5 w-6 rounded-full"
                                            style={{ backgroundColor: item.activeColor }}
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <Icon
                                        className="w-5 h-5 transition-all duration-150 group-active:scale-90"
                                        style={{
                                            color: isActive ? item.activeColor : undefined,
                                            opacity: isActive ? 1 : 0.35,
                                        }}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                    />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
