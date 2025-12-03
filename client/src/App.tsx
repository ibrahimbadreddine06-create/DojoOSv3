import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LearningTrajectorySidebar } from "@/components/learning-trajectory-sidebar";
import { DualSidebarProvider, useDualSidebar } from "@/contexts/dual-sidebar-context";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Menu, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Planner from "@/pages/planner";
import Goals from "@/pages/goals";
import SecondBrain from "@/pages/second-brain";
import Languages from "@/pages/languages";
import ThemeDetail from "@/pages/theme-detail";
import CourseDetail from "@/pages/course-detail";
import Disciplines from "@/pages/disciplines";
import Body from "@/pages/body";
import Worship from "@/pages/worship";
import Finances from "@/pages/finances";
import Masterpieces from "@/pages/masterpieces";
import Possessions from "@/pages/possessions";
import Studies from "@/pages/studies";
import Business from "@/pages/business";
import Work from "@/pages/work";
import SocialPurpose from "@/pages/social-purpose";
import UltimateTest from "@/pages/ultimate-test";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/planner" component={Planner} />
      <Route path="/goals" component={Goals} />
      <Route path="/second-brain" component={SecondBrain} />
      <Route path="/second-brain/:id" component={ThemeDetail} />
      <Route path="/languages" component={Languages} />
      <Route path="/languages/:id" component={ThemeDetail} />
      <Route path="/disciplines" component={Disciplines} />
      <Route path="/body" component={Body} />
      <Route path="/body/:subpage" component={Body} />
      <Route path="/worship" component={Worship} />
      <Route path="/finances" component={Finances} />
      <Route path="/masterpieces" component={Masterpieces} />
      <Route path="/possessions" component={Possessions} />
      <Route path="/studies" component={Studies} />
      <Route path="/studies/:id" component={CourseDetail} />
      <Route path="/business" component={Business} />
      <Route path="/work" component={Work} />
      <Route path="/social-purpose" component={SocialPurpose} />
      <Route path="/ultimate-test" component={UltimateTest} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route component={Landing} />
    </Switch>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function DualSidebarHeader() {
  const { toggleSidebar } = useSidebar();
  const { 
    isInSubModule, 
    isMobile, 
    activeSidebar,
    toggleMainSidebar, 
    toggleTrajectorySidebar,
    mainSidebarOpen,
    trajectorySidebarOpen
  } = useDualSidebar();

  const handleMainNavClick = () => {
    if (isMobile) {
      toggleSidebar();
    } else {
      toggleMainSidebar();
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMainNavClick}
          data-testid="button-sidebar-toggle"
          className={!isInSubModule || (activeSidebar === "main" && mainSidebarOpen) ? "bg-accent" : ""}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {isInSubModule && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTrajectorySidebar}
            data-testid="button-trajectory-toggle"
            className={activeSidebar === "trajectory" && trajectorySidebarOpen ? "bg-accent" : ""}
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Dojo OS
        </span>
      </div>
    </header>
  );
}

function MainLayout() {
  const { isInSubModule, mainSidebarOpen, isMobile, activeSidebar } = useDualSidebar();
  
  const showMainSidebar = !isInSubModule || (mainSidebarOpen && activeSidebar === "main");

  return (
    <div className="flex h-screen w-full">
      {showMainSidebar && !isMobile && <AppSidebar />}
      <LearningTrajectorySidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <DualSidebarHeader />
        <main className="flex-1 bg-background overflow-y-auto">
          <AuthenticatedRouter />
        </main>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <DualSidebarProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <MainLayout />
      </SidebarProvider>
    </DualSidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <UnauthenticatedRouter />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
