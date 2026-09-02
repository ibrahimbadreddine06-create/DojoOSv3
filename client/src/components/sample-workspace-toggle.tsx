import { Database, X } from "lucide-react";
import { isSampleWorkspaceMode, setSampleWorkspaceMode } from "@/lib/sample-workspace-data";
import { queryClient } from "@/lib/queryClient";

export function SampleWorkspaceToggle() {
  if (!import.meta.env.DEV) return null;
  const enabled = isSampleWorkspaceMode();
  const toggle = () => {
    setSampleWorkspaceMode(!enabled);
    queryClient.clear();
    window.location.reload();
  };

  return enabled ? (
    <div className="fixed inset-x-0 top-0 z-[100] flex h-7 items-center justify-center bg-[#18202a] px-3 text-[10px] font-semibold uppercase tracking-[.12em] text-white">
      Sample workspace · one month of connected demo data · nothing is saved
      <button type="button" onClick={toggle} aria-label="Exit sample workspace" className="absolute right-3 grid h-5 w-5 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  ) : (
    <button type="button" onClick={toggle} className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3.5 py-2 text-[11px] font-semibold text-[#18202a] shadow-[0_8px_24px_rgba(24,32,42,.12)] backdrop-blur-md transition-transform hover:-translate-y-0.5">
      <Database className="h-3.5 w-3.5" />
      Fill sample workspace
    </button>
  );
}
