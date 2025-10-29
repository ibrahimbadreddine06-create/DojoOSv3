import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, CheckSquare } from "lucide-react";

export default function Work() {
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/work-projects", "work"],
  });

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-work-title">
              Work
            </h1>
            <p className="text-muted-foreground">
              Track work projects, tasks, and hours
            </p>
          </div>
          <Button size="sm" data-testid="button-add-project">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} data-testid={`card-project-${project.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="text-sm">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <Briefcase className="w-5 h-5 text-chart-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckSquare className="w-4 h-4" />
                    <span>{project.tasksCount || 0} tasks</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No work projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your work projects and tasks
            </p>
            <Button data-testid="button-create-project">
              Add Project
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Linked Time Blocks</CardTitle>
            <CardDescription>Time blocks associated with Work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-sm text-muted-foreground">
              No linked time blocks. Create time blocks in the planner and associate them with Work.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
