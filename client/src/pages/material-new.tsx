import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  X, FileText, Link2, Upload, Video, File, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const materialTypes = [
  { value: "link", label: "Link", icon: Link2 },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "file", label: "File", icon: File },
];

export default function MaterialNewPage() {
  const params = useParams<{ chapterId: string }>();
  const [, navigate] = useLocation();
  const chapterId = params.chapterId || "";
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const topicId = searchParams.get("topicId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const disciplineId = searchParams.get("disciplineId") || undefined;
  const returnUrl = searchParams.get("return") || "/";

  const [type, setType] = useState("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [uploadMode, setUploadMode] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/materials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/chapter", chapterId] });
      toast({ title: "Material added" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to add material", variant: "destructive" });
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

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    if (uploadMode && !fileData) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

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
      disciplineId,
    });
  };

  const handleClose = () => {
    navigate(returnUrl);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="material-new-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>

        <h1 className="font-medium flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Add Material
        </h1>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || (uploadMode && !fileData) || createMutation.isPending}
          data-testid="button-save-material"
        >
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!uploadMode ? "default" : "outline"}
              onClick={() => setUploadMode(false)}
              className="flex-1"
              data-testid="button-link-mode"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Link
            </Button>
            <Button
              type="button"
              variant={uploadMode ? "default" : "outline"}
              onClick={() => setUploadMode(true)}
              className="flex-1"
              data-testid="button-upload-mode"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title..."
              data-testid="input-material-title"
            />
          </div>

          {!uploadMode ? (
            <>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger data-testid="select-material-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((mt) => (
                      <SelectItem key={mt.value} value={mt.value}>
                        <div className="flex items-center gap-2">
                          <mt.icon className="h-4 w-4" />
                          {mt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-material-url"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.webm"
                  data-testid="input-file"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {fileName || "Click to select a file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Word, PowerPoint, Excel, Images, Videos
                  </p>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add any notes about this material..."
              rows={4}
              data-testid="input-material-notes"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

