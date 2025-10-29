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
  ChevronDown,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";

const dojoModules = [
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
    title: "Disciplines",
    url: "/disciplines",
    icon: Award,
  },
  {
    title: "Body",
    url: "/body",
    icon: Dumbbell,
    subItems: [
      { title: "Workout", url: "/body/workout" },
      { title: "Intake", url: "/body/intake" },
      { title: "Sleep/Rest", url: "/body/sleep" },
      { title: "Hygiene", url: "/body/hygiene" },
    ],
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
    title: "Studies",
    url: "/studies",
    icon: GraduationCap,
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
            Dojo
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dojoModules.map((item) => {
                if (item.subItems) {
                  const isActive = location.startsWith(item.url);
                  return (
                    <Collapsible key={item.title} defaultOpen={isActive}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={isActive} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={location === subItem.url} data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, "-")}`}>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Summary
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/ultimate-test"} data-testid="link-ultimate-test">
                  <Link href="/ultimate-test">
                    <Trophy className="w-4 h-4" />
                    <span>Ultimate Test</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="link-settings">
                  <Link href="/settings">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
