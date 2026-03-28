import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LearningTrajectorySidebar } from "@/components/learning-trajectory-sidebar";
import { DualSidebarProvider, useDualSidebar } from "@/contexts/dual-sidebar-context";
import { Menu, BookOpen, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { SenseiChatSidebar } from "@/components/sensei-chat-sidebar";

import { ThemeProvider } from "@/contexts/theme-context";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Planner from "@/pages/planner";
import Goals from "@/pages/goals";
import SecondBrain from "@/pages/second-brain";
import Languages from "@/pages/languages";
import ThemeDetail from "@/pages/theme-detail";
import CourseDetail from "@/pages/course-detail";
import Disciplines from "@/pages/disciplines";
import DisciplineDetail from "@/pages/discipline-detail";
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
import ProfileView from "@/pages/social/profile-view";
import NoteEditPage from "@/pages/note-edit";
import ChapterNewPage from "@/pages/chapter-new";
import ThemeNewPage from "@/pages/theme-new";
import CourseNewPage from "@/pages/course-new";
import GoalNewPage from "@/pages/goal-new";
import NotFound from "@/pages/not-found";
import { ActiveWorkoutSession } from "@/components/body/active-workout-session";
import ActivityDrilldown from "@/pages/activity-drilldown";
import NutritionDrilldown from "@/pages/nutrition-drilldown";
import RestDrilldown from "@/pages/rest-drilldown";
import HygieneDrilldown from "@/pages/hygiene-drilldown";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  useEffect(() => {
    if (!isLoading && !user && location !== "/auth") {
      setLocation("/auth");
    }
  }, [isLoading, user, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Component {...rest} />
    </>
  );
}

const ProtectedHome = () => <ProtectedRoute component={Home} />;
const ProtectedPlanner = () => <ProtectedRoute component={Planner} />;
const ProtectedGoals = () => <ProtectedRoute component={Goals} />;
const ProtectedSecondBrain = () => <ProtectedRoute component={SecondBrain} />;
const ProtectedThemeDetail = () => <ProtectedRoute component={ThemeDetail} />;
const ProtectedLanguages = () => <ProtectedRoute component={Languages} />;
const ProtectedDisciplines = () => <ProtectedRoute component={Disciplines} />;
const ProtectedDisciplineDetail = () => <ProtectedRoute component={DisciplineDetail} />;
const ProtectedBody = () => <ProtectedRoute component={Body} />;
const ProtectedActivityDrilldown = () => <ProtectedRoute component={ActivityDrilldown} />;
const ProtectedNutritionDrilldown = () => <ProtectedRoute component={NutritionDrilldown} />;
const ProtectedRestDrilldown = () => <ProtectedRoute component={RestDrilldown} />;
const ProtectedHygieneDrilldown = () => <ProtectedRoute component={HygieneDrilldown} />;
const ProtectedWorship = () => <ProtectedRoute component={Worship} />;
const ProtectedFinances = () => <ProtectedRoute component={Finances} />;
const ProtectedMasterpieces = () => <ProtectedRoute component={Masterpieces} />;
const ProtectedPossessions = () => <ProtectedRoute component={Possessions} />;
const ProtectedStudies = () => <ProtectedRoute component={Studies} />;
const ProtectedCourseDetail = () => <ProtectedRoute component={CourseDetail} />;
const ProtectedBusiness = () => <ProtectedRoute component={Business} />;
const ProtectedWork = () => <ProtectedRoute component={Work} />;
const ProtectedSocialPurpose = () => <ProtectedRoute component={SocialPurpose} />;
const ProtectedUltimateTest = () => <ProtectedRoute component={UltimateTest} />;
const ProtectedProfile = () => <ProtectedRoute component={Profile} />;
const ProtectedProfileView = () => <ProtectedRoute component={ProfileView} />;

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={ProtectedHome} />
      <Route path="/planner" component={ProtectedPlanner} />
      <Route path="/goals" component={ProtectedGoals} />
      <Route path="/second-brain" component={ProtectedSecondBrain} />
      <Route path="/second-brain/:id" component={ProtectedThemeDetail} />
      <Route path="/languages" component={ProtectedLanguages} />
      <Route path="/languages/:id" component={ProtectedThemeDetail} />
      <Route path="/disciplines" component={ProtectedDisciplines} />
      <Route path="/disciplines/:id" component={ProtectedDisciplineDetail} />
      <Route path="/body" component={ProtectedBody} />
      <Route path="/body/activity/metric/:metricKey" component={ProtectedActivityDrilldown} />
      <Route path="/body/nutrition/metric/:metricKey" component={ProtectedNutritionDrilldown} />
      <Route path="/body/rest/metric/:metricKey" component={ProtectedRestDrilldown} />
      <Route path="/body/looks/metric/:metricKey" component={ProtectedHygieneDrilldown} />
      <Route path="/body/:subpage" component={ProtectedBody} />
      <Route path="/worship" component={ProtectedWorship} />
      <Route path="/finances" component={ProtectedFinances} />
      <Route path="/masterpieces" component={ProtectedMasterpieces} />
      <Route path="/possessions" component={ProtectedPossessions} />
      <Route path="/studies" component={ProtectedStudies} />
      <Route path="/studies/:id" component={ProtectedCourseDetail} />
      <Route path="/business" component={ProtectedBusiness} />
      <Route path="/work" component={ProtectedWork} />
      <Route path="/social-purpose" component={ProtectedSocialPurpose} />
      <Route path="/ultimate-test" component={ProtectedUltimateTest} />
      <Route path="/profile" component={ProtectedProfile} />
      <Route path="/social/:username" component={ProtectedProfileView} />
      <Route component={NotFound} />
    </Switch>
  );
}

const ProtectedLearnPage = () => <ProtectedRoute component={LearnPage} />;
const ProtectedFlashcardNewPage = () => <ProtectedRoute component={FlashcardNewPage} />;
const ProtectedFlashcardEditPage = () => <ProtectedRoute component={FlashcardEditPage} />;
const ProtectedFlashcardsListPage = () => <ProtectedRoute component={FlashcardsListPage} />;
const ProtectedMaterialNewPage = () => <ProtectedRoute component={MaterialNewPage} />;
const ProtectedNoteEditPage = () => <ProtectedRoute component={NoteEditPage} />;
const ProtectedChapterNewPage = () => <ProtectedRoute component={ChapterNewPage} />;
const ProtectedThemeNewPage = () => <ProtectedRoute component={ThemeNewPage} />;
const ProtectedCourseNewPage = () => <ProtectedRoute component={CourseNewPage} />;
const ProtectedGoalNewPage = () => <ProtectedRoute component={GoalNewPage} />;
const ProtectedActiveWorkoutSession = () => <ProtectedRoute component={ActiveWorkoutSession} />;

function FullScreenRouter() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/learn/:chapterId" component={ProtectedLearnPage} />
      <Route path="/flashcards/new/:chapterId" component={ProtectedFlashcardNewPage} />
      <Route path="/flashcards/edit/:id" component={ProtectedFlashcardEditPage} />
      <Route path="/flashcards/:chapterId" component={ProtectedFlashcardsListPage} />
      <Route path="/materials/new/:chapterId" component={ProtectedMaterialNewPage} />
      <Route path="/notes/new" component={ProtectedNoteEditPage} />
      <Route path="/notes/:id" component={ProtectedNoteEditPage} />
      <Route path="/chapters/new" component={ProtectedChapterNewPage} />
      <Route path="/themes/new/:type" component={ProtectedThemeNewPage} />
      <Route path="/courses/new" component={ProtectedCourseNewPage} />
      <Route path="/goals/new" component={ProtectedGoalNewPage} />
      <Route path="/body/activity/active/:id" component={ProtectedActiveWorkoutSession} />
    </Switch>
  );
}

function DualSidebarHeader() {
  const {
    isInSubModule,
    isMobile,
    mainSidebarOpen,
    trajectorySidebarOpen,
    hasTrajectorySidebar,
    chatSidebarOpen,
    setMainSidebarOpen,
    setTrajectorySidebarOpen,
    setChatSidebarOpen,
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

  const handleChatClick = () => {
    setChatSidebarOpen(!chatSidebarOpen);
  };

  return (
    <header className="border-b bg-background sticky top-0 z-40 shrink-0 md:h-16 h-auto px-4">
      <div className="flex items-center justify-between h-11 md:h-16">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMainNavClick}
            data-testid="button-sidebar-toggle"
            className={cn(mainSidebarOpen ? "bg-accent" : "", "h-10 w-10")}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {hasTrajectorySidebar && (
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
          {isInSubModule && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChatClick}
              data-testid="button-sensei-toggle"
              className={cn(
                "flex items-center gap-1.5 h-9 px-3",
                chatSidebarOpen ? "bg-accent" : ""
              )}
            >
              <Bot className="h-4 w-4" />
              <span className="text-sm">Sensei</span>
            </Button>
          )}
          <span className="md:text-sm text-base font-medium text-muted-foreground">
            DojoOS
          </span>
        </div>
      </div>
    </header>
  );
}

function MainLayout() {
  const [location] = useLocation();
  const isFullScreen = isFullScreenRoute(location);
  const [chatExpanded, setChatExpanded] = useState(false);

  const {
    isInSubModule,
    hasTrajectorySidebar,
    isMobile,
    isWideScreen,
    mainSidebarOpen,
    trajectorySidebarOpen,
    chatSidebarOpen,
    setChatSidebarOpen,
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

  const desktopShowTrajectory = hasTrajectorySidebar
    ? (chatSidebarOpen && !isWideScreen)
      ? false
      : (trajectorySidebarOpen || !mainSidebarOpen)
    : false;

  if (isFullScreen) {
    return (
      <SidebarProvider style={sidebarStyle as React.CSSProperties} defaultOpen={true}>
      <div className="flex h-[100dvh] w-full overflow-hidden">
          <FullScreenRouter />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={sidebarStyle as React.CSSProperties}
      defaultOpen={true}
      open={mainSidebarOpen}
      onOpenChange={setMainSidebarOpen}
    >
      <div className="fixed inset-0 flex overflow-hidden bg-background">
        {isMobile ? (
          <>
            <Sheet open={mainSidebarOpen} onOpenChange={setMainSidebarOpen}>
              <SheetContent side="left" className="p-0 w-80 bg-sidebar border-none shadow-none fixed inset-y-0 bottom-0 !important ring-0 focus:ring-0" aria-describedby={undefined}>
                <VisuallyHidden.Root>
                  <SheetTitle>Main Navigation</SheetTitle>
                </VisuallyHidden.Root>
                <div className="flex flex-col h-full w-full bg-sidebar">
                  <AppSidebar isMobileSheet />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={hasTrajectorySidebar && trajectorySidebarOpen} onOpenChange={setTrajectorySidebarOpen}>
              <SheetContent side="left" className="p-0 w-80 bg-sidebar border-none shadow-none fixed inset-y-0 bottom-0 !important ring-0 focus:ring-0" aria-describedby={undefined}>
                <VisuallyHidden.Root>
                  <SheetTitle>Learning Trajectory</SheetTitle>
                </VisuallyHidden.Root>
                <div className="flex flex-col h-full w-full bg-sidebar">
                  <LearningTrajectorySidebar isMobileSheet />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sensei chat bottom sheet (mobile) */}
            <Sheet
              open={isInSubModule && chatSidebarOpen}
              onOpenChange={(o) => {
                setChatSidebarOpen(o);
                if (!o) setChatExpanded(false);
              }}
            >
              <SheetContent
                side="bottom"
                className={cn(
                  "p-0 rounded-t-2xl border-t transition-[height] duration-300",
                  chatExpanded ? "h-[calc(100dvh-44px)]" : "h-[75dvh]"
                )}
                aria-describedby={undefined}
              >
                <VisuallyHidden.Root>
                  <SheetTitle>Sensei AI</SheetTitle>
                </VisuallyHidden.Root>
                <SenseiChatSidebar
                  onClose={() => { setChatSidebarOpen(false); setChatExpanded(false); }}
                  isMobileSheet
                  onExpand={(e) => setChatExpanded(e)}
                />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <>
            {/* Always render AppSidebar on desktop to allow CSS transitions */}
            <AppSidebar />
            {desktopShowTrajectory && (
              <div className="w-72 shrink-0 border-r h-full overflow-hidden">
                <LearningTrajectorySidebar />
              </div>
            )}
          </>
        )}

        <div className="flex flex-col flex-[1_0_480px] min-w-[480px] overflow-hidden">
          <DualSidebarHeader />
          <main className="flex-1 bg-background overflow-y-auto">
            <div className="pb-[env(safe-area-inset-bottom)]">
              <AuthenticatedRouter />
            </div>
          </main>
        </div>

        {/* Sensei chat right panel (desktop & tablet) */}
        {!isMobile && isInSubModule && chatSidebarOpen && (
          <div className="flex-[0_1_520px] min-w-[280px] border-l h-full overflow-hidden flex flex-col">
            <SenseiChatSidebar onClose={() => setChatSidebarOpen(false)} />
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}

const fullScreenPaths = [
  '/auth',
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
  '/body/activity/active/'
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
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
