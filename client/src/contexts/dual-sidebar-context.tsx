// @refresh reset
import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";

interface SubModuleInfo {
  type: "second-brain" | "languages" | "studies" | "body" | "disciplines";
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
  isInSubModule: boolean;
  hasTrajectorySidebar: boolean;
  subModuleInfo: SubModuleInfo | null;
  isMobile: boolean;
  mainSidebarOpen: boolean;
  trajectorySidebarOpen: boolean;
  learningData: LearningTrajectoryData | null;

  setMainSidebarOpen: (open: boolean) => void;
  setTrajectorySidebarOpen: (open: boolean) => void;
  closeAllSidebars: () => void;
  setLearningData: (data: LearningTrajectoryData | null) => void;
}

const DualSidebarContext = createContext<DualSidebarContextType | null>(null);

export function useDualSidebar() {
  const context = useContext(DualSidebarContext);
  if (!context) {
    throw new Error("useDualSidebar must be used within DualSidebarProvider");
  }
  return context;
}

function isSubModulePath(path: string): boolean {
  return /^\/(second-brain|languages|studies|body|disciplines)(\/|$)/.test(path);
}

interface DualSidebarProviderProps {
  children: ReactNode;
}

export function DualSidebarProvider({ children }: DualSidebarProviderProps) {
  const [location] = useLocation();
  const [mainSidebarOpen, setMainSidebarOpenInternal] = useState(true);
  const [trajectorySidebarOpen, setTrajectorySidebarOpenInternal] = useState(false);
  const [learningData, setLearningData] = useState<LearningTrajectoryData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);
  const [prevIsMobile, setPrevIsMobile] = useState(false);

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
    const disciplinesMatch = location.match(/^\/disciplines\/([^/]+)$/);
    if (disciplinesMatch) {
      return { type: "disciplines", id: disciplinesMatch[1], backPath: "/disciplines" };
    }
    const bodyMatch = location.startsWith("/body");
    if (bodyMatch) {
      return { type: "body", id: "body", backPath: "/" }; /* Body acts as its own sub-module type */
    }
    return null;
  }, [location]);

  const isInSubModule = !!subModuleInfo;
  const hasTrajectorySidebar = isInSubModule && subModuleInfo?.type !== 'body';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const mobileChanged = isMobile !== prevIsMobile;
    const locationChanged = location !== prevLocation;

    if (mobileChanged) {
      if (isMobile) {
        setMainSidebarOpenInternal(false);
        setTrajectorySidebarOpenInternal(false);
      } else {
        if (isInSubModule) {
          setMainSidebarOpenInternal(false);
          setTrajectorySidebarOpenInternal(true);
        } else {
          setMainSidebarOpenInternal(true);
          setTrajectorySidebarOpenInternal(false);
        }
      }
      setPrevIsMobile(isMobile);
    }

    if (locationChanged) {
      const wasInSubModule = isSubModulePath(prevLocation);
      const wasTrajectoryAvailable = wasInSubModule && !prevLocation.startsWith("/body");
      const nowInSubModule = isInSubModule;
      const nowTrajectoryAvailable = hasTrajectorySidebar;

      if (isMobile) {
        setMainSidebarOpenInternal(false);
        setTrajectorySidebarOpenInternal(false);
      } else {
        if (nowInSubModule) {
          if (nowTrajectoryAvailable) {
            // Entering one of the Big 4 submodules
            setMainSidebarOpenInternal(false);
            setTrajectorySidebarOpenInternal(true);
          } else {
            // Entering Body submodule
            if (!wasInSubModule) {
              setMainSidebarOpenInternal(false);
            }
            setTrajectorySidebarOpenInternal(false);
          }
        } else if (wasInSubModule && !nowInSubModule) {
          // Leaving a submodule to home or list pages
          setMainSidebarOpenInternal(true);
          setTrajectorySidebarOpenInternal(false);
          setLearningData(null);
        }
      }

      setPrevLocation(location);
    }
  }, [location, prevLocation, isMobile, prevIsMobile, isInSubModule, hasTrajectorySidebar]);

  const setMainSidebarOpen = useCallback((open: boolean) => {
    if (isMobile) {
      if (open) {
        setTrajectorySidebarOpenInternal(false);
      }
      setMainSidebarOpenInternal(open);
    } else {
      if (isInSubModule) {
        if (open) {
          setMainSidebarOpenInternal(true);
          setTrajectorySidebarOpenInternal(false);
        } else {
          setMainSidebarOpenInternal(false);
          if (hasTrajectorySidebar) {
            setTrajectorySidebarOpenInternal(true);
          }
        }
      } else {
        setMainSidebarOpenInternal(open);
      }
    }
  }, [isMobile, isInSubModule, hasTrajectorySidebar]);

  const setTrajectorySidebarOpen = useCallback((open: boolean) => {
    if (!hasTrajectorySidebar) return; // Prevent opening if not available

    if (isMobile) {
      if (open) {
        setMainSidebarOpenInternal(false);
      }
      setTrajectorySidebarOpenInternal(open);
    } else {
      if (isInSubModule) {
        if (open) {
          setTrajectorySidebarOpenInternal(true);
          setMainSidebarOpenInternal(false);
        } else {
          setTrajectorySidebarOpenInternal(false);
          setMainSidebarOpenInternal(true);
        }
      } else {
        setTrajectorySidebarOpenInternal(open);
      }
    }
  }, [isMobile, isInSubModule, hasTrajectorySidebar]);

  const closeAllSidebars = useCallback(() => {
    if (isMobile) {
      setMainSidebarOpenInternal(false);
      setTrajectorySidebarOpenInternal(false);
    }
  }, [isMobile]);

  const value: DualSidebarContextType = {
    isInSubModule,
    hasTrajectorySidebar,
    subModuleInfo,
    isMobile,
    mainSidebarOpen,
    trajectorySidebarOpen,
    learningData,
    setMainSidebarOpen,
    setTrajectorySidebarOpen,
    closeAllSidebars,
    setLearningData,
  };

  return (
    <DualSidebarContext.Provider value={value}>
      {children}
    </DualSidebarContext.Provider>
  );
}
