import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, BookOpen, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function Worship() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: salahLogs } = useQuery<any[]>({
    queryKey: ["/api/salah-logs", dateStr],
  });

  const { data: quranLogs } = useQuery<any[]>({
    queryKey: ["/api/quran-logs", dateStr],
  });

  const { data: dhikrLogs } = useQuery<any[]>({
    queryKey: ["/api/dhikr-logs", dateStr],
  });

  const { data: duaLogs } = useQuery<any[]>({
    queryKey: ["/api/dua-logs", dateStr],
  });

  const salahStatusColors = {
    on_time: "default",
    late: "secondary",
    makeup: "outline",
    missed: "destructive",
  };

  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-worship-title">
              Worship
            </h1>
            <p className="text-muted-foreground">
              Track Salah, Quran reading, Dhikr, and Du'a
            </p>
          </div>
        </div>

        <Tabs defaultValue="salah">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="salah" data-testid="tab-salah">
              Salah
            </TabsTrigger>
            <TabsTrigger value="quran" data-testid="tab-quran">
              Quran
            </TabsTrigger>
            <TabsTrigger value="dhikr" data-testid="tab-dhikr">
              Dhikr
            </TabsTrigger>
            <TabsTrigger value="dua" data-testid="tab-dua">
              Du'a
            </TabsTrigger>
          </TabsList>

          <TabsContent value="salah" className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Daily Prayers</h2>
              <Button size="sm" data-testid="button-add-salah">
                <Plus className="w-4 h-4 mr-2" />
                Log Salah
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {prayers.map((prayer) => {
                const log = salahLogs?.find(s => s.prayer === prayer);
                return (
                  <Card key={prayer} data-testid={`card-prayer-${prayer.toLowerCase()}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{prayer}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {log ? (
                        <Badge variant={salahStatusColors[log.status as keyof typeof salahStatusColors]}>
                          {log.status.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not logged</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Salah Completion Over Time</CardTitle>
                <CardDescription>Track obligatory vs voluntary prayers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart will be implemented in integration phase
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quran" className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Quran Reading</h2>
              <Button size="sm" data-testid="button-add-quran">
                <Plus className="w-4 h-4 mr-2" />
                Log Reading
              </Button>
            </div>

            {quranLogs && quranLogs.length > 0 ? (
              <div className="space-y-3">
                {quranLogs.map((log) => (
                  <Card key={log.id} data-testid={`card-quran-${log.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {format(new Date(log.date), "MMMM d, yyyy")}
                        </CardTitle>
                        <div className="flex items-center gap-4 font-mono text-sm">
                          {log.pages && <span>{log.pages} pages</span>}
                          {log.minutes && <span>{log.minutes} min</span>}
                        </div>
                      </div>
                      {log.notes && (
                        <CardDescription className="text-sm mt-2">
                          {log.notes}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Quran reading logged</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your Quran reading progress
                </p>
                <Button data-testid="button-create-quran">
                  Log Reading
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dhikr" className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Dhikr</h2>
              <Button size="sm" data-testid="button-add-dhikr">
                <Plus className="w-4 h-4 mr-2" />
                Log Dhikr
              </Button>
            </div>

            {dhikrLogs && dhikrLogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dhikrLogs.map((log) => (
                  <Card key={log.id} data-testid={`card-dhikr-${log.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{log.type}</CardTitle>
                        <span className="font-mono font-semibold text-lg">
                          {log.count}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Dhikr logged</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Track your daily remembrance
                </p>
                <Button data-testid="button-create-dhikr">
                  Log Dhikr
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dua" className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Du'a</h2>
              <Button size="sm" data-testid="button-add-dua">
                <Plus className="w-4 h-4 mr-2" />
                Log Du'a
              </Button>
            </div>

            {duaLogs && duaLogs.length > 0 ? (
              <div className="space-y-3">
                {duaLogs.map((log) => (
                  <Card key={log.id} data-testid={`card-dua-${log.id}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-normal text-muted-foreground">
                        {format(new Date(log.date), "MMMM d, yyyy")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base">{log.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Du'a logged</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Record your personal supplications
                </p>
                <Button data-testid="button-create-dua">
                  Log Du'a
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
