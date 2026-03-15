import {
  Calendar,
  Target,
  Brain,
  Languages,
  Award,
  Dumbbell,
  Heart,
  DollarSign,
  Star,
  Home as HomeIcon,
  GraduationCap,
  Briefcase,
  Users,
  Trophy,
  Lock,
  Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserSearchDialog } from "@/components/social/user-search-dialog";
import { Link, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useTheme } from "@/contexts/theme-context";
import { useQuery } from "@tanstack/react-query";

const activeModules = [
  {
    title: "Daily Planner",
    url: "/planner",
    icon: Calendar,
  },
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
  },
  {
    title: "Second Brain",
    url: "/second-brain",
    icon: Brain,
  },
  {
    title: "Languages",
    url: "/languages",
    icon: Languages,
  },
  {
    title: "Studies",
    url: "/studies",
    icon: GraduationCap,
  },
  {
    title: "Body",
    url: "/body",
    icon: Dumbbell,
  },
  {
    title: "Disciplines",
    url: "/disciplines",
    icon: Award,
  },
];

const lockedModules = [
  {
    title: "Possessions",
    url: "/possessions",
    icon: HomeIcon,
  },
  {
    title: "Worship",
    url: "/worship",
    icon: Heart,
  },
  {
    title: "Finances",
    url: "/finances",
    icon: DollarSign,
  },
  {
    title: "Masterpieces",
    url: "/masterpieces",
    icon: Star,
  },
  {
    title: "Business",
    url: "/business",
    icon: Briefcase,
  },
  {
    title: "Work",
    url: "/work",
    icon: Briefcase,
  },
  {
    title: "Social Purpose",
    url: "/social",
    icon: Users,
  },
  {
    title: "Ultimate Test",
    url: "/ultimate-test",
    icon: Trophy,
  },
];

interface AppSidebarProps {
  isMobileSheet?: boolean;
}

export function AppSidebar({ isMobileSheet = false }: AppSidebarProps) {
  const [location] = useLocation();
  const { setOpen, state } = useSidebar();
  const { getModuleTheme } = useTheme();

  // THEME LOGIC ONLY
  useEffect(() => {
    // Apply Module Theme
    const root = document.documentElement;
    let themeFound = false;

    // Check if current route matches a known module
    // We check against known prefixes from routes or just ask context
    for (const mod of activeModules) {
      if (location.startsWith(mod.url)) {
        const theme = getModuleTheme(mod.url);
        if (theme.cssVar) {
          root.style.setProperty('--primary', theme.cssVar);
          themeFound = true;
        }
        break;
      }
    }

    // Reset to default if not in a module
    if (!themeFound) {
      root.style.removeProperty('--primary');
    }

  }, [location, getModuleTheme]);

  const menuItemClass = (isActive: boolean, moduleUrl?: string) => {
    // For custom colors, we can't rely on template literals for hover classes if they are dynamic/arbitrary.
    // However, we are using a preset list in Context, so classes ARE safe, but just to be robust we can use style.
    return `group/item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50 ${isActive ? "bg-accent font-medium" : "text-muted-foreground"}`;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:pt-0 bg-sidebar">
      <div className="flex flex-col gap-1.5 p-2 pt-1 md:pt-2">
        <div className="md:text-xs text-sm font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">
          DojoOS
        </div>
        <div className="flex flex-col gap-0.5">
          <Link
            href="/"
            className={menuItemClass(location === "/")}
            data-testid="link-home"
          >
            <HomeIcon className="w-4 h-4 group-hover/item:text-foreground transition-colors" />
            <span>Home</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          Core Modules
        </div>
        <div className="flex flex-col gap-0.5">
          {activeModules.map((item) => {
            const theme = getModuleTheme(item.url);
            const isActive = location.startsWith(item.url);

            // Define CSS variable for the theme color
            const style = {
              "--theme-color": theme.cssVar ? `hsl(${theme.cssVar})` : undefined
            } as React.CSSProperties;

            return (
              <Link
                key={item.title}
                href={item.url}
                className={menuItemClass(location.startsWith(item.url), item.url)}
                data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <item.icon
                  className="w-4 h-4 transition-colors group-hover/item:text-[var(--theme-color)]"
                  style={style}
                />
                <span
                  className="group-hover/item:text-[var(--theme-color)] transition-colors"
                  style={style}
                >
                  {item.title}
                </span>
              </Link>
            )
          })}
        </div>
      </div>



      <div className="flex flex-col gap-2 p-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          Coming Soon
        </div>
        <div className="flex flex-col gap-0.5">
          {lockedModules.map((item) => (
            <div
              key={item.title}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-not-allowed opacity-50"
              data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              aria-disabled="true"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
              <Lock className="w-3 h-3 ml-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2 mt-auto">
        <UserSearchDialog />
        <div className="flex flex-col gap-0.5">
          <ProfileMenuItemSimple />
        </div>
      </div>
    </div>
  );

  if (isMobileSheet) {
    return (
      <ScrollArea className="h-full bg-sidebar text-sidebar-foreground">
        {sidebarContent}
      </ScrollArea>
    );
  }

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            DojoOS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"} data-testid="link-home">
                  <Link href="/">
                    <HomeIcon className="w-4 h-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Core Modules
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeModules.map((item) => {
                const theme = getModuleTheme(item.url);
                const isActive = location.startsWith(item.url);
                const style = {
                  "--theme-color": theme.cssVar ? `hsl(${theme.cssVar})` : undefined
                } as React.CSSProperties;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`group/item`}
                    >
                      <Link href={item.url}>
                        <item.icon
                          className={`w-4 h-4 transition-colors group-hover/item:text-[var(--theme-color)] ${isActive ? "text-[var(--theme-color)]" : ""}`}
                          style={style}
                        />
                        <span
                          className="group-hover/item:text-[var(--theme-color)] transition-colors"
                          style={style}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>



        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Coming Soon
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lockedModules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="cursor-not-allowed opacity-50 hover:bg-transparent"
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    aria-disabled="true"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    <Lock className="w-3 h-3 ml-auto" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-2 pb-2">
              <UserSearchDialog />
            </div>
            <SidebarMenu>
              <UserProfileSection />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function ProfileMenuItemSimple() {
  const [location] = useLocation();
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });

  if (!user) return null;

  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/profile"
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${location === "/profile" ? "bg-accent" : ""}`}
        data-testid="link-profile"
      >
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span>Settings</span>
      </Link>
      
      <Link
        href={`/social/${user.username}`}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${location.startsWith("/social/") ? "bg-accent" : ""}`}
        data-testid="link-public-profile-mobile"
      >
        <Avatar className="h-5 w-5">
          <AvatarImage src={user.profileImageUrl} />
          <AvatarFallback className="text-xs">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span>Public Profile</span>
      </Link>
    </div>
  );
}

function UserProfileSection() {
  const [location] = useLocation();
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });

  if (!user) return null;

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={location === "/profile"} data-testid="link-settings">
          <Link href="/profile">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={location.startsWith("/social/")} data-testid="link-public-profile">
          <Link href={`/social/${user.username}`}>
            <Avatar className="h-5 w-5">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="text-xs">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>Public Profile</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}
