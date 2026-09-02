import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, Database, Eye, Lock, LogOut, MonitorSmartphone, Moon, Shield, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const modules = [
  ["planner", "Daily Planner"], ["goals", "Goals"], ["second_brain", "Second Brain"],
  ["languages", "Languages"], ["studies", "Studies"], ["disciplines", "Disciplines"], ["body", "Body"],
] as const;

function SettingRow({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <Label className="text-sm font-medium text-[#18202a]">{title}</Label>
        {description ? <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Shield; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">{title}</h2>
      </div>
      <div className="divide-y rounded-[22px] border bg-card px-5">{children}</div>
    </section>
  );
}

export default function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dark, setDark] = useState(false);
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: privacy = [] } = useQuery<any[]>({ queryKey: ["/api/me/privacy"] });
  const { data: pageSettings = {} } = useQuery<Record<string, boolean>>({ queryKey: ["/api/page-settings"] });

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const privacyMutation = useMutation({
    mutationFn: (value: { module?: string; visibility?: string; globalPrivate?: boolean }) => apiRequest("PATCH", "/api/me/privacy", value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/privacy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
  const moduleMutation = useMutation({
    mutationFn: ({ module, enabled }: { module: string; enabled: boolean }) => apiRequest("PATCH", `/api/page-settings/${module}`, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/page-settings"] }),
  });
  const visibility = (module: string) => privacy.find((item) => item.module === module)?.visibility ?? "private";

  const setTheme = (enabled: boolean) => {
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
    localStorage.setItem("theme", enabled ? "dark" : "light");
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      navigate("/auth");
    } catch {
      toast({ title: "Could not sign out", variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">DojoOS</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-.04em] text-[#18202a]">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Control the app, your data and who can see what.</p>
        </header>

        <Tabs defaultValue="general" className="space-y-7">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
            {["general", "privacy", "modules", "notifications", "data"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-[#18202a] data-[state=active]:bg-transparent data-[state=active]:shadow-none">{tab}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="space-y-7">
            <Section title="Appearance" icon={Sun}>
              <SettingRow title="Dark mode" description="Use the dark appearance across every module.">
                <div className="flex items-center gap-3">{dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}<Switch checked={dark} onCheckedChange={setTheme} /></div>
              </SettingRow>
            </Section>
            <Section title="Devices" icon={MonitorSmartphone}>
              <SettingRow title="This browser" description="Active now · web session"><Button variant="outline" size="sm">Manage</Button></SettingRow>
              <SettingRow title="Device companion" description="Required later for system-level focus blocking."><Button variant="outline" size="sm" disabled>Not connected</Button></SettingRow>
            </Section>
            <Section title="Account" icon={Shield}>
              <SettingRow title={user?.email || user?.username || "Account"} description="Profile editing lives on your public profile—not inside app settings.">
                <Button variant="outline" size="sm" onClick={() => navigate(`/social/${user?.username}`)}>View profile</Button>
              </SettingRow>
              <SettingRow title="Sign out"><Button variant="destructive" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></SettingRow>
            </Section>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-7">
            <Section title="Profile access" icon={Lock}>
              <SettingRow title="Private account" description="Only approved followers can see your published widgets. Your name, username, photo and bio remain identifiable.">
                <Switch checked={Boolean(user?.isPrivate)} onCheckedChange={(checked) => privacyMutation.mutate({ globalPrivate: checked })} />
              </SettingRow>
            </Section>
            <Section title="Published information" icon={Eye}>
              {modules.map(([id, label]) => (
                <SettingRow key={id} title={label}>
                  <Select value={visibility(id)} onValueChange={(value) => privacyMutation.mutate({ module: id, visibility: value })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public"><span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" />Public</span></SelectItem>
                      <SelectItem value="followers"><span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />Followers</span></SelectItem>
                      <SelectItem value="private"><span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" />Only me</span></SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="modules">
            <Section title="Active modules" icon={Database}>
              {modules.map(([id, label]) => (
                <SettingRow key={id} title={label} description="Show this module in navigation and connected pickers.">
                  <Switch checked={pageSettings[id] !== false} onCheckedChange={(enabled) => moduleMutation.mutate({ module: id, enabled })} />
                </SettingRow>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="notifications">
            <Section title="Notifications" icon={Bell}>
              <SettingRow title="Planner reminders" description="Upcoming time blocks and changes."><Switch defaultChecked /></SettingRow>
              <SettingRow title="Goal check-ins" description="Intentional progress prompts, never generic streak pressure."><Switch defaultChecked /></SettingRow>
              <SettingRow title="Social activity" description="Follow requests and accountability decisions."><Switch defaultChecked /></SettingRow>
            </Section>
          </TabsContent>

          <TabsContent value="data">
            <Section title="Your data" icon={Database}>
              <SettingRow title="Export your data" description="Prepare a portable copy of your Dojo data."><Button variant="outline" size="sm">Request export</Button></SettingRow>
              <SettingRow title="Connected data sources" description="Review wearable and service connections."><Button variant="outline" size="sm" onClick={() => navigate("/body/connections")}>Open connections</Button></SettingRow>
              <SettingRow title="Delete account" description="Permanently remove the account and its data."><Button variant="destructive" size="sm">Delete…</Button></SettingRow>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
