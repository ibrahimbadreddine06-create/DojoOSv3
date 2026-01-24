import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LearningTrajectorySidebar } from "@/components/learning-trajectory-sidebar";
import { DualSidebarProvider, useDualSidebar } from "@/contexts/dual-sidebar-context";
import { Menu, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

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
import LearnPage from "@/pages/learn";
import FlashcardNewPage from "@/pages/flashcard-new";
import FlashcardEditPage from "@/pages/flashcard-edit";
import FlashcardsListPage from "@/pages/flashcards-list";
import MaterialNewPage from "@/pages/material-new";
import NoteEditPage from "@/pages/note-edit";
import ChapterNewPage from "@/pages/chapter-new";
import ThemeNewPage from "@/pages/theme-new";
import CourseNewPage from "@/pages/course-new";
import GoalNewPage from "@/pages/goal-new";
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

function FullScreenRouter() {
  return (
    <Switch>
      <Route path="/learn/:chapterId" component={LearnPage} />
      <Route path="/flashcards/new/:chapterId" component={FlashcardNewPage} />
      <Route path="/flashcards/edit/:id" component={FlashcardEditPage} />
      <Route path="/flashcards/:chapterId" component={FlashcardsListPage} />
      <Route path="/materials/new/:chapterId" component={MaterialNewPage} />
      <Route path="/notes/new" component={NoteEditPage} />
      <Route path="/notes/:id" component={NoteEditPage} />
      <Route path="/chapters/new" component={ChapterNewPage} />
      <Route path="/themes/new/:type" component={ThemeNewPage} />
      <Route path="/courses/new" component={CourseNewPage} />
      <Route path="/goals/new" component={GoalNewPage} />
    </Switch>
  );
}


function DualSidebarHeader() {
  const { 
    isInSubModule, 
    isMobile, 
    mainSidebarOpen,
    trajectorySidebarOpen,
    setMainSidebarOpen,
    setTrajectorySidebarOpen,
  } = useDualSidebar();

  const handleMainNavClick = () => {
    if (mainSidebarOpen) {
      setMainSidebarOpen(false);
    } else {
      setTrajectorySidebarOpen(false);
      setMainSidebarOpen(true);
    }
  };

  const handleTrajectoryClick = () => {
    if (trajectorySidebarOpen) {
      setTrajectorySidebarOpen(false);
    } else {
      setMainSidebarOpen(false);
      setTrajectorySidebarOpen(true);
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMainNavClick}
          data-testid="button-sidebar-toggle"
          className={mainSidebarOpen ? "bg-accent" : ""}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {isInSubModule && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTrajectoryClick}
            data-testid="button-trajectory-toggle"
            className={trajectorySidebarOpen ? "bg-accent" : ""}
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
  const [location] = useLocation();
  const isFullScreen = isFullScreenRoute(location);
  
  const { 
    isInSubModule, 
    isMobile, 
    mainSidebarOpen,
    trajectorySidebarOpen,
    setMainSidebarOpen,
    setTrajectorySidebarOpen,
  } = useDualSidebar();

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const desktopShowMainNav = !isInSubModule 
    ? mainSidebarOpen 
    : mainSidebarOpen && !trajectorySidebarOpen;
  
  const desktopShowTrajectory = isInSubModule 
    ? (trajectorySidebarOpen || !mainSidebarOpen)
    : false;

  if (isFullScreen) {
    return (
      <SidebarProvider style={sidebarStyle as React.CSSProperties} defaultOpen={true}>
        <div className="flex h-screen w-full">
          <FullScreenRouter />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties} defaultOpen={true}>
      <div className="flex h-screen w-full">
        {isMobile ? (
          <>
            <Sheet open={mainSidebarOpen} onOpenChange={setMainSidebarOpen}>
              <SheetContent side="left" className="p-0 w-80" aria-describedby={undefined}>
                <VisuallyHidden.Root>
                  <SheetTitle>Main Navigation</SheetTitle>
                </VisuallyHidden.Root>
                <AppSidebar isMobileSheet />
              </SheetContent>
            </Sheet>
            
            <Sheet open={trajectorySidebarOpen} onOpenChange={setTrajectorySidebarOpen}>
              <SheetContent side="left" className="p-0 w-80" aria-describedby={undefined}>
                <VisuallyHidden.Root>
                  <SheetTitle>Learning Trajectory</SheetTitle>
                </VisuallyHidden.Root>
                <LearningTrajectorySidebar isMobileSheet />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <>
            {desktopShowMainNav && <AppSidebar />}
            {desktopShowTrajectory && <LearningTrajectorySidebar />}
          </>
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <DualSidebarHeader />
          <main className="flex-1 bg-background overflow-y-auto">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const fullScreenPaths = [
  '/learn/',
  '/flashcards/new/',
  '/flashcards/edit/',
  '/flashcards/',
  '/materials/new/',
  '/notes/new',
  '/notes/',
  '/chapters/new',
  '/themes/new/',
  '/courses/new',
  '/goals/new',
];

function isFullScreenRoute(path: string): boolean {
  return fullScreenPaths.some(p => path.startsWith(p));
}

function AuthenticatedApp() {
  return (
    <DualSidebarProvider>
      <MainLayout />
    </DualSidebarProvider>
  );
}

function AppContent() {
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
