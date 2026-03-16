import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Youtube, Globe, FileText, Search, Loader2,
  Check, Plus, ChevronLeft, Play, Link2, BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Material } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type MaterialSearchType = "youtube" | "website" | "pdf" | "custom";

interface YoutubeResult {
  title: string;
  channel: string;
  url: string;
  videoId: string;
  description: string;
  covers: string[];
  misses: string[];
}

interface WebsiteResult {
  title: string;
  url: string;
  description: string;
}

interface PdfResult {
  title: string;
  url: string;
  description: string;
  author?: string;
}

interface CustomResult {
  title: string;
  url: string;
  description: string;
  suggestedType: "video" | "link" | "pdf";
}

type SearchResult = YoutubeResult | WebsiteResult | PdfResult | CustomResult;

type Step = "type-select" | "loading" | "results";

interface Props {
  open: boolean;
  onClose: () => void;
  chapter: { id: string; title: string };
  chapterContext?: string;
  topicId?: string;
  courseId?: string;
  disciplineId?: string;
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleType: string;
    submoduleName: string;
  };
  onMaterialsAdded?: () => void;
}

// ─── Type Tile ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<MaterialSearchType, {
  icon: React.ElementType;
  label: string;
  description: string;
  promptPlaceholder: string;
  color: string;
}> = {
  youtube: {
    icon: Youtube,
    label: "YouTube Videos",
    description: "Lectures, tutorials & walkthroughs",
    promptPlaceholder: "Optional: e.g. 'beginner-friendly', 'MIT lecture style', 'visual explanation'...",
    color: "text-red-500",
  },
  website: {
    icon: Globe,
    label: "Websites",
    description: "Articles, wikis & documentation",
    promptPlaceholder: "Optional: e.g. 'interactive demos', 'academic source', 'Khan Academy style'...",
    color: "text-blue-500",
  },
  pdf: {
    icon: FileText,
    label: "PDFs & Papers",
    description: "Free textbook chapters & papers",
    promptPlaceholder: "Optional: e.g. 'introductory level', 'MIT OpenCourseWare', 'with exercises'...",
    color: "text-orange-500",
  },
  custom: {
    icon: Search,
    label: "Custom Search",
    description: "Describe what you're looking for",
    promptPlaceholder: "Describe what you need, e.g. 'interactive coding exercises', 'cheat sheet', 'podcast episode'...",
    color: "text-purple-500",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFaviconUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return "";
  }
}

function getYoutubeThumbnail(videoId: string) {
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

function isYoutubeResult(r: SearchResult, type: MaterialSearchType): r is YoutubeResult {
  return type === "youtube";
}

function isWebsiteResult(r: SearchResult, type: MaterialSearchType): r is WebsiteResult {
  return type === "website";
}

function isPdfResult(r: SearchResult, type: MaterialSearchType): r is PdfResult {
  return type === "pdf";
}

function isCustomResult(r: SearchResult, type: MaterialSearchType): r is CustomResult {
  return type === "custom";
}

// ─── Result Cards ─────────────────────────────────────────────────────────────

function YoutubeCard({ result, selected, onToggle }: { result: YoutubeResult; selected: boolean; onToggle: () => void }) {
  const thumb = getYoutubeThumbnail(result.videoId);
  return (
    <div
      className={`relative rounded-md border cursor-pointer transition-all ${selected ? "border-primary ring-1 ring-primary" : "border-border"}`}
      onClick={onToggle}
      data-testid={`ai-result-youtube-${result.videoId}`}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      {thumb ? (
        <div className="w-full aspect-video rounded-t-md overflow-hidden bg-muted">
          <img src={thumb} alt={result.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-t-md bg-muted flex items-center justify-center">
          <Play className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium leading-snug line-clamp-2">{result.title}</p>
        <p className="text-xs text-muted-foreground">{result.channel}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
        {result.covers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.covers.slice(0, 3).map((c, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950">
                {c}
              </Badge>
            ))}
          </div>
        )}
        {result.misses.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.misses.slice(0, 2).map((m, i) => (
              <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground">
                Skips: {m}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WebsiteCard({ result, selected, onToggle }: { result: WebsiteResult; selected: boolean; onToggle: () => void }) {
  const favicon = getFaviconUrl(result.url);
  let hostname = "";
  try { hostname = new URL(result.url).hostname; } catch {}

  return (
    <div
      className={`flex gap-3 p-3 rounded-md border cursor-pointer transition-all ${selected ? "border-primary ring-1 ring-primary" : "border-border"}`}
      onClick={onToggle}
      data-testid={`ai-result-website-${hostname}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {favicon ? (
          <img src={favicon} alt="" className="w-8 h-8 rounded-sm object-contain bg-muted p-1" onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
        ) : (
          <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center">
            <Globe className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-1">{result.title}</p>
          {selected && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{hostname}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
      </div>
    </div>
  );
}

function PdfCard({ result, selected, onToggle }: { result: PdfResult; selected: boolean; onToggle: () => void }) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-md border cursor-pointer transition-all ${selected ? "border-primary ring-1 ring-primary" : "border-border"}`}
      onClick={onToggle}
      data-testid={`ai-result-pdf-${encodeURIComponent(result.title).slice(0, 20)}`}
    >
      <div className="w-8 h-8 rounded-sm bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0 mt-0.5">
        <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-1">{result.title}</p>
          {selected && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
        </div>
        {result.author && <p className="text-xs text-muted-foreground mb-1">{result.author}</p>}
        <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
      </div>
    </div>
  );
}

function CustomCard({ result, selected, onToggle }: { result: CustomResult; selected: boolean; onToggle: () => void }) {
  const Icon = result.suggestedType === "video" ? Play : result.suggestedType === "pdf" ? FileText : Link2;
  const iconBg = result.suggestedType === "video" ? "bg-red-100 dark:bg-red-950" : result.suggestedType === "pdf" ? "bg-orange-100 dark:bg-orange-950" : "bg-blue-100 dark:bg-blue-950";
  const iconColor = result.suggestedType === "video" ? "text-red-600 dark:text-red-400" : result.suggestedType === "pdf" ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400";
  let hostname = "";
  try { hostname = new URL(result.url).hostname; } catch {}

  return (
    <div
      className={`flex gap-3 p-3 rounded-md border cursor-pointer transition-all ${selected ? "border-primary ring-1 ring-primary" : "border-border"}`}
      onClick={onToggle}
      data-testid={`ai-result-custom-${hostname}`}
    >
      <div className={`w-8 h-8 rounded-sm ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-1">{result.title}</p>
          {selected && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{hostname}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AIMaterialFinder({
  open, onClose, chapter, chapterContext = "",
  topicId, courseId, disciplineId, trajectoryContext, onMaterialsAdded,
}: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("type-select");
  const [selectedType, setSelectedType] = useState<MaterialSearchType | null>(null);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentType, setCurrentType] = useState<MaterialSearchType>("youtube");

  const handleClose = () => {
    setStep("type-select");
    setSelectedType(null);
    setPrompt("");
    setResults([]);
    setSelectedIds(new Set());
    onClose();
  };

  const searchMutation = useMutation({
    mutationFn: async (type: MaterialSearchType) => {
      const res = await apiRequest("POST", "/api/ai/find-materials", {
        chapterTitle: chapter.title,
        chapterContext,
        materialType: type,
        userPrompt: prompt.trim() || undefined,
        trajectoryContext,
      });
      return res.json();
    },
    onMutate: () => {
      setStep("loading");
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      setSelectedIds(new Set());
      setCurrentType(data.type);
      setStep("results");
    },
    onError: (err: any) => {
      setStep("type-select");
      toast({ title: "Search failed", description: err.message || "Please try again.", variant: "destructive" });
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const selected = Array.from(selectedIds).map(i => results[i]);
      const promises = selected.map((result, _) => {
        let type: string;
        let thumbnailUrl: string | undefined;

        if (currentType === "youtube") {
          const r = result as YoutubeResult;
          type = "video";
          thumbnailUrl = getYoutubeThumbnail(r.videoId);
        } else if (currentType === "website") {
          type = "link";
        } else if (currentType === "pdf") {
          type = "pdf";
        } else {
          const r = result as CustomResult;
          type = r.suggestedType === "video" ? "video" : r.suggestedType === "pdf" ? "pdf" : "link";
        }

        return apiRequest("POST", "/api/materials", {
          title: result.title,
          url: result.url,
          type,
          thumbnailUrl,
          chapterId: chapter.id,
          topicId: topicId || null,
          courseId: courseId || null,
          disciplineId: disciplineId || null,
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id, "with-children"] });
      toast({ title: "Materials added!", description: `${selectedIds.size} material${selectedIds.size !== 1 ? "s" : ""} added to this chapter.` });
      onMaterialsAdded?.();
      handleClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to add materials", description: err.message, variant: "destructive" });
    },
  });

  const toggleSelect = (idx: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleFind = (type: MaterialSearchType) => {
    setSelectedType(type);
    searchMutation.mutate(type);
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-2xl h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            Find Materials with AI
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chapter: <span className="font-medium text-foreground">{chapter.title}</span>
          </p>
        </DialogHeader>

        {/* ── Type Selection ─────────────────────────────────────────────── */}
        {step === "type-select" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-5 space-y-5">
                <p className="text-sm text-muted-foreground">
                  Choose a resource type and optionally describe what you need. The AI will search the web for the best real materials.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(TYPE_CONFIG) as [MaterialSearchType, typeof TYPE_CONFIG.youtube][]).map(([type, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(isSelected ? null : type)}
                        className={`text-left p-4 rounded-md border transition-all hover-elevate ${isSelected ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border"}`}
                        data-testid={`button-finder-type-${type}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </button>
                    );
                  })}
                </div>

                {selectedType && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Refine your search (optional)
                    </label>
                    <Textarea
                      placeholder={TYPE_CONFIG[selectedType].promptPlaceholder}
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      rows={3}
                      className="resize-none text-sm"
                      data-testid="textarea-finder-prompt"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
              <Button variant="ghost" onClick={handleClose} data-testid="button-finder-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => selectedType && handleFind(selectedType)}
                disabled={!selectedType}
                data-testid="button-finder-find"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Find Materials
              </Button>
            </div>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {step === "loading" && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 px-8 py-12 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <Loader2 className="w-16 h-16 absolute inset-0 text-primary animate-spin opacity-30" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Searching for materials</p>
              <p className="text-sm text-muted-foreground">
                AI is browsing the web for the best {selectedType === "youtube" ? "videos" : selectedType === "pdf" ? "PDFs" : selectedType === "website" ? "websites" : "resources"} for this chapter...
              </p>
            </div>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────────────── */}
        {step === "results" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setStep("type-select"); setResults([]); setSelectedIds(new Set()); }}
                  data-testid="button-finder-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <span className="text-xs text-muted-foreground">
                  {results.length} results — click to select
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => selectedType && handleFind(selectedType)}
                data-testid="button-finder-retry"
              >
                Search again
              </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className={`p-4 ${currentType === "youtube" ? "grid grid-cols-2 gap-3" : "space-y-3"}`}>
                {results.map((result, idx) => {
                  const sel = selectedIds.has(idx);
                  if (currentType === "youtube") {
                    return <YoutubeCard key={idx} result={result as YoutubeResult} selected={sel} onToggle={() => toggleSelect(idx)} />;
                  } else if (currentType === "website") {
                    return <WebsiteCard key={idx} result={result as WebsiteResult} selected={sel} onToggle={() => toggleSelect(idx)} />;
                  } else if (currentType === "pdf") {
                    return <PdfCard key={idx} result={result as PdfResult} selected={sel} onToggle={() => toggleSelect(idx)} />;
                  } else {
                    return <CustomCard key={idx} result={result as CustomResult} selected={sel} onToggle={() => toggleSelect(idx)} />;
                  }
                })}
                {results.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No results found. Try a different search or add a more specific prompt.</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
              <Button variant="ghost" onClick={handleClose} data-testid="button-finder-cancel-results">
                Cancel
              </Button>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={selectedIds.size === 0 || addMutation.isPending}
                data-testid="button-finder-add-selected"
              >
                {addMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Adding...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-1.5" /> Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Selected</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
