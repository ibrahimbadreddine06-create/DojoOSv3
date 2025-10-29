import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star, FileText } from "lucide-react";

export default function Masterpieces() {
  const [selectedMasterpiece, setSelectedMasterpiece] = useState<string | null>(null);

  const { data: masterpieces, isLoading } = useQuery<any[]>({
    queryKey: ["/api/masterpieces"],
  });

  const { data: sections } = useQuery<any[]>({
    queryKey: ["/api/masterpieces", selectedMasterpiece, "sections"],
    enabled: !!selectedMasterpiece,
  });

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-masterpieces-title">
              Masterpieces
            </h1>
            <p className="text-muted-foreground">
              Large projects and creative works you care about
            </p>
          </div>
          <Button size="sm" data-testid="button-add-masterpiece">
            <Plus className="w-4 h-4 mr-2" />
            Add Masterpiece
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : masterpieces && masterpieces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {masterpieces.map((masterpiece) => (
              <Card
                key={masterpiece.id}
                className="hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => setSelectedMasterpiece(masterpiece.id)}
                data-testid={`card-masterpiece-${masterpiece.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{masterpiece.title}</CardTitle>
                      {masterpiece.description && (
                        <CardDescription className="text-sm line-clamp-3">
                          {masterpiece.description}
                        </CardDescription>
                      )}
                    </div>
                    <Star className="w-5 h-5 text-chart-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {masterpiece.sectionsCount || 0} sections
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No masterpieces yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first large project or creative work
            </p>
            <Button data-testid="button-create-masterpiece">
              Create Masterpiece
            </Button>
          </div>
        )}

        {selectedMasterpiece && sections && (
          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
              <CardDescription>Organize your masterpiece into sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.length > 0 ? (
                sections.map((section) => (
                  <Card key={section.id} data-testid={`card-section-${section.id}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      {section.content && (
                        <CardDescription className="text-sm line-clamp-2">
                          {section.content}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sections yet. Add your first section to get started.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
