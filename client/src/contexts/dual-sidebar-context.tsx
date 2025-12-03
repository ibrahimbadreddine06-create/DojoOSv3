import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";

type SidebarMode = "main" | "trajectory";

interface SubModuleInfo {
  type: "second-brain" | "languages" | "studies";
  id: string;
  backPath: string;
}

interface LearningTrajectoryData {
  topicId?: string;
  courseId?: string;
  selectedChapterId: string | null;
  onSelectChapter: (id: string | null) => void;
}

interface DualSidebarContextType {
  activeSidebar: SidebarMode;
  isInSubModule: boolean;
  subModuleInfo: SubModuleInfo | null;
  isMobile: boolean;
  mainSidebarOpen: boolean;
  trajectorySidebarOpen: boolean;
  learningData: LearningTrajectoryData | null;
  
  toggleMainSidebar: () => void;
  toggleTrajectorySidebar: () => void;
  closeAllSidebars: () => void;
  setLearningData: (data: LearningTrajectoryData | null) => void;
  switchToMainNav: () => void;
  switchToTrajectory: () => void;
}

const DualSidebarContext = createContext<DualSidebarContextType | null>(null);

export function useDualSidebar() {
  const context = useContext(DualSidebarContext);
  if (!context) {
    throw new Error("useDualSidebar must be used within DualSidebarProvider");
  }
  return context;
}

interface DualSidebarProviderProps {
  children: ReactNode;
}

export function DualSidebarProvider({ children }: DualSidebarProviderProps) {
  const [location] = useLocation();
  const [activeSidebar, setActiveSidebar] = useState<SidebarMode>("main");
  const [mainSidebarOpen, setMainSidebarOpen] = useState(false);
  const [trajectorySidebarOpen, setTrajectorySidebarOpen] = useState(false);
  const [learningData, setLearningData] = useState<LearningTrajectoryData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const subModuleInfo = useMemo<SubModuleInfo | null>(() => {
    const secondBrainMatch = location.match(/^\/second-brain\/([^/]+)$/);
    if (secondBrainMatch) {
      return { type: "second-brain", id: secondBrainMatch[1], backPath: "/second-brain" };
    }
    const languagesMatch = location.match(/^\/languages\/([^/]+)$/);
    if (languagesMatch) {
      return { type: "languages", id: languagesMatch[1], backPath: "/languages" };
    }
    const studiesMatch = location.match(/^\/studies\/([^/]+)$/);
    if (studiesMatch) {
      return { type: "studies", id: studiesMatch[1], backPath: "/studies" };
    }
    return null;
  }, [location]);

  const isInSubModule = !!subModuleInfo;

  useEffect(() => {
    if (isInSubModule) {
      setActiveSidebar("trajectory");
      if (!isMobile) {
        setTrajectorySidebarOpen(true);
        setMainSidebarOpen(false);
      } else {
        setTrajectorySidebarOpen(false);
        setMainSidebarOpen(false);
      }
    } else {
      setActiveSidebar("main");
      setTrajectorySidebarOpen(false);
      setLearningData(null);
    }
  }, [isInSubModule, isMobile]);

  const toggleMainSidebar = useCallback(() => {
    if (isMobile) {
      setMainSidebarOpen(prev => {
        if (!prev) setTrajectorySidebarOpen(false);
        return !prev;
      });
    } else {
      setActiveSidebar("main");
      setMainSidebarOpen(true);
      setTrajectorySidebarOpen(false);
    }
  }, [isMobile]);

  const toggleTrajectorySidebar = useCallback(() => {
    if (isMobile) {
      setTrajectorySidebarOpen(prev => {
        if (!prev) setMainSidebarOpen(false);
        return !prev;
      });
    } else {
      setActiveSidebar("trajectory");
      setTrajectorySidebarOpen(true);
      setMainSidebarOpen(false);
    }
  }, [isMobile]);

  const closeAllSidebars = useCallback(() => {
    setMainSidebarOpen(false);
    setTrajectorySidebarOpen(false);
  }, []);

  const switchToMainNav = useCallback(() => {
    setActiveSidebar("main");
    if (isMobile) {
      setMainSidebarOpen(true);
      setTrajectorySidebarOpen(false);
    } else {
      setMainSidebarOpen(true);
      setTrajectorySidebarOpen(false);
    }
  }, [isMobile]);

  const switchToTrajectory = useCallback(() => {
    if (!isInSubModule) return;
    setActiveSidebar("trajectory");
    if (isMobile) {
      setTrajectorySidebarOpen(true);
      setMainSidebarOpen(false);
    } else {
      setTrajectorySidebarOpen(true);
      setMainSidebarOpen(false);
    }
  }, [isMobile, isInSubModule]);

  const value: DualSidebarContextType = {
    activeSidebar,
    isInSubModule,
    subModuleInfo,
    isMobile,
    mainSidebarOpen,
    trajectorySidebarOpen,
    learningData,
    toggleMainSidebar,
    toggleTrajectorySidebar,
    closeAllSidebars,
    setLearningData,
    switchToMainNav,
    switchToTrajectory,
  };

  return (
    <DualSidebarContext.Provider value={value}>
      {children}
    </DualSidebarContext.Provider>
  );
}
