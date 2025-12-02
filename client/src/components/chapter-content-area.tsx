import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, FileText, Video, Link2, File, ExternalLink, Trash2, GraduationCap, Upload } from "lucide-react";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LearningSession } from "@/components/learning-session";
import { NotesList } from "@/components/note-editor";
import type { LearnPlanItem, Material, Flashcard } from "@shared/schema";

interface ChapterContentAreaProps {
  chapter: LearnPlanItem;
  topicId?: string;
  courseId?: string;
}

const materialTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  link: Link2,
  file: File,
};

function FlashcardCircleChart({ flashcards }: { flashcards: Flashcard[] }) {
  const total = flashcards.length;
  if (total === 0) {
    return (
      <div className="relative w-24 h-24 mx-auto">
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
          <span className="text-xs text-muted-foreground">cards</span>
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
    <div className="relative w-24 h-24 mx-auto">
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
        <span className="text-xs text-muted-foreground">cards</span>
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

export function ChapterContentArea({ chapter, topicId, courseId }: ChapterContentAreaProps) {
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addFlashcardOpen, setAddFlashcardOpen] = useState(false);
  const [learningSessionOpen, setLearningSessionOpen] = useState(false);

  const { data: materials = [], isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials/chapter", chapter.id],
  });

  const { data: flashcards = [], isLoading: flashcardsLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/chapter", chapter.id],
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapter.id] });
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
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : materials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No materials yet
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
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
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group"
                    data-testid={`material-item-${material.id}`}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">{material.title}</span>
                      {hasUploadedFile && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Upload className="h-3 w-3" />
                          {(material as any).fileName}
                        </span>
                      )}
                    </div>
                    {(material.url || hasUploadedFile) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={handleOpen}
                        data-testid={`button-open-material-${material.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => deleteMaterialMutation.mutate(material.id)}
                      data-testid={`button-delete-material-${material.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

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
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <FlashcardCircleChart flashcards={flashcards} />
              {flashcards.length > 0 && (
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => setLearningSessionOpen(true)}
                  data-testid="button-start-learning"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
              )}
              <div className="flex flex-wrap gap-1 justify-center text-xs">
                <Badge variant="outline" className="text-muted-foreground">New: {flashcards.filter(f => f.mastery === 0).length}</Badge>
                <Badge variant="outline" className="text-red-500 border-red-500/30">Bad: {flashcards.filter(f => f.mastery === 1).length}</Badge>
                <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Okay: {flashcards.filter(f => f.mastery === 2).length}</Badge>
                <Badge variant="outline" className="text-blue-500 border-blue-500/30">Good: {flashcards.filter(f => f.mastery === 3).length}</Badge>
                <Badge variant="outline" className="text-green-500 border-green-500/30">Perfect: {flashcards.filter(f => f.mastery === 4).length}</Badge>
              </div>
            </div>
          )}
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

      <Card className="p-4">
        <NotesList
          chapterId={chapter.id}
          topicId={topicId}
          courseId={courseId}
        />
      </Card>
    </div>
  );
}
