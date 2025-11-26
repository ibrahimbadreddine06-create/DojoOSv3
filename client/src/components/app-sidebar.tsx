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
import { useAuth } from "@/hooks/useAuth";
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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

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

export function AppSidebar() {
  const [location] = useLocation();

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

function ProfileMenuItem() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const initials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
    : '?';
  
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Profile';

  return (
    <SidebarMenuButton asChild isActive={location === "/profile"} data-testid="link-profile">
      <Link href="/profile">
        <Avatar className="h-5 w-5">
          <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span>{displayName}</span>
      </Link>
    </SidebarMenuButton>
  );
}
