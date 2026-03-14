// HSL values for the primary color of each module
// These correspond to Tailwind colors (roughly)
export const MODULE_THEMES: Record<string, { color: string, cssVar: string }> = {
    "/body": { color: "text-red-500", cssVar: "0 84.2% 60.2%" }, // Red
    "/goals": { color: "text-green-500", cssVar: "142.1 76.2% 36.3%" }, // Green
    "/second-brain": { color: "text-orange-500", cssVar: "24.6 95% 53.1%" }, // Orange
    "/languages": { color: "text-purple-500", cssVar: "262.1 83.3% 57.8%" }, // Purple
    "/studies": { color: "text-blue-500", cssVar: "221.2 83.2% 53.3%" }, // Blue (Default-ish)
    "/disciplines": { color: "text-yellow-500", cssVar: "47.9 95.8% 53.1%" }, // Yellow
    "/possessions": { color: "text-sky-500", cssVar: "199 89% 48%" }, // Sky/Cyan
};
