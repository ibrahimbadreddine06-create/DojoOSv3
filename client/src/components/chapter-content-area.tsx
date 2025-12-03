import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, FileText, Video, Link2, File, ExternalLink, Trash2, GraduationCap, Upload, BookOpen, Brain, MoreHorizontal, Users, Eye, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LearningSession } from "@/components/learning-session";
import { NotesList } from "@/components/note-editor";
import { FlashcardsOverview } from "@/components/flashcards-overview";
import { calculateReadinessWithDecay } from "@/lib/readiness";
import type { LearnPlanItem, Material, Flashcard } from "@shared/schema";

interface ChapterContentAreaProps {
  chapter: LearnPlanItem;
  topicId?: string;
  courseId?: string;
  childChapterIds?: string[];
}

const materialTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  link: Link2,
  file: File,
};

function CompletionReadinessMetrics({ flashcards, chapter }: { flashcards: Flashcard[]; chapter: LearnPlanItem }) {
  const safeFlashcards = Array.isArray(flashcards) ? flashcards : [];
  const readiness = useMemo(() => {
    return calculateReadinessWithDecay(safeFlashcards);
  }, [safeFlashcards]);

  const completion = chapter.completed ? 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Completion</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{completion}%</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-chart-2" />
            <span className="text-sm font-medium">Readiness</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-chart-2 transition-all" 
              style={{ width: `${readiness}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{readiness}%</p>
        </div>
      </div>
    </div>
  );
}

function FlashcardCircleChart({ flashcards }: { flashcards: Flashcard[] }) {
  const total = flashcards.length;
  const mastered = flashcards.filter(f => f.mastery === 4).length;
  const toLearn = flashcards.filter(f => f.mastery < 4).length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.91549"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">0</span>
          </div>
        </div>
        <div className="text-center space-y-1 text-xs text-muted-foreground">
          <p>Mastered: 0</p>
          <p>To learn: 0</p>
          <p className="font-medium text-foreground">Total: 0</p>
        </div>
      </div>
    );
  }

  const masteryLevels = [0, 1, 2, 3, 4];
  const counts = masteryLevels.map(level => flashcards.filter(f => f.mastery === level).length);
  const percentages = counts.map(c => (c / total) * 100);
  
  const colors = [
    "text-muted-foreground",
    "text-red-500",
    "text-yellow-500", 
    "text-blue-500",
    "text-green-500",
  ];

  let offset = 0;
  const segments = percentages.map((percent, i) => {
    const segment = { offset, percent, color: colors[i] };
    offset += percent;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.91549"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
              strokeDashoffset={-seg.offset}
              className={seg.color}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold">{total}</span>
        </div>
      </div>
      <div className="text-center space-y-1 text-xs text-muted-foreground">
        <p>Mastered: <span className="text-green-500 font-medium">{mastered}</span></p>
        <p>To learn: <span className="text-primary font-medium">{toLearn}</span></p>
        <p className="font-medium text-foreground">Total: {total}</p>
      </div>
    </div>
  );
}

function AddMaterialDialog({
  chapterId,
  topicId,
  courseId,
  onClose,
}: {
  chapterId: string;
  topicId?: string;
  courseId?: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<string>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [uploadMode, setUploadMode] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; title: string; url?: string; content?: string; fileName?: string; fileData?: string; chapterId: string; topicId?: string; courseId?: string }) => {
      return apiRequest("POST", "/api/materials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapterId] });
      onClose();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFileData(base64);
    };
    reader.readAsDataURL(file);
    
    if (file.type.includes("pdf")) {
      setType("pdf");
    } else if (file.type.includes("video")) {
      setType("video");
    } else {
      setType("file");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (uploadMode && !fileData) return;
    
    createMutation.mutate({
      type,
      title: title.trim(),
      url: uploadMode ? undefined : (url.trim() || undefined),
      content: content.trim() || undefined,
      fileName: uploadMode ? fileName : undefined,
      fileData: uploadMode ? fileData : undefined,
      chapterId,
      topicId,
      courseId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant={!uploadMode ? "default" : "outline"} 
          size="sm"
          onClick={() => setUploadMode(false)}
          data-testid="button-link-mode"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Add Link
        </Button>
        <Button 
          type="button" 
          variant={uploadMode ? "default" : "outline"} 
          size="sm"
          onClick={() => setUploadMode(true)}
          data-testid="button-upload-mode"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      {uploadMode ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">File</label>
          <div className="border-2 border-dashed rounded-md p-4 text-center hover-elevate cursor-pointer">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="material-file-input"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.mp3,.png,.jpg,.jpeg,.gif"
              data-testid="input-material-file"
            />
            <label htmlFor="material-file-input" className="cursor-pointer">
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <File className="h-5 w-5" />
                  <span className="text-sm">{fileName}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Click to upload a file</p>
                  <p className="text-xs">PDF, Word, PowerPoint, Excel, images, videos</p>
                </div>
              )}
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-testid="select-material-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="file">File</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Material title..."
          data-testid="input-material-title"
          autoFocus={!uploadMode}
        />
      </div>
      
      {!uploadMode && (
        <div className="space-y-2">
          <label className="text-sm font-medium">URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            data-testid="input-material-url"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Additional notes..."
          data-testid="textarea-material-notes"
          rows={2}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!title.trim() || (uploadMode && !fileData) || createMutation.isPending} 
          data-testid="button-create-material"
        >
          {createMutation.isPending ? "Adding..." : "Add Material"}
        </Button>
      </div>
    </form>
  );
}

function AddFlashcardDialog({
  chapterId,
  topicId,
  courseId,
  onClose,
}: {
  chapterId: string;
  topicId?: string;
  courseId?: string;
  onClose: () => void;
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { front: string; back: string; chapterId: string; topicId?: string; courseId?: string }) => {
      return apiRequest("POST", "/api/flashcards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/chapter", chapterId] });
      setFront("");
      setBack("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    createMutation.mutate({
      front: front.trim(),
      back: back.trim(),
      chapterId,
      topicId,
      courseId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Question (Front)</label>
        <Textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Enter the question..."
          data-testid="textarea-flashcard-front"
          rows={3}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Answer (Back)</label>
        <Textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Enter the answer..."
          data-testid="textarea-flashcard-back"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="submit" disabled={!front.trim() || !back.trim() || createMutation.isPending} data-testid="button-create-flashcard">
          {createMutation.isPending ? "Adding..." : "Add Card"}
        </Button>
      </div>
    </form>
  );
}

export function ChapterContentArea({ chapter, topicId, courseId, childChapterIds = [] }: ChapterContentAreaProps) {
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addFlashcardOpen, setAddFlashcardOpen] = useState(false);
  const [learningSessionOpen, setLearningSessionOpen] = useState(false);
  const [flashcardsOverviewOpen, setFlashcardsOverviewOpen] = useState(false);

  const hasChildren = childChapterIds.length > 0;
  const childIdsParam = childChapterIds.join(',');

  const { data: materials = [], isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: hasChildren 
      ? ["/api/materials/chapter", chapter.id, "with-children", childIdsParam]
      : ["/api/materials/chapter", chapter.id],
    queryFn: async () => {
      const url = hasChildren 
        ? `/api/materials/chapter/${chapter.id}/with-children?childIds=${childIdsParam}`
        : `/api/materials/chapter/${chapter.id}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch materials');
      return res.json();
    },
  });

  const { data: flashcards = [], isLoading: flashcardsLoading } = useQuery<Flashcard[]>({
    queryKey: hasChildren
      ? ["/api/flashcards/chapter", chapter.id, "with-children", childIdsParam]
      : ["/api/flashcards/chapter", chapter.id],
    queryFn: async () => {
      const url = hasChildren
        ? `/api/flashcards/chapter/${chapter.id}/with-children?childIds=${childIdsParam}`
        : `/api/flashcards/chapter/${chapter.id}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch flashcards');
      return res.json();
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id] });
      if (hasChildren) {
        queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id, "with-children"] });
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-chapter-title">
            {chapter.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              Importance: {chapter.importance}/5
            </Badge>
            {chapter.completed && (
              <Badge variant="secondary" className="text-xs">
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Flashcards</h3>
            <Dialog open={addFlashcardOpen} onOpenChange={setAddFlashcardOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-add-flashcard">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Flashcard</DialogTitle>
                  <DialogDescription>
                    Create a flashcard for this chapter.
                  </DialogDescription>
                </DialogHeader>
                <AddFlashcardDialog
                  chapterId={chapter.id}
                  topicId={topicId}
                  courseId={courseId}
                  onClose={() => setAddFlashcardOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {flashcardsLoading ? (
            <div className="flex justify-center py-4">
              <Skeleton className="w-20 h-20 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <FlashcardCircleChart flashcards={flashcards} />
              <div className="flex gap-2 w-full">
                <Button 
                  className="flex-1" 
                  onClick={() => setLearningSessionOpen(true)}
                  disabled={flashcards.length === 0}
                  data-testid="button-start-learning"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Learn
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setFlashcardsOverviewOpen(true)}
                  data-testid="button-view-all-flashcards"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-medium text-sm mb-4">Progress</h3>
          <CompletionReadinessMetrics flashcards={flashcards} chapter={chapter} />
        </Card>
      </div>

      <LearningSession
        flashcards={flashcards}
        chapterId={chapter.id}
        topicId={topicId}
        courseId={courseId}
        open={learningSessionOpen}
        onClose={() => setLearningSessionOpen(false)}
      />

      <Dialog open={flashcardsOverviewOpen} onOpenChange={setFlashcardsOverviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Flashcards Overview</DialogTitle>
            <DialogDescription>View and manage all flashcards for this chapter</DialogDescription>
          </DialogHeader>
          <FlashcardsOverview
            chapterId={chapter.id}
            topicId={topicId}
            courseId={courseId}
            childChapterIds={childChapterIds}
            onBack={() => setFlashcardsOverviewOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">Materials</h3>
          <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" data-testid="button-add-material">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Material</DialogTitle>
                <DialogDescription>
                  Add a link, PDF, video, or file to this chapter.
                </DialogDescription>
              </DialogHeader>
              <AddMaterialDialog
                chapterId={chapter.id}
                topicId={topicId}
                courseId={courseId}
                onClose={() => setAddMaterialOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {materialsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : materials.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No materials yet. Add PDFs, links, or files to study from.
          </p>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => {
              const Icon = materialTypeIcons[material.type] || File;
              const hasUploadedFile = !!(material as any).fileData;
              const handleOpen = () => {
                if (hasUploadedFile) {
                  const link = document.createElement("a");
                  link.href = (material as any).fileData;
                  link.download = (material as any).fileName || material.title;
                  link.click();
                } else if (material.url) {
                  window.open(material.url, "_blank");
                }
              };
              return (
                <div
                  key={material.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover-elevate cursor-pointer group"
                  onClick={handleOpen}
                  data-testid={`material-item-${material.id}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{material.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {material.type.toUpperCase()}
                      {hasUploadedFile && ` • ${(material as any).fileName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-material-menu-${material.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); deleteMaterialMutation.mutate(material.id); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <NotesList
          chapterId={chapter.id}
          topicId={topicId}
          courseId={courseId}
          childChapterIds={childChapterIds}
        />
      </Card>
    </div>
  );
}
