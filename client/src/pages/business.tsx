import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, FolderOpen } from "lucide-react";

export default function Business() {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  const { data: businesses, isLoading } = useQuery<any[]>({
    queryKey: ["/api/businesses"],
  });

  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/work-projects", "business", selectedBusiness],
    enabled: !!selectedBusiness,
  });

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-business-title">
              Business
            </h1>
            <p className="text-muted-foreground">
              Manage your businesses, projects, and tasks
            </p>
          </div>
          <Button size="sm" data-testid="button-add-business">
            <Plus className="w-4 h-4 mr-2" />
            Add Business
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : businesses && businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map((business) => (
              <Card
                key={business.id}
                className="hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => setSelectedBusiness(business.id)}
                data-testid={`card-business-${business.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{business.name}</CardTitle>
                      {business.description && (
                        <CardDescription className="text-sm line-clamp-2">
                          {business.description}
                        </CardDescription>
                      )}
                    </div>
                    <Briefcase className="w-5 h-5 text-chart-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderOpen className="w-4 h-4" />
                    <span>{business.projectsCount || 0} projects</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No businesses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your business ventures
            </p>
            <Button data-testid="button-create-business">
              Add Business
            </Button>
          </div>
        )}

        {selectedBusiness && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Business projects and tasks</CardDescription>
                </div>
                <Button size="sm" data-testid="button-add-project">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <Card key={project.id} data-testid={`card-project-${project.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{project.name}</CardTitle>
                          {project.description && (
                            <CardDescription className="text-sm">
                              {project.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No projects yet. Add projects to organize your work.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Linked Time Blocks</CardTitle>
            <CardDescription>Time blocks associated with Business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-sm text-muted-foreground">
              No linked time blocks. Create time blocks in the planner and associate them with Business.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
