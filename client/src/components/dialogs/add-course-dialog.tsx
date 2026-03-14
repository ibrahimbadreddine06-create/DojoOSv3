import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddCourseDialogProps {
  trigger?: React.ReactNode;
  defaultSemester?: string;
}

export function AddCourseDialog({ trigger, defaultSemester }: AddCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState(defaultSemester || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; semester?: string }) => {
      return await apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course created successfully" });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create course", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setSemester(defaultSemester || "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const currentYear = new Date().getFullYear();
  const semesters = [
    `Fall ${currentYear}`,
    `Spring ${currentYear}`,
    `Summer ${currentYear}`,
    `Fall ${currentYear + 1}`,
    `Spring ${currentYear + 1}`,
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" data-testid="button-add-course">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Course</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-name">Course Name</Label>
            <Input
              id="course-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Introduction to Psychology"
              data-testid="input-course-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-semester">Semester (optional)</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger id="course-semester" data-testid="select-semester">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="course-description">Description (optional)</Label>
            <Textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the course"
              rows={3}
              data-testid="input-course-description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-course"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-create-course"
            >
              {createMutation.isPending ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

