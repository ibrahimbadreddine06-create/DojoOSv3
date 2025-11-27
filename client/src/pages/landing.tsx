import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

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
    { name: "Daily Planner", desc: "Master your time", height: "h-48" },
    { name: "Knowledge", desc: "Organize & learn", height: "h-64" },
    { name: "Growth", desc: "Track progress", height: "h-56" },
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
      <div className="relative z-10 flex flex-col items-center gap-12 px-4">
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

        {/* Pillars Container */}
        <div className="flex items-flex-end gap-8 md:gap-12 justify-center mt-8 h-80">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.15 }}
            >
              {/* Pillar */}
              <motion.div
                className={`${pillar.height} w-16 md:w-20 bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 rounded-t-lg border border-gray-600 dark:border-gray-400 relative`}
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + idx * 0.15,
                  ease: "easeOut",
                }}
              >
                {/* Pillar glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent dark:from-white/30 dark:to-transparent rounded-t-lg"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{
                    duration: 3,
                    delay: idx * 0.2,
                    repeat: Infinity,
                  }}
                />
              </motion.div>

              {/* Label */}
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5 + idx * 0.15,
                }}
              >
                <h3 className="font-semibold text-black dark:text-white text-sm md:text-base">
                  {pillar.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {pillar.desc}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-gray-500 dark:text-gray-500 text-center mt-8"
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

// Main Landing Component
export default function Landing() {
  const [currentPage, setCurrentPage] = useState(0);
  const pages = [<Page1 key="page1" />, <Page2 key="page2" />, <Page3 key="page3" />];

  const handleContinue = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleProgressDot = (index: number) => {
    setCurrentPage(index);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Pages */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {pages[currentPage]}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
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

        {/* Continue Button */}
        {currentPage < pages.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              onClick={handleContinue}
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
              data-testid="button-continue"
            >
              <ChevronRight className="w-6 h-6 text-black dark:text-white" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
