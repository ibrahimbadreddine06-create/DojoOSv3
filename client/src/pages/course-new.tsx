import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { X, GraduationCap, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function CourseNewPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get("return") || "/studies";
  const defaultSemester = searchParams.get("semester") || "";
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState(defaultSemester);

  const currentYear = new Date().getFullYear();
  const semesters = [
    `Fall ${currentYear}`,
    `Spring ${currentYear}`,
    `Summer ${currentYear}`,
    `Fall ${currentYear + 1}`,
    `Spring ${currentYear + 1}`,
  ];

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; semester?: string }) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course created successfully" });
      navigate(returnUrl);
    },
    onError: () => {
      toast({ title: "Failed to create course", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Please enter a course name", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      semester: semester || undefined,
    });
  };

  const handleClose = () => {
    navigate(returnUrl);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col" data-testid="course-new-page">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close">
          <X className="h-6 w-6" />
        </Button>
        
        <h1 className="font-medium flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          New Course
        </h1>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!name.trim() || createMutation.isPending}
          data-testid="button-save-course"
        >
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="space-y-2">
            <Label>Course Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Introduction to Computer Science"
              autoFocus
              data-testid="input-course-name"
            />
          </div>

          <div className="space-y-2">
            <Label>Semester (optional)</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger data-testid="select-semester">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add course description, professor name, etc..."
              rows={4}
              data-testid="input-course-description"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
