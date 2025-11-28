import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Brain, TrendingUp, Target } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

// Zen Circle animation
const ZenCircle = ({ delay, size }: { delay: number; size: string }) => (
  <motion.div
    className={`absolute rounded-full border border-gray-300 dark:border-gray-700 ${size}`}
    animate={{
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Meditation dot
const MeditationDot = ({ delay, position }: { delay: number; position: { x: string; y: string } }) => (
  <motion.div
    className="absolute w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"
    style={{ left: position.x, top: position.y }}
    animate={{
      y: [0, -15, 0],
      opacity: [0.4, 0.8, 0.4],
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
    {/* Background zen elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <ZenCircle delay={0} size="w-48 h-48" />
      <ZenCircle delay={0.5} size="w-64 h-64" />
      <ZenCircle delay={1} size="w-80 h-80" />
      <MeditationDot delay={0} position={{ x: "20%", y: "30%" }} />
      <MeditationDot delay={0.3} position={{ x: "75%", y: "60%" }} />
      <MeditationDot delay={0.6} position={{ x: "40%", y: "75%" }} />
    </div>

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-2xl">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <p className="text-3xl md:text-5xl text-gray-900 dark:text-gray-100 mb-6">
          Enter Your
        </p>
        <h1
          className="text-8xl md:text-9xl text-black dark:text-white"
          style={{
            fontFamily: "'Amanojaku', sans-serif",
          }}
        >
          Dojo
        </h1>
      </motion.div>

      <motion.p
        className="text-lg md:text-xl text-gray-600 dark:text-gray-400 text-center max-w-md font-light mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        Where you master yourself
      </motion.p>
    </div>
  </div>
);

// Bento Box Component
const BentoBox = ({
  icon: Icon,
  title,
  desc,
  delay,
  size = "medium",
}: {
  icon: typeof Calendar;
  title: string;
  desc: string;
  delay: number;
  size?: "small" | "medium" | "large";
}) => {
  const sizeClasses = {
    small: "col-span-1 row-span-1",
    medium: "col-span-1 md:col-span-2 row-span-1 md:row-span-2",
    large: "col-span-2 row-span-2",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-6 md:p-8 flex flex-col justify-between`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex flex-col gap-3 md:gap-4">
        <Icon className="w-6 h-6 md:w-8 md:h-8 text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm md:text-lg font-light text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-light">
        {desc}
      </p>
    </motion.div>
  );
};

// Page 2: Master Your Modules
const Page2 = () => {
  const boxes = [
    {
      icon: Calendar,
      title: "Daily Planner",
      desc: "Master your time with structured blocks",
      size: "medium",
    },
    {
      icon: Brain,
      title: "Knowledge",
      desc: "Organize learning",
      size: "small",
    },
    {
      icon: TrendingUp,
      title: "Growth",
      desc: "Track progress",
      size: "small",
    },
    {
      icon: Target,
      title: "Goals",
      desc: "Set and achieve your ambitions",
      size: "medium",
    },
  ];

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-slate-950 p-6 md:p-8">
      {/* Background zen elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ZenCircle delay={0.5} size="w-96 h-96" />
        <MeditationDot delay={0.2} position={{ x: "10%", y: "20%" }} />
        <MeditationDot delay={0.5} position={{ x: "85%", y: "75%" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <motion.h2
          className="text-4xl md:text-6xl text-center mb-4 md:mb-8 text-black dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Your Modules
        </motion.h2>

        <motion.p
          className="text-center text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8 md:mb-12 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Six core disciplines. More unlocking soon.
        </motion.p>

        {/* Bento Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {boxes.map((box, idx) => (
            <BentoBox
              key={idx}
              icon={box.icon}
              title={box.title}
              desc={box.desc}
              size={box.size as "small" | "medium" | "large"}
              delay={0.3 + idx * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// Page 3: Begin Your Journey
const Page3 = () => (
  <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
    {/* Background zen elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <ZenCircle delay={0} size="w-72 h-72" />
      <ZenCircle delay={0.4} size="w-96 h-96" />
      <MeditationDot delay={0} position={{ x: "25%", y: "40%" }} />
      <MeditationDot delay={0.4} position={{ x: "70%", y: "65%" }} />
    </div>

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-2xl text-center">
      <motion.h2
        className="text-4xl md:text-6xl text-black dark:text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Begin Your Journey
      </motion.h2>

      <motion.p
        className="text-base md:text-lg text-gray-600 dark:text-gray-400 font-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Start mastering yourself today. Your personal operating system awaits.
      </motion.p>

      <motion.div
        className="flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Button
          size="icon"
          variant="outline"
          onClick={() => (window.location.href = "/api/login?provider=google")}
          data-testid="button-signin-google"
          className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
          title="Sign in with Google"
        >
          <SiGoogle className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => (window.location.href = "/api/login?provider=apple")}
          data-testid="button-signin-apple"
          className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
          title="Sign in with Apple"
        >
          <SiApple className="w-5 h-5" />
        </Button>
      </motion.div>
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
    if (!info?.offset) return;
    const swipeThreshold = 30;
    if (info.offset.x > swipeThreshold && currentPage > 0) {
      handlePrevious();
    } else if (info.offset.x < -swipeThreshold && currentPage < pages.length - 1) {
      handleContinue();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Pages */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          drag="x"
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: "grabbing" }}
          style={{ touchAction: "pan-y" }}
        >
          {pages[currentPage]}
        </motion.div>
      </AnimatePresence>

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
                  ? "bg-gray-800 dark:bg-gray-200 w-8"
                  : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
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
    </div>
  );
}
