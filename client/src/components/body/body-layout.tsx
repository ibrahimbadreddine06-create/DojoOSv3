import { motion } from "framer-motion";
import { Dumbbell, Moon, Sparkles, Utensils, ChevronLeft, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

interface BodyLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { id: "hub", icon: Home, label: "Hub", path: "/body", color: "text-primary", activeColor: "#3b82f6" },
    { id: "workout", icon: Dumbbell, label: "Activity", path: "/body/workout", color: "text-red-500", activeColor: "#ef4444" },
    { id: "intake", icon: Utensils, label: "Nutrition", path: "/body/intake", color: "text-orange-500", activeColor: "#f97316" },
    { id: "sleep", icon: Moon, label: "Sleep", path: "/body/sleep", color: "text-indigo-500", activeColor: "#6366f1" },
    { id: "hygiene", icon: Sparkles, label: "Looks", path: "/body/hygiene", color: "text-violet-500", activeColor: "#8b5cf6" },
];

export function BodyLayout({ children }: BodyLayoutProps) {
    const [location] = useLocation();

    const activeItem = navItems.slice().reverse().find(item =>
        item.id === "hub" ? location === "/body" : location.startsWith(item.path)
    );

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Slim top bar with safe area */}
            <header className="sticky top-0 z-30 flex items-center px-4 border-b border-border bg-background/90 backdrop-blur-md shrink-0"
                style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(2.75rem + env(safe-area-inset-top))" }}>
                <Link href="/body">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" />
                        <span>DojoOS</span>
                    </button>
                </Link>
                <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm" style={{ top: "calc(50% + env(safe-area-inset-top) / 2)" }}>
                    {activeItem?.label ?? "Body"}
                </span>
            </header>

            {/* Main content with bottom padding for nav */}
            <main className="flex-1 pb-20">
                {children}
            </main>

            {/* Bottom navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border">
                <div className="flex items-end justify-around px-2 pt-1" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
                    {navItems.map((item) => {
                        const isActive = item.id === "hub"
                            ? location === "/body"
                            : location.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link key={item.id} href={item.path}>
                                <div className="relative flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer group">
                                    {/* Active indicator dot */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomNavDot"
                                            className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                            style={{ backgroundColor: item.activeColor }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-5 h-5 transition-all duration-200 ${isActive ? item.color : "text-muted-foreground group-hover:text-foreground"}`}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                    />
                                    <span
                                        className={`text-[10px] font-medium transition-all duration-200 ${isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-muted-foreground"}`}
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
