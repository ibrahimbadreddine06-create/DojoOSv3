import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, User, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const subAreas = [
  { id: "helping", label: "Helping", icon: Heart },
  { id: "networking", label: "Networking & Community", icon: Users },
  { id: "charity", label: "Charity & Volunteering", icon: Heart },
  { id: "legacy", label: "Legacy & Leadership", icon: Users },
  { id: "pride", label: "Bringing Pride", icon: Heart },
];

export default function SocialPurpose() {
  const [selectedSubArea, setSelectedSubArea] = useState<string | null>(null);

  const { data: activities, isLoading } = useQuery<any[]>({
    queryKey: ["/api/social-activities"],
  });

  const { data: people } = useQuery<any[]>({
    queryKey: ["/api/people"],
  });

  const activitiesBySubArea = selectedSubArea
    ? activities?.filter(a => a.subArea === selectedSubArea)
    : activities;

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-social-purpose-title">
              Social Purpose
            </h1>
            <p className="text-muted-foreground">
              Track social impact activities and relationships
            </p>
          </div>
          <Button size="sm" data-testid="button-add-activity">
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {subAreas.map((area) => {
            const count = activities?.filter(a => a.subArea === area.id).length || 0;
            const Icon = area.icon;
            return (
              <Card
                key={area.id}
                className={`hover-elevate active-elevate-2 cursor-pointer ${
                  selectedSubArea === area.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSubArea(selectedSubArea === area.id ? null : area.id)}
                data-testid={`card-subarea-${area.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col items-center text-center gap-2">
                    <Icon className="w-5 h-5 text-chart-1" />
                    <CardTitle className="text-sm">{area.label}</CardTitle>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="activities">
          <TabsList>
            <TabsTrigger value="activities" data-testid="tab-activities">
              Activities
            </TabsTrigger>
            <TabsTrigger value="people" data-testid="tab-people">
              People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-3 mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : activitiesBySubArea && activitiesBySubArea.length > 0 ? (
              activitiesBySubArea.map((activity) => (
                <Card key={activity.id} data-testid={`card-activity-${activity.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{activity.title}</CardTitle>
                          <Badge variant="secondary">
                            {subAreas.find(a => a.id === activity.subArea)?.label}
                          </Badge>
                        </div>
                        {activity.description && (
                          <CardDescription className="text-sm">
                            {activity.description}
                          </CardDescription>
                        )}
                        {activity.date && (
                          <CardDescription className="text-sm">
                            {activity.date}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={activity.completed ? "default" : "outline"}>
                        {activity.completed ? "Completed" : "Planned"}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No activities yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your social purpose activities
                </p>
                <Button data-testid="button-create-activity">
                  Add Activity
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="space-y-3 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">People Database</h2>
              <Button size="sm" data-testid="button-add-person">
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </div>

            {people && people.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {people.map((person) => (
                  <Card key={person.id} data-testid={`card-person-${person.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{person.name}</CardTitle>
                          {person.relationship && (
                            <CardDescription className="text-sm">
                              {person.relationship}
                            </CardDescription>
                          )}
                          {person.lastContact && (
                            <CardDescription className="text-sm">
                              Last contact: {person.lastContact}
                            </CardDescription>
                          )}
                        </div>
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    {person.notes && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {person.notes}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No people yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Build your network database
                </p>
                <Button data-testid="button-create-person">
                  Add Person
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
