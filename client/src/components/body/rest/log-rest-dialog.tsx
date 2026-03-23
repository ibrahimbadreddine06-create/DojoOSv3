import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { insertSleepLogSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const formSchema = insertSleepLogSchema;
type FormData = z.infer<typeof formSchema>;

const REST_TYPES = [
  { value: "sleep", label: "Sleep" },
  { value: "nap", label: "Nap" },
  { value: "meditation", label: "Meditation" },
  { value: "decompression", label: "Decompression / Lying down" },
  { value: "winddown_started", label: "Wind-down started" },
  { value: "winddown_completed", label: "Wind-down completed" },
  { value: "correction", label: "Manual sleep correction" },
  { value: "symptom", label: "Symptom / Restless night note" },
] as const;

interface LogRestDialogProps {
  trigger?: React.ReactNode;
}

export function LogRestDialog({ trigger }: LogRestDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      plannedHours: "8",
      actualHours: "7",
      quality: 3,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/sleep-logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleep-logs"] });
      toast({ title: "Rest entry logged" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to log rest entry", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 shrink-0" style={{ backgroundColor: "#6366f1" }}>
            <Plus className="w-4 h-4" /> Log rest
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Rest Entry</DialogTitle>
          <DialogDescription>Record sleep, nap, meditation, or any rest activity</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            {/* Rest type */}
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select defaultValue="sleep">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rest type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            {/* Date */}
            <FormField
              control={form.control as any}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="plannedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned hours</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="actualHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual hours</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" step="0.5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality (1–5)</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() ?? "3"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((q) => (
                        <SelectItem key={q} value={q.toString()}>
                          {q} — {["Very Poor", "Poor", "Average", "Good", "Excellent"][q - 1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Restless night, stress, late meal, travel…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                style={{ backgroundColor: "#6366f1" }}
              >
                {createMutation.isPending ? "Logging…" : "Log entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
