// @refresh reset
import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageSetting } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MODULE_THEMES as DEFAULT_THEMES } from "@/lib/constants";

// Map of user-friendly color names to Tailwind HSL vars
export const PRESET_COLORS = {
    red: { label: "Red", class: "text-red-500", cssVar: "0 84.2% 60.2%" },
    orange: { label: "Orange", class: "text-orange-500", cssVar: "24.6 95% 53.1%" },
    amber: { label: "Amber", class: "text-amber-500", cssVar: "38 92% 50%" },
    yellow: { label: "Yellow", class: "text-yellow-500", cssVar: "47.9 95.8% 53.1%" },
    lime: { label: "Lime", class: "text-lime-500", cssVar: "84 81% 44%" },
    green: { label: "Green", class: "text-green-500", cssVar: "142.1 76.2% 36.3%" },
    emerald: { label: "Emerald", class: "text-emerald-500", cssVar: "160 84% 39%" },
    teal: { label: "Teal", class: "text-teal-500", cssVar: "173 80% 40%" },
    cyan: { label: "Cyan", class: "text-cyan-500", cssVar: "189 94% 43%" },
    sky: { label: "Sky", class: "text-sky-500", cssVar: "199 89% 48%" },
    blue: { label: "Blue", class: "text-blue-500", cssVar: "221.2 83.2% 53.3%" },
    indigo: { label: "Indigo", class: "text-indigo-500", cssVar: "226 71% 55%" },
    violet: { label: "Violet", class: "text-violet-500", cssVar: "262.1 83.3% 57.8%" },
    purple: { label: "Purple", class: "text-purple-500", cssVar: "271 81% 56%" },
    fuchsia: { label: "Fuchsia", class: "text-fuchsia-500", cssVar: "292 84% 61%" },
    pink: { label: "Pink", class: "text-pink-500", cssVar: "330 81% 60%" },
    rose: { label: "Rose", class: "text-rose-500", cssVar: "343 88% 61%" },
};

type ThemeParams = { color: string; cssVar: string };

interface ThemeContextType {
    getModuleTheme: (path: string) => ThemeParams;
    setModuleTheme: (module: string, colorKey: string) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [localThemes, setLocalThemes] = useState<Record<string, string>>({});

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("dojoModuleThemes");
            if (saved) {
                setLocalThemes(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load themes", e);
        }
    }, []);

    // Fetch settings from API (still try to sync, but don't block)
    const { data: pageSettings, isLoading } = useQuery<PageSetting[]>({
        queryKey: ["/api/page-settings"],
    });

    // Check remote settings but prioritize local edits if conflicts, for now we merge remote if local is missing
    useEffect(() => {
        if (pageSettings) {
            // If we have remote settings with colors, merge them into local state IF not already set?
            // Or actually, let's treat local as the master for this session to be fast.
            // If local is empty, populate from remote.
            setLocalThemes(prev => {
                const next = { ...prev };
                let changed = false;
                pageSettings.forEach(p => {
                    if (p.color && !next[p.module]) {
                        next[p.module] = p.color;
                        changed = true;
                    }
                });
                if (changed) return next;
                return prev;
            });
        }
    }, [pageSettings]);

    // Mutation to save settings
    const mutation = useMutation({
        mutationFn: async ({ module, color }: { module: string; color: string }) => {
            // 1. Update Local State & Storage immediately
            const newThemes = { ...localThemes, [module]: color };
            setLocalThemes(newThemes);
            localStorage.setItem("dojoModuleThemes", JSON.stringify(newThemes));

            // 2. Try to sync to backend (best effort)
            // If backend fails (e.g. schema missing), we catch and ignore
            try {
                // We need to match the module ID to an API resource. 
                // Using 'page-settings' is correct but we need to know if we are POSTing or PATCHing.
                const existing = pageSettings?.find(p => p.module === module);

                if (existing) {
                    await apiRequest("PATCH", `/api/page-settings/${existing.id}`, { color, active: existing.active });
                } else {
                    await apiRequest("POST", "/api/page-settings", { module, color, active: true });
                }
            } catch (err) {
                console.warn("Theme sync failed (backend likely missing 'color' column), using local storage.", err);
            }
        },
        onSuccess: () => {
            // We invalidate queries to get latest ID if we just POSTed, but we don't depend on it for UI
            queryClient.invalidateQueries({ queryKey: ["/api/page-settings"] });
        },
    });

    const getModuleTheme = (path: string): ThemeParams => {
        // Normalize path to ID: "/body" -> "body", "body" -> "body"
        const normalizedId = path.startsWith("/") ? path.substring(1) : path;

        // 1. Check local themes (master record)
        const colorKey = localThemes[normalizedId];
        if (colorKey && PRESET_COLORS[colorKey as keyof typeof PRESET_COLORS]) {
            const preset = PRESET_COLORS[colorKey as keyof typeof PRESET_COLORS];
            return { color: preset.class, cssVar: preset.cssVar };
        }

        // 2. Fallback to default constants
        const defaultKey = "/" + normalizedId;
        return DEFAULT_THEMES[defaultKey] || { color: "", cssVar: "" };
    };

    const setModuleTheme = (module: string, colorKey: string) => {
        const normalizedId = module.startsWith("/") ? module.substring(1) : module;
        mutation.mutate({ module: normalizedId, color: colorKey });
    };

    return (
        <ThemeContext.Provider value={{ getModuleTheme, setModuleTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}
