import { motion } from "framer-motion";
import { Dumbbell, Moon, Sparkles, Utensils, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface BodyLayoutProps {
    children: React.ReactNode;
}

export function BodyLayout({ children }: BodyLayoutProps) {
    const [location] = useLocation();

    const navItems = [
        { id: "workout", icon: Dumbbell, label: "Workout", path: "/body/workout", color: "text-red-500" },
        { id: "intake", icon: Utensils, label: "Intake", path: "/body/intake", color: "text-blue-500" },
        { id: "sleep", icon: Moon, label: "Sleep", path: "/body/sleep", color: "text-indigo-500" },
        { id: "hygiene", icon: Sparkles, label: "Looks", path: "/body/hygiene", color: "text-purple-500" }, // hygiene mapped to looks
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Minimized Sidebar */}
            <div className="w-20 border-r flex flex-col items-center py-8 gap-8 bg-card/30 backdrop-blur-md fixed h-full z-10">
                <Link href="/body">
                    <Button variant="ghost" size="icon" className="mb-4 hover:bg-primary/10">
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                </Link>

                {navItems.map((item) => {
                    const isActive = location.includes(item.path);
                    const Icon = item.icon;

                    return (
                        <Link key={item.id} href={item.path}>
                            <div className={`
                        relative group flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-300
                        ${isActive ? `bg-accent ${item.color}` : "text-muted-foreground hover:bg-accent/50"}
                    `}>
                                <Icon className="w-6 h-6" />
                                {isActive && (
                                    <motion.div
                                        layoutId="activeBubble"
                                        className="absolute inset-0 rounded-full border-2 border-primary/20"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                {/* Tooltip */}
                                <div className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                    {item.label}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 pl-20 transition-all duration-300">
                <div className="max-w-7xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </div>
        </div>
    );
}
