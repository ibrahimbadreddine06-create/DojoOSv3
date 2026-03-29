// @refresh reset
import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode, type Dispatch, type SetStateAction } from "react";
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DualSidebarContextType {
  isInSubModule: boolean;
  hasTrajectorySidebar: boolean;
  subModuleInfo: SubModuleInfo | null;
  isMobile: boolean;
  isWideScreen: boolean;
  mainSidebarOpen: boolean;
  trajectorySidebarOpen: boolean;
  chatSidebarOpen: boolean;
  learningData: LearningTrajectoryData | null;
  chatMessages: ChatMessage[];

  setMainSidebarOpen: (open: boolean) => void;
  setTrajectorySidebarOpen: (open: boolean) => void;
  setChatSidebarOpen: (open: boolean) => void;
  closeAllSidebars: () => void;
  setLearningData: (data: LearningTrajectoryData | null) => void;
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
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
  const [chatSidebarOpen, setChatSidebarOpenInternal] = useState(false);
  const [learningData, setLearningData] = useState<LearningTrajectoryData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
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
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsWideScreen(window.innerWidth >= 1080);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // When screen narrows below wide threshold with all 3 panels open, auto-close left sidebar
  useEffect(() => {
    if (!isWideScreen && !isMobile && chatSidebarOpen && (mainSidebarOpen || trajectorySidebarOpen)) {
      setMainSidebarOpenInternal(false);
      setTrajectorySidebarOpenInternal(false);
    }
  }, [isWideScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const mobileChanged = isMobile !== prevIsMobile;
    const locationChanged = location !== prevLocation;

    if (mobileChanged) {
      if (isMobile) {
        setMainSidebarOpenInternal(false);
        setTrajectorySidebarOpenInternal(false);
        setChatSidebarOpenInternal(false);
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
      const nowInSubModule = isInSubModule;
      const nowTrajectoryAvailable = hasTrajectorySidebar;

      if (isMobile) {
        setMainSidebarOpenInternal(false);
        setTrajectorySidebarOpenInternal(false);
        setChatSidebarOpenInternal(false);
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
          setChatSidebarOpenInternal(false);
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
          if (!isWideScreen) setChatSidebarOpenInternal(false);
        } else {
          setMainSidebarOpenInternal(false);
          if (hasTrajectorySidebar && (!chatSidebarOpen || isWideScreen)) {
            setTrajectorySidebarOpenInternal(true);
          }
        }
      } else {
        if (open && !isWideScreen) setChatSidebarOpenInternal(false);
        setMainSidebarOpenInternal(open);
      }
    }
  }, [isMobile, isInSubModule, hasTrajectorySidebar, isWideScreen, chatSidebarOpen]);

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
          if (!isWideScreen) setChatSidebarOpenInternal(false);
        } else {
          setTrajectorySidebarOpenInternal(false);
          if (!chatSidebarOpen || isWideScreen) {
            setMainSidebarOpenInternal(true);
          }
        }
      } else {
        if (open && !isWideScreen) setChatSidebarOpenInternal(false);
        setTrajectorySidebarOpenInternal(open);
      }
    }
  }, [isMobile, isInSubModule, hasTrajectorySidebar, isWideScreen, chatSidebarOpen]);

  const setChatSidebarOpen = useCallback((open: boolean) => {
    if (open) {
      if (!isWideScreen && !isMobile) {
        // Medium screen: close left sidebars when opening chat
        setMainSidebarOpenInternal(false);
        setTrajectorySidebarOpenInternal(false);
      }
      setChatSidebarOpenInternal(true);
    } else {
      setChatSidebarOpenInternal(false);
      // Restore left sidebar when chat closes on medium screen
      if (!isWideScreen && !isMobile) {
        setTrajectorySidebarOpenInternal(true);
      }
    }
  }, [isWideScreen, isMobile]);

  const closeAllSidebars = useCallback(() => {
    if (isMobile) {
      setMainSidebarOpenInternal(false);
      setTrajectorySidebarOpenInternal(false);
      setChatSidebarOpenInternal(false);
    }
  }, [isMobile]);

  const value: DualSidebarContextType = {
    isInSubModule,
    hasTrajectorySidebar,
    subModuleInfo,
    isMobile,
    isWideScreen,
    mainSidebarOpen,
    trajectorySidebarOpen,
    chatSidebarOpen,
    learningData,
    chatMessages,
    setMainSidebarOpen,
    setTrajectorySidebarOpen,
    setChatSidebarOpen,
    closeAllSidebars,
    setLearningData,
    setChatMessages,
  };

  return (
    <DualSidebarContext.Provider value={value}>
      {children}
    </DualSidebarContext.Provider>
  );
}
