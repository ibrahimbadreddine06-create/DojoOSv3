import { motion } from "framer-motion";
import { Dumbbell, Moon, Sparkles, Utensils, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

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

    const activeItem = navItems.slice().reverse().find(item =>
        item.id === "hub" ? location === "/body" : location.startsWith(item.path)
    );

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Safe area top spacer */}
            <div className="shrink-0" style={{ height: 'env(safe-area-inset-top)' }} />

            {/* Main content */}
            <main className="flex-1" style={{ paddingBottom: 'calc(4rem + max(0.5rem, env(safe-area-inset-bottom)))' }}>
                {children}
            </main>

            {/* Bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/40"
                style={{
                    background: 'rgba(var(--background-rgb, 255,255,255), 0.97)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                <div className="flex items-end justify-around px-1 pt-2"
                    style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
                    {navItems.map((item) => {
                        const isActive = item.id === "hub"
                            ? location === "/body"
                            : location.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link key={item.id} href={item.path}>
                                <div className="relative flex flex-col items-center gap-1 px-3 py-1 cursor-pointer min-w-[48px]">
                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navIndicator"
                                            className="absolute -top-2 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full"
                                            style={{ backgroundColor: item.activeColor }}
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <Icon
                                        className="w-5 h-5 transition-all duration-150"
                                        style={{
                                            color: isActive ? item.activeColor : undefined,
                                            opacity: isActive ? 1 : 0.35,
                                        }}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                    />
                                    <span
                                        className="text-[9px] font-bold transition-all duration-150 uppercase tracking-wide"
                                        style={{
                                            color: isActive ? item.activeColor : undefined,
                                            opacity: isActive ? 1 : 0.35,
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
