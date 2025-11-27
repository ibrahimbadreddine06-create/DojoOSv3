import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Calendar, Brain, TrendingUp } from "lucide-react";

// Floating 3D shape components
const FloatingHexagon = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-32 h-32 border-2 border-gray-600/30 dark:border-gray-400/30 rounded-lg"
    style={{
      transform: "rotateX(45deg) rotateY(45deg) rotateZ(20deg)",
    }}
    animate={{
      rotateX: [45, 50, 45],
      rotateY: [45, 55, 45],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const FloatingCircle = ({ delay, size }: { delay: number; size: string }) => (
  <motion.div
    className={`absolute rounded-full border border-gray-400/20 dark:border-gray-600/20 ${size}`}
    animate={{
      y: [0, -30, 0],
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const FloatingLine = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute h-1 bg-gradient-to-r from-transparent via-gray-400/30 to-transparent dark:via-gray-600/30 w-48"
    animate={{
      x: [0, 50, 0],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{
      duration: 5,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Ionic Capital with Spirals
const IonicCapital = ({ delay }: { delay: number }) => (
  <motion.svg
    width="120"
    height="50"
    viewBox="0 0 120 50"
    className="overflow-visible"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
  >
    {/* Top abacus */}
    <rect x="5" y="5" width="110" height="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-400" />
    
    {/* Echinus (curved part) */}
    <path d="M 10 13 Q 10 25 15 25" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-400" />
    <path d="M 110 13 Q 110 25 105 25" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-400" />
    
    {/* Left volute (spiral) */}
    <path d="M 15 25 Q 15 35 25 35 Q 35 35 40 30" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-700 dark:text-gray-400" strokeLinecap="round" />
    
    {/* Right volute (spiral) */}
    <path d="M 105 25 Q 105 35 95 35 Q 85 35 80 30" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-700 dark:text-gray-400" strokeLinecap="round" />
    
    {/* Connecting band */}
    <line x1="20" y1="42" x2="100" y2="42" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-400" />
  </motion.svg>
);

// Rubble stones at base
const RubbleStones = () => (
  <div className="absolute -bottom-6 w-full flex justify-center gap-2">
    {[
      { size: "w-3 h-3", left: "-16px" },
      { size: "w-4 h-3", left: "-8px" },
      { size: "w-3 h-4", left: "12px" },
      { size: "w-3 h-3", left: "20px" },
    ].map((stone, i) => (
      <motion.div
        key={i}
        className={`absolute ${stone.size} bg-gray-500 dark:bg-gray-600 rounded-sm`}
        style={{ left: stone.left }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 + i * 0.05 }}
      />
    ))}
  </div>
);

// Ionic Pillar Component
const IonicPillar = ({
  icon: Icon,
  name,
  desc,
  delay,
  isCenter = false,
  lean = 0,
}: {
  icon: typeof Calendar;
  name: string;
  desc: string;
  delay: number;
  isCenter?: boolean;
  lean?: number;
}) => {
  return (
    <motion.div
      className="flex flex-col items-center relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      style={{ transform: `rotateZ(${lean}deg)` }}
    >
      {/* Capital */}
      <motion.div
        initial={{ scaleY: 0, originY: 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.1, ease: "easeOut" }}
      >
        <IonicCapital delay={delay + 0.15} />
      </motion.div>

      {/* Pillar Shaft */}
      <motion.div
        className="w-16 md:w-20 bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 relative border-l-2 border-r-2 border-gray-600 dark:border-gray-500 shadow-lg h-64"
        initial={{ scaleY: 0, originY: 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.9, delay: delay + 0.2, ease: "easeOut" }}
      >
        {/* Vertical Fluting (grooves) */}
        <div className="absolute inset-0 flex opacity-60">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-r from-transparent via-gray-500 dark:via-gray-400 to-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, transparent, rgba(0,0,0,0.1) 30%, transparent)`,
              }}
            />
          ))}
        </div>

        {/* Weathered cracks */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-24 bg-gradient-to-b from-black/30 dark:from-white/20 to-transparent"
              style={{
                left: `${30 + i * 25}%`,
                top: `${20 + i * 15}%`,
              }}
            />
          ))}
        </div>

        {/* Engraved Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-gray-600 dark:text-gray-400 opacity-40"
            animate={{ opacity: [0.35, 0.5, 0.35] }}
            transition={{
              duration: 3,
              delay: delay,
              repeat: Infinity,
            }}
          >
            <Icon className="w-14 h-14 md:w-16 md:h-16" strokeWidth={1.2} />
          </motion.div>
        </div>
      </motion.div>

      {/* Base */}
      <motion.div
        className="w-24 md:w-28 h-5 bg-gradient-to-b from-gray-400 to-gray-600 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-600 dark:border-gray-700 relative"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: delay + 0.35, ease: "easeOut" }}
      >
        <div className="absolute inset-0 border-t-2 border-gray-700 dark:border-gray-600"></div>
      </motion.div>

      {/* Rubble */}
      <div className="relative w-full h-6">
        <RubbleStones />
      </div>

      {/* Label */}
      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: delay + 0.6 }}
      >
        <h3 className="font-semibold text-black dark:text-white text-sm md:text-base">
          {name}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {desc}
        </p>
      </motion.div>
    </motion.div>
  );
};

// Page 1: Enter the Dojo
const Page1 = () => (
  <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
    {/* Background shapes */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <FloatingHexagon delay={0} />
      <FloatingCircle delay={0.5} size="w-48 h-48" />
      <FloatingLine delay={1} />
    </div>

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-2xl">
      <motion.h1
        className="text-6xl md:text-8xl font-bold text-black dark:text-white text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Enter the
      </motion.h1>

      <motion.div
        className="text-6xl md:text-8xl font-bold text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <span className="text-gray-400 dark:text-gray-600">D</span>
        <span className="text-black dark:text-white">ojo</span>
      </motion.div>

      <motion.p
        className="text-xl text-gray-600 dark:text-gray-400 text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        Where you master yourself
      </motion.p>

      <motion.div
        className="mt-8 text-sm text-gray-500 dark:text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        A place to transform
      </motion.div>
    </div>
  </div>
);

// Page 2: Master Your Modules
const Page2 = () => {
  const pillars = [
    { icon: Calendar, name: "Daily Planner", desc: "Master your time", lean: -8 },
    { icon: Brain, name: "Knowledge", desc: "Organize & learn", lean: 0, isCenter: true },
    { icon: TrendingUp, name: "Growth", desc: "Track progress", lean: 8 },
  ];

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingCircle delay={0} size="w-64 h-64" />
        <FloatingHexagon delay={1} />
        <FloatingLine delay={0.5} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-4 w-full">
        <motion.h2
          className="text-5xl md:text-7xl font-bold text-black dark:text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Master Your
          <br />
          <span className="text-gray-400 dark:text-gray-600">Modules</span>
        </motion.h2>

        {/* Pillars - Greek Temple Style */}
        <div className="flex items-flex-end gap-4 md:gap-8 justify-center mt-8 h-96">
          {pillars.map((pillar, idx) => (
            <IonicPillar
              key={idx}
              icon={pillar.icon}
              name={pillar.name}
              desc={pillar.desc}
              delay={0.3 + idx * 0.15}
              isCenter={pillar.isCenter}
              lean={pillar.lean}
            />
          ))}
        </div>

        <motion.p
          className="text-gray-500 dark:text-gray-500 text-center mt-8 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Six active modules. Ten more coming soon.
        </motion.p>
      </div>
    </div>
  );
};

// Page 3: Begin Your Journey
const Page3 = () => (
  <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
    {/* Background shapes */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <FloatingHexagon delay={0.5} />
      <FloatingCircle delay={0} size="w-56 h-56" />
      <FloatingLine delay={1.5} />
    </div>

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-2xl">
      <motion.h2
        className="text-6xl md:text-7xl font-bold text-black dark:text-white text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Begin Your
        <br />
        <span className="text-gray-400 dark:text-gray-600">Journey</span>
      </motion.h2>

      <motion.p
        className="text-lg text-gray-600 dark:text-gray-400 text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Sign in and start mastering yourself today. Your personal operating system awaits.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Button
          size="lg"
          className="text-lg px-8 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
          onClick={() => (window.location.href = "/api/login")}
          data-testid="button-start-adventure"
        >
          Enter Your Dojo
        </Button>
      </motion.div>

      <motion.p
        className="text-sm text-gray-500 dark:text-gray-500 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        Sign in with Google, Apple, or Email
      </motion.p>
    </div>
  </div>
);

// Main Landing Component with Swipe Support
export default function Landing() {
  const [currentPage, setCurrentPage] = useState(0);
  const [dragX, setDragX] = useState(0);
  const pages = [<Page1 key="page1" />, <Page2 key="page2" />, <Page3 key="page3" />];

  const handleContinue = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleProgressDot = (index: number) => {
    setCurrentPage(index);
  };

  const handleDragEnd = (info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold && currentPage > 0) {
      handlePrevious();
    } else if (info.offset.x < -swipeThreshold && currentPage < pages.length - 1) {
      handleContinue();
    }
  };

  return (
    <motion.div
      className="relative w-full overflow-hidden h-screen"
      drag="x"
      dragElastic={0.2}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      onDrag={(_, info) => setDragX(info.offset.x)}
    >
      {/* Pages */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
        >
          {pages[currentPage]}
        </motion.div>
      </AnimatePresence>

      {/* Left Arrow (Previous) */}
      {currentPage > 0 && (
        <motion.button
          className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-40 p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition"
          onClick={handlePrevious}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          data-testid="button-previous-page"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-black dark:text-white" />
        </motion.button>
      )}

      {/* Right Arrow (Next) */}
      {currentPage < pages.length - 1 && (
        <motion.button
          className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40 p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition"
          onClick={handleContinue}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          data-testid="button-next-page"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-black dark:text-white" />
        </motion.button>
      )}

      {/* Navigation Controls (Bottom) */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-6">
        {/* Progress Dots */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleProgressDot(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage
                  ? "bg-black dark:bg-white w-8"
                  : "bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500"
              }`}
              data-testid={`button-progress-dot-${idx}`}
            />
          ))}
        </motion.div>

        {/* Continue Button (Mobile friendly) */}
        {currentPage < pages.length - 1 && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              onClick={handleContinue}
              size="sm"
              variant="ghost"
              className="text-xs"
              data-testid="button-continue-mobile"
            >
              Continue
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
