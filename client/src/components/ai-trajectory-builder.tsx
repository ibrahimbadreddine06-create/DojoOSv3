import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, ChevronRight, ChevronDown, Trash2, Plus,
  GraduationCap, BookOpen, LayoutList, Pencil, Check,
  ExternalLink, RotateCcw, Loader2, FileText, HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChapterNode {
  id: string;
  title: string;
  learningObjectives?: string[];
  children: ChapterNode[];
  expanded: boolean;
}

interface Source {
  name: string;
  url: string;
  type: "university" | "book" | "course" | "institution" | "website";
}

type SubmoduleType = "second_brain" | "languages" | "studies" | "disciplines";
type StructurePreference = "academic" | "thematic";
type Step = "form" | "loading" | "review";

interface Props {
  open: boolean;
  onClose: () => void;
  submoduleType: SubmoduleType;
  submoduleName: string;
  topicId?: string;
  courseId?: string;
  disciplineId?: string;
  onCreated?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0;
function tempId() { return `tmp-${++_idCounter}`; }

function mapAIChapters(nodes: { title: string; learningObjectives?: string[]; children?: any[] }[]): ChapterNode[] {
  return nodes.map(n => ({
    id: tempId(),
    title: n.title,
    learningObjectives: n.learningObjectives,
    children: n.children?.length ? mapAIChapters(n.children) : [],
    expanded: false,
  }));
}


const LOADING_MESSAGES = [
  "Analyzing your goals...",
  "Searching university curricula...",
  "Consulting renowned textbooks...",
  "Examining certification frameworks...",
  "Reviewing online course structures...",
  "Building your learning path...",
  "Verifying logical order...",
  "Finalizing your trajectory...",
];

// ─── Tree node ────────────────────────────────────────────────────────────────

function TreeNode({
  node, depth, onUpdate, onDelete, onAddChild,
}: {
  node: ChapterNode;
  depth: number;
  onUpdate: (id: string, updates: Partial<ChapterNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(node.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };
  const commitEdit = () => {
    if (draft.trim()) onUpdate(node.id, { title: draft.trim() });
    setEditing(false);
  };

  const hasChildren = node.children.length > 0;
  const indent = depth * 18;

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 py-1 pr-1 rounded-md hover-elevate cursor-default"
        style={{ paddingLeft: `${8 + indent}px` }}
        data-testid={`trajectory-node-${node.id}`}
      >
        <button
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground"
          onClick={() => onUpdate(node.id, { expanded: !node.expanded })}
        >
          {hasChildren
            ? node.expanded
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />
            : <span className="w-3 h-3 inline-block" />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              className="w-full bg-transparent text-sm font-medium outline-none border-b border-primary"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              data-testid={`input-chapter-title-${node.id}`}
            />
          ) : (
            <span
              className={`text-sm block leading-snug truncate ${
                depth === 0
                  ? "font-semibold"
                  : depth === 1
                    ? "font-medium"
                    : "font-normal text-muted-foreground"
              }`}
              onDoubleClick={startEdit}
            >
              {node.title}
            </span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={startEdit} data-testid={`button-edit-${node.id}`}>
            <Pencil className="w-2.5 h-2.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onAddChild(node.id)} data-testid={`button-add-sub-${node.id}`}>
            <Plus className="w-2.5 h-2.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => onDelete(node.id)} data-testid={`button-delete-${node.id}`}>
            <Trash2 className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {hasChildren && node.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {node.children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AITrajectoryBuilder({
  open, onClose, submoduleType, submoduleName,
  topicId, courseId, disciplineId, onCreated,
}: Props) {
  const { toast } = useToast();

  // Form state
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [structure, setStructure] = useState<StructurePreference>("academic");
  const [tocOpen, setTocOpen] = useState(false);
  const [toc, setToc] = useState("");

  // Steps
  const [step, setStep] = useState<Step>("form");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generated
  const [chapters, setChapters] = useState<ChapterNode[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  const handleClose = () => {
    setStep("form");
    setGoal(""); setContext(""); setStructure("academic");
    setToc(""); setTocOpen(false);
    setChapters([]); setSources([]);
    if (loadingInterval.current) clearInterval(loadingInterval.current);
    onClose();
  };

  // AI generate
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate-trajectory", {
        submoduleType, submoduleName, goal, context,
        structurePreference: structure,
        tableOfContents: toc.trim() || undefined,
      });
      return res.json();
    },
    onMutate: () => {
      setStep("loading");
      setLoadingMsgIdx(0);
      loadingInterval.current = setInterval(() => {
        setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
      }, 2500);
    },
    onSuccess: (data) => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
      setChapters(mapAIChapters(data.chapters || []));
      setSources(data.sources || []);
      setStep("review");
    },
    onError: (err: any) => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
      setStep("form");
      const isRateLimit = err.message?.includes("429") || err.status === 429;
      toast({ 
        title: "Generation failed", 
        description: isRateLimit 
          ? "The AI is currently at capacity (too many requests). Retrying on the server, but you may need to wait 60 seconds."
          : (err.message || "Please try again."), 
        variant: "destructive" 
      });
    },
  });

  // Bulk create
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/learn-plan-items/bulk", {
        chapters: stripExpanded(chapters),
        topicId: topicId || null,
        courseId: courseId || null,
        disciplineId: disciplineId || null,
        trajectoryContext: {
          goal,
          context,
          structure,
          submoduleType,
          submoduleName,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      const qk = courseId
        ? ["/api/learn-plan-items/course", courseId]
        : disciplineId
          ? ["/api/learn-plan-items/discipline", disciplineId]
          : ["/api/learn-plan-items", topicId];
      queryClient.invalidateQueries({ queryKey: qk });
      toast({ title: "Trajectory created!", description: `${countNodes(chapters)} chapters added.` });
      onCreated?.();
      handleClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  // Tree helpers
  function updateNodeById(nodes: ChapterNode[], id: string, updates: Partial<ChapterNode>): ChapterNode[] {
    return nodes.map(n =>
      n.id === id
        ? { ...n, ...updates }
        : { ...n, children: updateNodeById(n.children, id, updates) }
    );
  }
  function deleteNodeById(nodes: ChapterNode[], id: string): ChapterNode[] {
    return nodes.filter(n => n.id !== id).map(n => ({ ...n, children: deleteNodeById(n.children, id) }));
  }
  function addChildById(nodes: ChapterNode[], parentId: string): ChapterNode[] {
    return nodes.map(n =>
      n.id === parentId
        ? { ...n, expanded: true, children: [...n.children, { id: tempId(), title: "New subchapter", children: [], expanded: false }] }
        : { ...n, children: addChildById(n.children, parentId) }
    );
  }
  function stripExpanded(nodes: ChapterNode[]): any[] {
    return nodes.map(({ title, children }) => ({ title, children: stripExpanded(children) }));
  }
  function countNodes(nodes: ChapterNode[]): number {
    return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
  }

  const handleUpdate = useCallback((id: string, u: Partial<ChapterNode>) => setChapters(p => updateNodeById(p, id, u)), []);
  const handleDelete = useCallback((id: string) => setChapters(p => deleteNodeById(p, id)), []);
  const handleAddChild = useCallback((pid: string) => setChapters(p => addChildById(p, pid)), []);

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-2xl h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Learning Trajectory — {submoduleName}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step: Form ─────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-5 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-goal">What is your goal?</Label>
                  <Textarea
                    id="ai-goal"
                    placeholder={`e.g. "Reach B2 level in Chinese" or "Pass my 2nd-year physics exam" or "Learn to play piano from scratch"`}
                    className="resize-none"
                    rows={3}
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    data-testid="textarea-ai-goal"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ai-context">Your current level / context</Label>
                  <Textarea
                    id="ai-context"
                    placeholder={`e.g. "Complete beginner" or "I have the course slides but no textbook"`}
                    className="resize-none"
                    rows={2}
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    data-testid="textarea-ai-context"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Structure preference</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`flex flex-col gap-1.5 p-4 rounded-md border text-left ${structure === "academic" ? "border-primary bg-accent" : "border-border hover-elevate"}`}
                      onClick={() => setStructure("academic")}
                      data-testid="button-structure-academic"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Academic</span>
                        {structure === "academic" && <Check className="w-3 h-3 text-primary ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">Levels or numbered: A1 → A2 → B1, Chapter 1 → 2 → 3</p>
                    </button>
                    <button
                      type="button"
                      className={`flex flex-col gap-1.5 p-4 rounded-md border text-left ${structure === "thematic" ? "border-primary bg-accent" : "border-border hover-elevate"}`}
                      onClick={() => setStructure("thematic")}
                      data-testid="button-structure-thematic"
                    >
                      <div className="flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Thematic</span>
                        {structure === "thematic" && <Check className="w-3 h-3 text-primary ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">Topic clusters: Grammar, Vocabulary, Listening</p>
                    </button>
                  </div>
                </div>

                {/* Optional ToC */}
                <div className="border rounded-md overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover-elevate"
                    onClick={() => setTocOpen(o => !o)}
                    data-testid="button-toggle-toc"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">I already have a table of contents</p>
                      <p className="text-xs text-muted-foreground">Paste your syllabus or book index — AI will use it as the base</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${tocOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {tocOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1">
                          <Textarea
                            placeholder={"Paste your table of contents here...\n\n1. Introduction\n   1.1 What is...\n2. Core Concepts\n   2.1 ..."}
                            className="resize-none font-mono text-xs"
                            rows={10}
                            value={toc}
                            onChange={e => setToc(e.target.value)}
                            data-testid="textarea-ai-toc"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
              <Button variant="ghost" onClick={handleClose} data-testid="button-cancel-trajectory">Cancel</Button>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={!goal.trim() || !context.trim()}
                data-testid="button-generate-trajectory"
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> Generate Trajectory
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Loading ───────────────────────────────────────────── */}
        {step === "loading" && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 px-8 py-12 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <Loader2 className="w-16 h-16 absolute inset-0 text-primary animate-spin opacity-30" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">AI is researching your trajectory</p>
              <motion.p
                key={loadingMsgIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm text-muted-foreground"
              >
                {LOADING_MESSAGES[loadingMsgIdx]}
              </motion.p>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              Consulting curricula, textbooks, and certification frameworks. This may take up to a minute.
            </p>
          </div>
        )}

        {/* ── Step: Review ────────────────────────────────────────────── */}
        {step === "review" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b flex items-center justify-between shrink-0">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{countNodes(chapters)}</span> chapters — double-click any title to rename
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => setStep("form")} data-testid="button-regenerate">
                    <RotateCcw className="w-3 h-3 mr-1.5" /> Regenerate
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  Go back and modify your goal, context, or structure to generate a new trajectory
                </TooltipContent>
              </Tooltip>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-3">
                {chapters.map(chapter => (
                  <TreeNode
                    key={chapter.id}
                    node={chapter}
                    depth={0}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                ))}
                <button
                  onClick={() => setChapters(p => [...p, { id: tempId(), title: "New chapter", children: [], expanded: false }])}
                  className="flex items-center gap-2 text-xs text-muted-foreground mt-2 px-2 py-1.5 rounded-md hover-elevate w-full"
                  data-testid="button-add-top-chapter"
                >
                  <Plus className="w-3 h-3" /> Add chapter
                </button>
              </div>
            </ScrollArea>

            {/* Sources — fixed at bottom, above buttons */}
            {sources.length > 0 && (
              <div className="border-t px-4 py-3 bg-muted/30 shrink-0">
                <p className="text-xs text-muted-foreground mb-2.5 font-medium">Based on</p>
                <div className="flex flex-wrap gap-2">
                  {sources.slice(0, 12).map((src, i) => {
                    const favicon = `https://icons.duckduckgo.com/ip3/${new URL(src.url).hostname}.ico`;
                    return (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 rounded-md border hover-elevate"
                            data-testid={`source-link-${i}`}
                          >
                            <img 
                              src={favicon} 
                              alt="" 
                              className="w-4 h-4 rounded-sm" 
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                              }}
                            />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{src.name}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
              <Button variant="ghost" onClick={handleClose} data-testid="button-discard-trajectory">Discard</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || chapters.length === 0}
                data-testid="button-accept-trajectory"
              >
                {createMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Creating...</>
                  : <><Check className="w-4 h-4 mr-1.5" /> Accept & Create</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
