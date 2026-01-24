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
  Lock
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";

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
];

const lockedModules = [
  {
    title: "Body",
    url: "/body",
    icon: Dumbbell,
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
    title: "Possessions",
    url: "/possessions",
    icon: HomeIcon,
  },
  {
    title: "Disciplines",
    url: "/disciplines",
    icon: Award,
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
    url: "/social-purpose",
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

  const menuItemClass = (isActive: boolean) => 
    `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${isActive ? "bg-accent" : ""}`;

  const sidebarContent = (
    <>
      <div className="flex flex-col gap-2 p-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          Dojo OS
        </div>
        <div className="flex flex-col gap-0.5">
          <Link 
            href="/"
            className={menuItemClass(location === "/")}
            data-testid="link-home"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          Core Modules
        </div>
        <div className="flex flex-col gap-0.5">
          {activeModules.map((item) => (
            <Link 
              key={item.title} 
              href={item.url}
              className={menuItemClass(location === item.url)}
              data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
            </Link>
          ))}
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
        <div className="flex flex-col gap-0.5">
          <ProfileMenuItemSimple />
        </div>
      </div>
    </>
  );

  if (isMobileSheet) {
    return (
      <ScrollArea className="h-full bg-sidebar text-sidebar-foreground">
        <div className="flex flex-col h-full">
          {sidebarContent}
        </div>
      </ScrollArea>
    );
  }

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Dojo OS
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
              {activeModules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
            <SidebarMenu>
              <SidebarMenuItem>
                <ProfileMenuItem />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function ProfileMenuItemSimple() {
  const [location] = useLocation();

  return (
    <Link 
      href="/profile"
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${location === "/profile" ? "bg-accent" : ""}`}
      data-testid="link-profile"
    >
      <Avatar className="h-5 w-5">
        <AvatarFallback className="text-xs">U</AvatarFallback>
      </Avatar>
      <span>Settings</span>
    </Link>
  );
}

function ProfileMenuItem() {
  const [location] = useLocation();

  return (
    <SidebarMenuButton asChild isActive={location === "/profile"} data-testid="link-profile">
      <Link href="/profile">
        <Avatar className="h-5 w-5">
          <AvatarFallback className="text-xs">U</AvatarFallback>
        </Avatar>
        <span>Settings</span>
      </Link>
    </SidebarMenuButton>
  );
}
