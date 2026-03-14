import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, HelpCircle, Shield, ExternalLink, LogOut, Eye, Users, Lock } from "lucide-react";
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Profile() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: privacySettings } = useQuery<any[]>({ queryKey: ["/api/me/privacy"] });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      setLocation("/auth");
    } catch (error) {
      toast({
        title: "Logout failed",
        variant: "destructive"
      });
    }
  };

  const privacyMutation = useMutation({
    mutationFn: async (data: { module?: string, visibility?: string, globalPrivate?: boolean }) => {
      await apiRequest("PATCH", "/api/me/privacy", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/privacy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Privacy settings updated" });
    }
  });

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const getModuleVisibility = (module: string) => {
    const setting = privacySettings?.find(s => s.module === module);
    return setting?.visibility || "private";
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold" data-testid="text-profile-title">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-muted/50 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="font-bold text-primary">
                  {user?.username?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-medium leading-none">{user?.username}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Authenticated User</span>
                  <span>•</span>
                  <a href={`/social/${user?.username}`} className="text-primary hover:underline">View Public Profile</a>
                </div>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Visibility</CardTitle>
          <CardDescription>Control who can see your Dojo modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Private Account</Label>
              <p className="text-xs text-muted-foreground">Only followers can see your profile details</p>
            </div>
            <Switch
              checked={user?.isPrivate}
              onCheckedChange={(checked) => privacyMutation.mutate({ globalPrivate: checked })}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Module Visibility</h4>
            {["goals", "body", "finances", "studies", "possessions"].map(module => (
              <div key={module} className="flex items-center justify-between">
                <Label className="capitalize">{module}</Label>
                <Select
                  value={getModuleVisibility(module)}
                  onValueChange={(val) => privacyMutation.mutate({ module, visibility: val })}
                >
                  <SelectTrigger className="w-[130px] sm:w-[140px] h-8 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public"><div className="flex items-center"><Eye className="w-3 h-3 mr-2" /> Public</div></SelectItem>
                    <SelectItem value="followers"><div className="flex items-center"><Users className="w-3 h-3 mr-2" /> Followers</div></SelectItem>
                    <SelectItem value="private"><div className="flex items-center"><Lock className="w-3 h-3 mr-2" /> Private</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how DojoOS looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <Label htmlFor="dark-mode">Dark Mode</Label>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Help & Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <HelpCircle className="h-4 w-4" />
            Help Center
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Shield className="h-4 w-4" />
            Privacy Policy
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

