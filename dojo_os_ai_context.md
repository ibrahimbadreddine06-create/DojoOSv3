# DojoOS - Core Architecture Context

This document contains the critical files needed to understand the application architecture, routing, and database schema. Use this to safely integrate the AI chat feature without breaking the existing Vite/React/TanStack Query setup.

```filepath
package.json
```

```json
{
  "name": "DojoOS",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@tanstack/react-query": "^5.60.5",
    "@types/memoizee": "^0.4.12",
    "@types/react-grid-layout": "^1.3.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "dotenv": "^17.2.3",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "express": "^4.21.2",
    "express-session": "^1.18.2",
    "framer-motion": "^11.13.1",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.453.0",
    "memoizee": "^0.4.17",
    "memorystore": "^1.6.7",
    "next-themes": "^0.4.6",
    "openid-client": "^6.8.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-local": "^1.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-grid-layout": "^2.2.2",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-joyride": "^2.9.3",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "tw-animate-css": "^1.2.5",
    "vaul": "^1.1.2",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.4.1",
    "@replit/vite-plugin-dev-banner": "^0.1.1",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.1.3",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.2",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.17",
    "@types/passport-google-oauth20": "^2.0.17",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.7.0",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.31.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.20.5",
    "typescript": "5.6.3",
    "vite": "^5.4.20"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}
```

```filepath
shared/schema.ts
```

```typescript
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, date, decimal, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== ENUMS =====
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const salahStatusEnum = pgEnum("salah_status", ["on_time", "late", "makeup", "missed"]);
export const laundryStatusEnum = pgEnum("laundry_status", ["clean", "second_wear", "dirty"]);
export const intakeStatusEnum = pgEnum("intake_status", ["planned", "consumed"]);
export const moduleEnum = pgEnum("module", [
  "planner", "goals", "second_brain", "languages", "disciplines",
  "body", "body_workout", "body_intake", "body_sleep", "body_hygiene",
  "worship", "finances", "masterpieces", "possessions", "studies",
  "business", "work", "social_purpose"
]);
export const visibilityEnum = pgEnum("visibility", ["public", "followers", "private"]);

// ===== AUTHENTICATION (Replit Auth) =====
// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique().notNull(),
  password: text("password").notNull(),
  salt: text("salt"), // Optional manual salt if needed, though scrypt/argon2 usually handle it
  encryptionKeySalt: text("encryption_key_salt"), // Reserved for client-side encryption key derivation
  bio: text("bio"),
  isPrivate: boolean("is_private").notNull().default(true),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ===== SOCIAL & PRIVACY =====

export const follows = pgTable(
  "follows",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    followerId: varchar("follower_id").notNull(),
    followingId: varchar("following_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_follows_follower").on(table.followerId),
    index("IDX_follows_following").on(table.followingId),
  ]
);

export const privacySettings = pgTable(
  "privacy_settings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    module: moduleEnum("module").notNull(),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_privacy_user").on(table.userId),
  ]
);

// ===== TIME BLOCKS & PRESETS =====
export const timeBlocks = pgTable("time_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id"), // For sub-blocks (max 2 levels deep)
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0), // For ordering sub-blocks and tasks
  linkedModule: text("linked_module"), // Which module this block is linked to (e.g., "languages", "second_brain")
  linkedItemId: varchar("linked_item_id"), // ID of the linked theme/language/course
  linkedSubItemId: varchar("linked_sub_item_id"), // ID of the linked sub-item (chapter/lesson)
  tasks: jsonb("tasks").$type<{ id: string; text: string; completed: boolean; importance: number; order: number }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeBlocksRelations = relations(timeBlocks, ({ one, many }) => ({
  parent: one(timeBlocks, {
    fields: [timeBlocks.parentId],
    references: [timeBlocks.id],
    relationName: "subBlocks"
  }),
  subBlocks: many(timeBlocks, { relationName: "subBlocks" }),
}));

export const dayPresets = pgTable("day_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  blocks: jsonb("blocks").$type<{
    startTime: string;
    endTime: string;
    title: string;
    linkedModule?: string;
    linkedItemId?: string;
    tasks?: { text: string; importance: number }[];
    subBlocks?: {
      startTime: string;
      endTime: string;
      title: string;
      linkedSubItemId?: string;
      tasks?: { text: string; importance: number }[];
    }[];
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityPresets = pgTable("activity_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  module: text("module").notNull(),
  name: text("name").notNull(),
  tasks: jsonb("tasks").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== GOALS =====
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"),
  year: integer("year"),
  quarter: integer("quarter"), // 1-4
  month: integer("month"), // 1-12
  priority: priorityEnum("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  associatedModules: text("associated_modules").array(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const goalsRelations = relations(goals, ({ one, many }) => ({
  parent: one(goals, {
    fields: [goals.parentId],
    references: [goals.id],
    relationName: "subgoals"
  }),
  subgoals: many(goals, { relationName: "subgoals" }),
}));

// ===== KNOWLEDGE TRACKING (Second Brain, Languages, Disciplines) =====
export const knowledgeTopics = pgTable("knowledge_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "second_brain", "language", "discipline"
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const learnPlanItems = pgTable("learn_plan_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id"), // For Second Brain / Languages
  courseId: varchar("course_id"), // For Studies (courses)
  disciplineId: varchar("discipline_id"), // For Disciplines
  parentId: varchar("parent_id"), // For nested chapters (infinite depth: 1.1 → 1.1.1 → 1.1.1.1)
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  importance: integer("importance").notNull().default(3), // 1-5 scale
  order: integer("order").notNull().default(0),
  notes: text("notes"), // Rich text notes for the chapter
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id"), // For Second Brain / Languages
  courseId: varchar("course_id"), // For Studies (courses)
  disciplineId: varchar("discipline_id"), // For Disciplines
  chapterId: varchar("chapter_id"), // Optional: link material to specific chapter
  type: text("type").notNull(), // "pdf", "video", "link", "file"
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"),
  fileName: text("file_name"), // Original file name for uploads
  fileData: text("file_data"), // Base64 encoded file data for uploads
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id"), // For Second Brain / Languages
  courseId: varchar("course_id"), // For Studies (courses)
  disciplineId: varchar("discipline_id"), // For Disciplines
  chapterId: varchar("chapter_id"), // Optional: link to specific chapter
  front: text("front").notNull(),
  back: text("back").notNull(),
  imageUrl: text("image_url"), // Optional image for flashcard
  audioUrl: text("audio_url"), // Optional audio for flashcard (mp3, max ~30sec)
  order: integer("order").notNull().default(0), // For manual reordering
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  ease: decimal("ease", { precision: 3, scale: 2 }).default("2.5"),
  interval: integer("interval").default(0),
  mastery: integer("mastery").notNull().default(0), // 0=new, 1=bad, 2=okay, 3=good, 4=perfect
  goodCount: integer("good_count").notNull().default(0), // Tracks consecutive "good" ratings (2x good = mastered in Vaia logic)
  createdAt: timestamp("created_at").defaultNow(),
});

export const knowledgeMetrics = pgTable("knowledge_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull(),
  date: date("date").notNull(),
  completion: decimal("completion", { precision: 5, scale: 2 }).notNull(), // Percentage
  readiness: decimal("readiness", { precision: 5, scale: 2 }).notNull(), // Percentage
});

export const knowledgeTopicsRelations = relations(knowledgeTopics, ({ many }) => ({
  learnPlanItems: many(learnPlanItems),
  materials: many(materials),
  metrics: many(knowledgeMetrics),
}));

export const learnPlanItemsRelations = relations(learnPlanItems, ({ one, many }) => ({
  topic: one(knowledgeTopics, {
    fields: [learnPlanItems.topicId],
    references: [knowledgeTopics.id],
  }),
  course: one(courses, {
    fields: [learnPlanItems.courseId],
    references: [courses.id],
  }),
  discipline: one(disciplines, {
    fields: [learnPlanItems.disciplineId],
    references: [disciplines.id],
  }),
  parent: one(learnPlanItems, {
    fields: [learnPlanItems.parentId],
    references: [learnPlanItems.id],
    relationName: "subChapters"
  }),
  children: many(learnPlanItems, { relationName: "subChapters" }),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  topic: one(knowledgeTopics, {
    fields: [materials.topicId],
    references: [knowledgeTopics.id],
  }),
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
  discipline: one(disciplines, {
    fields: [materials.disciplineId],
    references: [disciplines.id],
  }),
  chapter: one(learnPlanItems, {
    fields: [materials.chapterId],
    references: [learnPlanItems.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  topic: one(knowledgeTopics, {
    fields: [flashcards.topicId],
    references: [knowledgeTopics.id],
  }),
  course: one(courses, {
    fields: [flashcards.courseId],
    references: [courses.id],
  }),
  discipline: one(disciplines, {
    fields: [flashcards.disciplineId],
    references: [disciplines.id],
  }),
  chapter: one(learnPlanItems, {
    fields: [flashcards.chapterId],
    references: [learnPlanItems.id],
  }),
}));

export const knowledgeMetricsRelations = relations(knowledgeMetrics, ({ one }) => ({
  topic: one(knowledgeTopics, {
    fields: [knowledgeMetrics.topicId],
    references: [knowledgeTopics.id],
  }),
}));

// ===== CHAPTER NOTES (separate note files per chapter) =====
export const chapterNotes = pgTable("chapter_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id").notNull(),
  topicId: varchar("topic_id"),
  courseId: varchar("course_id"),
  disciplineId: varchar("discipline_id"),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chapterNotesRelations = relations(chapterNotes, ({ one }) => ({
  chapter: one(learnPlanItems, {
    fields: [chapterNotes.chapterId],
    references: [learnPlanItems.id],
  }),
  topic: one(knowledgeTopics, {
    fields: [chapterNotes.topicId],
    references: [knowledgeTopics.id],
  }),
  course: one(courses, {
    fields: [chapterNotes.courseId],
    references: [courses.id],
  }),
  discipline: one(disciplines, {
    fields: [chapterNotes.disciplineId],
    references: [disciplines.id],
  }),
}));

// ===== BODY TRACKING =====
export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exerciseLibrary = pgTable("exercise_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  targetMuscleGroup: text("target_muscle_group"), // Matches BodyMap IDs
  secondaryMuscles: text("secondary_muscles").array(),
  category: text("category"), // barbell, dumbbell, machine, bodyweight, cardio
  instructions: text("instructions"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(), // Links to exerciseLibrary
  order: integer("order").notNull().default(0),
  notes: text("notes"),
});

export const workoutSets = pgTable("workout_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutExerciseId: varchar("workout_exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  rpe: decimal("rpe", { precision: 3, scale: 1 }), // Rate of Perceived Exertion (1-10)
  completed: boolean("completed").notNull().default(false),
});

export const muscleStats = pgTable("muscle_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  muscleId: text("muscle_id").notNull(), // Matches BodyMap IDs
  recoveryScore: integer("recovery_score").default(100), // 0-100%
  lastTrained: timestamp("last_trained"),
  volumeAccumulated: integer("volume_accumulated").default(0), // Rolling window volume
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutPresets = pgTable("workout_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // exercises: list of { exerciseId: string, sets: number, targetReps: string }
  exercises: jsonb("exercises").$type<{ exerciseId: string; sets: number; targetReps?: string }[]>().notNull(),
  lastPerformed: timestamp("last_performed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const intakeLogs = pgTable("intake_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(), // Changed from date to timestamp for time tracking
  mealName: text("meal_name"),
  calories: decimal("calories", { precision: 7, scale: 2 }),
  protein: decimal("protein", { precision: 6, scale: 2 }),
  carbs: decimal("carbs", { precision: 6, scale: 2 }),
  fats: decimal("fats", { precision: 6, scale: 2 }),
  notes: text("notes"),
  imageUrl: text("image_url"), // Added for food photos
  status: intakeStatusEnum("status").notNull().default("consumed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sleepLogs = pgTable("sleep_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  startTime: timestamp("start_time"), // Added for precise tracking
  endTime: timestamp("end_time"),     // Added for precise tracking
  plannedHours: decimal("planned_hours", { precision: 4, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 4, scale: 2 }),
  quality: integer("quality"), // 1-5
  notes: text("notes"),
});

export const hygieneRoutines = pgTable("hygiene_routines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  completed: boolean("completed").notNull().default(false),
  date: date("date").notNull(),
});

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const exerciseLibraryRelations = relations(exerciseLibrary, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exerciseLibrary, {
    fields: [workoutExercises.exerciseId],
    references: [exerciseLibrary.id],
  }),
  sets: many(workoutSets),
}));

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [workoutSets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

// ===== WORSHIP =====
export const salahLogs = pgTable("salah_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  prayer: text("prayer").notNull(), // Fajr, Dhuhr, Asr, Maghrib, Isha
  obligatory: boolean("obligatory").notNull().default(true),
  status: salahStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quranLogs = pgTable("quran_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  pages: integer("pages"),
  minutes: integer("minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dhikrLogs = pgTable("dhikr_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  type: text("type").notNull(),
  count: integer("count"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const duaLogs = pgTable("dua_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== FINANCES =====
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  type: text("type").notNull(), // "income", "expense"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category"),
  description: text("description"),
  recurring: boolean("recurring").notNull().default(false),
  associatedModule: text("associated_module"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== MASTERPIECES =====
export const masterpieces = pgTable("masterpieces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const masterpieceSections = pgTable("masterpiece_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  masterpieceId: varchar("masterpiece_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const masterpiecesRelations = relations(masterpieces, ({ many }) => ({
  sections: many(masterpieceSections),
}));

export const masterpieceSectionsRelations = relations(masterpieceSections, ({ one }) => ({
  masterpiece: one(masterpieces, {
    fields: [masterpieceSections.masterpieceId],
    references: [masterpieces.id],
  }),
}));

// ===== POSSESSIONS =====
export const possessions = pgTable("possessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // "clothing", "perfume", "house", "car", etc.
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  value: decimal("value", { precision: 12, scale: 2 }),
  wishlist: boolean("wishlist").notNull().default(false),
  laundryStatus: laundryStatusEnum("laundry_status"), // Only for clothing
  createdAt: timestamp("created_at").defaultNow(),
});

export const outfits = pgTable("outfits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  itemIds: text("item_ids").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== STUDIES =====
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  semester: text("semester"), // e.g., "Fall 2024", "Spring 2025"
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  order: integer("order").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseExercises = pgTable("course_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull(),
  title: text("title").notNull(),
  grade: decimal("grade", { precision: 5, scale: 2 }),
  maxGrade: decimal("max_grade", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseMetrics = pgTable("course_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  date: date("date").notNull(),
  completion: decimal("completion", { precision: 5, scale: 2 }).notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  metrics: many(courseMetrics),
}));

export const courseMetricsRelations = relations(courseMetrics, ({ one }) => ({
  course: one(courses, {
    fields: [courseMetrics.courseId],
    references: [courses.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  exercises: many(courseExercises),
}));

export const courseExercisesRelations = relations(courseExercises, ({ one }) => ({
  lesson: one(lessons, {
    fields: [courseExercises.lessonId],
    references: [lessons.id],
  }),
}));

// ===== BUSINESS & WORK =====
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workProjects = pgTable("work_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "business" or "work"
  relatedId: varchar("related_id"), // Business ID if type is business
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id"),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessesRelations = relations(businesses, ({ many }) => ({
  projects: many(workProjects),
}));

export const workProjectsRelations = relations(workProjects, ({ one, many }) => ({
  business: one(businesses, {
    fields: [workProjects.relatedId],
    references: [businesses.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(workProjects, {
    fields: [tasks.projectId],
    references: [workProjects.id],
  }),
}));

// ===== SOCIAL PURPOSE =====
export const socialActivities = pgTable("social_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subArea: text("sub_area").notNull(), // "helping", "networking", "charity", "legacy", "pride"
  title: text("title").notNull(),
  description: text("description"),
  date: date("date"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const people = pgTable("people", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  relationship: text("relationship"),
  lastContact: date("last_contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== PAGE SETTINGS =====
export const pageSettings = pgTable("page_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  module: text("module").notNull().unique(),
  active: boolean("active").notNull().default(true),
  color: text("color"), // Hex code or HSL value
});

// ===== DAILY METRICS =====
export const dailyMetrics = pgTable("daily_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  plannerCompletion: decimal("planner_completion", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== INSERT SCHEMAS =====
export const insertTimeBlockSchema = createInsertSchema(timeBlocks).omit({ id: true, createdAt: true });
export const insertDayPresetSchema = createInsertSchema(dayPresets).omit({ id: true, createdAt: true });
export const insertActivityPresetSchema = createInsertSchema(activityPresets).omit({ id: true, createdAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, completedAt: true });
export const insertKnowledgeTopicSchema = createInsertSchema(knowledgeTopics).omit({ id: true, createdAt: true });
export const insertLearnPlanItemSchema = createInsertSchema(learnPlanItems).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertChapterNoteSchema = createInsertSchema(chapterNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true });
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true });
export const insertExerciseLibrarySchema = createInsertSchema(exerciseLibrary).omit({ id: true, createdAt: true });
export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({ id: true });
export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({ id: true });
export const insertMuscleStatSchema = createInsertSchema(muscleStats).omit({ id: true, updatedAt: true });

export const insertIntakeLogSchema = createInsertSchema(intakeLogs).omit({ id: true, createdAt: true });
export const insertSleepLogSchema = createInsertSchema(sleepLogs).omit({ id: true });
export const insertHygieneRoutineSchema = createInsertSchema(hygieneRoutines).omit({ id: true });
export const insertSalahLogSchema = createInsertSchema(salahLogs).omit({ id: true, createdAt: true });
export const insertQuranLogSchema = createInsertSchema(quranLogs).omit({ id: true, createdAt: true });
export const insertDhikrLogSchema = createInsertSchema(dhikrLogs).omit({ id: true, createdAt: true });
export const insertDuaLogSchema = createInsertSchema(duaLogs).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertMasterpieceSchema = createInsertSchema(masterpieces).omit({ id: true, createdAt: true });
export const insertMasterpieceSectionSchema = createInsertSchema(masterpieceSections).omit({ id: true, createdAt: true });
export const insertPossessionSchema = createInsertSchema(possessions).omit({ id: true, createdAt: true });
export const insertOutfitSchema = createInsertSchema(outfits).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertCourseExerciseSchema = createInsertSchema(courseExercises).omit({ id: true, createdAt: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true });
export const insertWorkProjectSchema = createInsertSchema(workProjects).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertSocialActivitySchema = createInsertSchema(socialActivities).omit({ id: true, createdAt: true });
export const insertPersonSchema = createInsertSchema(people).omit({ id: true, createdAt: true });
export const insertPageSettingSchema = createInsertSchema(pageSettings).omit({ id: true });
export const insertDailyMetricSchema = createInsertSchema(dailyMetrics).omit({ id: true, createdAt: true });
export const insertWorkoutPresetSchema = createInsertSchema(workoutPresets).omit({ id: true, createdAt: true, lastPerformed: true });

// ===== TYPES =====
export type TimeBlock = typeof timeBlocks.$inferSelect;
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type DayPreset = typeof dayPresets.$inferSelect;
export type InsertDayPreset = z.infer<typeof insertDayPresetSchema>;
export type ActivityPreset = typeof activityPresets.$inferSelect;
export type InsertActivityPreset = z.infer<typeof insertActivityPresetSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type KnowledgeTopic = typeof knowledgeTopics.$inferSelect;
export type InsertKnowledgeTopic = z.infer<typeof insertKnowledgeTopicSchema>;
export type LearnPlanItem = typeof learnPlanItems.$inferSelect;
export type InsertLearnPlanItem = z.infer<typeof insertLearnPlanItemSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type ChapterNote = typeof chapterNotes.$inferSelect;
export type InsertChapterNote = z.infer<typeof insertChapterNoteSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type ExerciseLibraryItem = typeof exerciseLibrary.$inferSelect;
export type InsertExerciseLibraryItem = z.infer<typeof insertExerciseLibrarySchema>;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type MuscleStat = typeof muscleStats.$inferSelect;
export type InsertMuscleStat = z.infer<typeof insertMuscleStatSchema>;

export type IntakeLog = typeof intakeLogs.$inferSelect;
export type InsertIntakeLog = z.infer<typeof insertIntakeLogSchema>;
export type SleepLog = typeof sleepLogs.$inferSelect;
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
export type HygieneRoutine = typeof hygieneRoutines.$inferSelect;
export type InsertHygieneRoutine = z.infer<typeof insertHygieneRoutineSchema>;
export type SalahLog = typeof salahLogs.$inferSelect;
export type InsertSalahLog = z.infer<typeof insertSalahLogSchema>;
export type QuranLog = typeof quranLogs.$inferSelect;
export type InsertQuranLog = z.infer<typeof insertQuranLogSchema>;
export type DhikrLog = typeof dhikrLogs.$inferSelect;
export type InsertDhikrLog = z.infer<typeof insertDhikrLogSchema>;
export type DuaLog = typeof duaLogs.$inferSelect;
export type InsertDuaLog = z.infer<typeof insertDuaLogSchema>;

export type WorkoutPreset = typeof workoutPresets.$inferSelect;
export type InsertWorkoutPreset = z.infer<typeof insertWorkoutPresetSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Masterpiece = typeof masterpieces.$inferSelect;
export type InsertMasterpiece = z.infer<typeof insertMasterpieceSchema>;
export type MasterpieceSection = typeof masterpieceSections.$inferSelect;
export type InsertMasterpieceSection = z.infer<typeof insertMasterpieceSectionSchema>;
export type Possession = typeof possessions.$inferSelect;
export type InsertPossession = z.infer<typeof insertPossessionSchema>;
export type Outfit = typeof outfits.$inferSelect;
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type CourseExercise = typeof courseExercises.$inferSelect;
export type InsertCourseExercise = z.infer<typeof insertCourseExerciseSchema>;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type WorkProject = typeof workProjects.$inferSelect;
export type InsertWorkProject = z.infer<typeof insertWorkProjectSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SocialActivity = typeof socialActivities.$inferSelect;
export type InsertSocialActivity = z.infer<typeof insertSocialActivitySchema>;
export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type PageSetting = typeof pageSettings.$inferSelect;
export type InsertPageSetting = z.infer<typeof insertPageSettingSchema>;
export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type InsertDailyMetric = z.infer<typeof insertDailyMetricSchema>;
export type KnowledgeMetric = typeof knowledgeMetrics.$inferSelect;
export type CourseMetric = typeof courseMetrics.$inferSelect;

// ===== DISCIPLINES (Gamified Skill Tracking) =====
export const disciplines = pgTable("disciplines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  level: integer("level").default(1),
  currentXp: integer("current_xp").default(0),
  maxXp: integer("max_xp").default(100), // Scaling XP per level
  color: text("color").default("text-primary"), // Custom branding
  icon: text("icon").default("Zap"), // Lucide icon name
  createdAt: timestamp("created_at").defaultNow(),
});

export const disciplineLogs = pgTable("discipline_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  disciplineId: varchar("discipline_id").references(() => disciplines.id),
  date: timestamp("date").defaultNow(),
  durationMinutes: integer("duration_minutes"), // Optional
  notes: text("notes"),
  xpGained: integer("xp_gained").notNull(),
});

export const disciplinesRelations = relations(disciplines, ({ many }) => ({
  logs: many(disciplineLogs),
}));

export const disciplineLogsRelations = relations(disciplineLogs, ({ one }) => ({
  discipline: one(disciplines, {
    fields: [disciplineLogs.disciplineId],
    references: [disciplines.id],
  }),
}));

export const insertDisciplineSchema = createInsertSchema(disciplines, {
  level: z.number().optional(),
  currentXp: z.number().optional(),
  maxXp: z.number().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
}).omit({ id: true, createdAt: true });
export const insertDisciplineLogSchema = createInsertSchema(disciplineLogs, {
  durationMinutes: z.number().optional(),
}).omit({ id: true });

export type Discipline = typeof disciplines.$inferSelect;
export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type DisciplineLog = typeof disciplineLogs.$inferSelect;
export type InsertDisciplineLog = z.infer<typeof insertDisciplineLogSchema>;

// Social & Privacy Types
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;
export type PrivacySetting = typeof privacySettings.$inferSelect;
export type InsertPrivacySetting = typeof privacySettings.$inferInsert;
export type UpdatePrivacySetting = Partial<InsertPrivacySetting>;

```

```filepath
server/routes.ts
```

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTimeBlockSchema, insertDayPresetSchema, insertActivityPresetSchema,
  insertGoalSchema, insertKnowledgeTopicSchema, insertLearnPlanItemSchema,
  insertMaterialSchema, insertFlashcardSchema, insertWorkoutSchema,
  insertExerciseLibrarySchema, insertWorkoutExerciseSchema, insertWorkoutSetSchema,
  insertIntakeLogSchema, insertSleepLogSchema, insertHygieneRoutineSchema,
  insertSalahLogSchema, insertQuranLogSchema, insertDhikrLogSchema, insertDuaLogSchema,
  insertTransactionSchema, insertMasterpieceSchema, insertMasterpieceSectionSchema,
  insertPossessionSchema, insertOutfitSchema, insertCourseSchema, insertLessonSchema,
  insertCourseExerciseSchema, insertBusinessSchema, insertWorkProjectSchema, insertTaskSchema,
  insertSocialActivitySchema, insertPersonSchema, insertPageSettingSchema, insertDailyMetricSchema,
  insertDisciplineSchema, insertDisciplineLogSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== TIME BLOCKS & PRESETS =====
  // Note: /linked route must come BEFORE /:date to avoid matching "linked" as a date
  app.get("/api/time-blocks/linked", async (req, res) => {
    const { date, module, itemId, subItemId } = req.query;
    if (!date || !module) {
      return res.status(400).json({ message: "date and module are required" });
    }
    const blocks = await storage.getLinkedTimeBlocks(
      date as string,
      (module as string).replace(/-/g, '_'),
      itemId as string | undefined,
      subItemId as string | undefined
    );
    res.json(blocks);
  });

  app.get("/api/time-blocks/:date", async (req, res) => {
    const blocks = await storage.getTimeBlocks(req.params.date);
    res.json(blocks);
  });

  app.post("/api/time-blocks", async (req, res) => {
    const data = insertTimeBlockSchema.parse(req.body);

    if (data.parentId) {
      const parent = await storage.getTimeBlock(data.parentId);
      if (!parent) {
        return res.status(400).json({ message: "Parent block not found" });
      }
      if (parent.parentId) {
        return res.status(400).json({ message: "Maximum nesting depth is 2 levels (block → sub-block)" });
      }
    }

    const block = await storage.createTimeBlock(data);
    res.json(block);
  });

  app.patch("/api/time-blocks/:id", async (req, res) => {
    const block = await storage.updateTimeBlock(req.params.id, req.body);
    res.json(block);
  });

  app.delete("/api/time-blocks/:id", async (req, res) => {
    await storage.deleteTimeBlock(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/day-presets", async (req, res) => {
    const presets = await storage.getDayPresets();
    res.json(presets);
  });

  app.post("/api/day-presets", async (req, res) => {
    const data = insertDayPresetSchema.parse(req.body);
    const preset = await storage.createDayPreset(data);
    res.json(preset);
  });

  app.delete("/api/day-presets/:id", async (req, res) => {
    await storage.deleteDayPreset(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/activity-presets/:module", async (req, res) => {
    const presets = await storage.getActivityPresets(req.params.module);
    res.json(presets);
  });

  app.post("/api/activity-presets", async (req, res) => {
    const data = insertActivityPresetSchema.parse(req.body);
    const preset = await storage.createActivityPreset(data);
    res.json(preset);
  });

  // ===== GOALS =====
  app.get("/api/goals", async (req, res) => {
    const goals = await storage.getGoals();
    res.json(goals);
  });

  app.get("/api/goals/:id", async (req, res) => {
    const goal = await storage.getGoal(req.params.id);
    res.json(goal);
  });

  app.post("/api/goals", async (req, res) => {
    const data = insertGoalSchema.parse(req.body);
    const goal = await storage.createGoal(data);
    res.json(goal);
  });

  app.patch("/api/goals/:id", async (req, res) => {
    const goal = await storage.updateGoal(req.params.id, req.body);
    res.json(goal);
  });

  app.delete("/api/goals/:id", async (req, res) => {
    await storage.deleteGoal(req.params.id);
    res.json({ success: true });
  });

  // ===== KNOWLEDGE TRACKING =====
  app.get("/api/knowledge-topics/detail/:id", async (req, res) => {
    const theme = await storage.getKnowledgeTopic(req.params.id);
    res.json(theme);
  });

  app.get("/api/knowledge-topics/:type", async (req, res) => {
    const type = req.params.type;

    const normalizedType = type.replace(/-/g, '_');

    // Generic hub for linkable items across modules
    switch (normalizedType) {
      case "goals":
        const goals = await storage.getGoals();
        return res.json(goals.map(g => ({ id: g.id, name: g.title })));
      case "disciplines":
        const disciplines = await storage.getDisciplines();
        return res.json(disciplines.map(d => ({ id: d.id, name: d.name })));
      case "body":
        // Level 2 for body is the sub-modules
        return res.json([
          { id: "body_intake", name: "Intake & Hydration" },
          { id: "body_sleep", name: "Sleep & Recovery" },
          { id: "body_hygiene", name: "Hygiene & Appearance" },
          { id: "body_workouts", name: "Workouts & Fitness" },
        ]);
      case "masterpieces":
        const masterpieces = await storage.getMasterpieces();
        return res.json(masterpieces.map(m => ({ id: m.id, name: m.title })));
      case "possessions":
        const possessions = await storage.getPossessions();
        return res.json(possessions.map(p => ({ id: p.id, name: p.name })));
      case "studies":
        const courses = await storage.getCourses();
        return res.json(courses.map(c => ({ id: c.id, name: c.name })));
      case "business":
        const businesses = await storage.getBusinesses();
        return res.json(businesses.map(b => ({ id: b.id, name: b.name })));
      case "work":
        const projects = await storage.getWorkProjects("work");
        return res.json(projects.map(p => ({ id: p.id, name: p.name })));
      case "social_purpose":
        const activities = await storage.getSocialActivities();
        return res.json(activities.map(a => ({ id: a.id, name: a.title })));
      case "second_brain":
      case "languages":
      case "language":
        const dbType = (normalizedType === "languages" || normalizedType === "language") ? "language" : normalizedType;
        const themes = await storage.getKnowledgeTopics(dbType);
        return res.json(themes.map(t => ({ id: t.id, name: t.name })));
      default:
        res.json([]);
    }
  });

  app.get("/api/page-settings", async (req, res) => {
    const settings = await storage.getPageSettings();
    res.json(settings);
  });

  app.post("/api/knowledge-topics", async (req, res) => {
    try {
      const data = insertKnowledgeTopicSchema.parse(req.body);
      const theme = await storage.createKnowledgeTopic(data);
      res.json(theme);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Invalid request data" });
    }
  });

  app.delete("/api/knowledge-topics/:id", async (req, res) => {
    await storage.deleteKnowledgeTopic(req.params.id);
    res.json({ success: true });
  });

  // Route for course chapters must come first (more specific path)
  app.get("/api/learn-plan-items/discipline/:disciplineId", async (req, res) => {
    const items = await storage.getLearnPlanItemsByDiscipline(req.params.disciplineId);
    res.json(items);
  });

  app.get("/api/learn-plan-items/course/:courseId", async (req, res) => {
    const items = await storage.getCourseLearnPlanItems(req.params.courseId);
    res.json(items);
  });

  app.get("/api/linkable-sub-items/:module/:itemId", async (req, res) => {
    const { module, itemId } = req.params;
    const normalizedModule = module.replace(/-/g, '_');

    switch (normalizedModule) {
      case "second_brain":
      case "languages":
      case "language":
        const items = await storage.getLearnPlanItems(itemId);
        return res.json(items.map(i => ({ id: i.id, name: i.title })));
      case "disciplines":
        const disciplineItems = await storage.getLearnPlanItemsByDiscipline(itemId);
        return res.json(disciplineItems.map(i => ({ id: i.id, name: i.title })));
      case "studies":
        const lessons = await storage.getCourseLearnPlanItems(itemId);
        return res.json(lessons.map(l => ({ id: l.id, name: l.title })));
      case "goals":
        const allGoals = await storage.getGoals();
        const subgoals = allGoals.filter(g => g.parentId === itemId);
        return res.json(subgoals.map(g => ({ id: g.id, name: g.title })));
      case "masterpieces":
        const sections = await storage.getMasterpieceSections(itemId);
        return res.json(sections.map(s => ({ id: s.id, name: s.title })));
      case "body":
        if (itemId === "body_workouts") {
          const exercises = await storage.getExerciseLibrary();
          return res.json(exercises.map(e => ({ id: e.id, name: e.name })));
        }
        if (itemId === "body_hygiene") {
          const today = new Date().toISOString().split('T')[0];
          const routines = await storage.getHygieneRoutines(today);
          return res.json(routines.map(r => ({ id: r.id, name: r.name || "Routine" })));
        }
        return res.json([]);
      case "business":
      case "work":
        const tasks = await storage.getTasks(itemId);
        return res.json(tasks.map(t => ({ id: t.id, name: t.title })));
      default:
        res.json([]);
    }
  });

  app.get("/api/learn-plan-items/:topicId", async (req, res) => {
    const items = await storage.getLearnPlanItems(req.params.topicId);
    res.json(items);
  });

  app.post("/api/learn-plan-items", async (req, res) => {
    const data = insertLearnPlanItemSchema.parse(req.body);
    const item = await storage.createLearnPlanItem(data);
    res.json(item);
  });

  app.patch("/api/learn-plan-items/:id", async (req, res) => {
    const item = await storage.updateLearnPlanItem(req.params.id, req.body);
    res.json(item);
  });

  app.delete("/api/learn-plan-items/:id", async (req, res) => {
    await storage.deleteLearnPlanItem(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/learn-plan-items/discipline/:disciplineId", async (req, res) => {
    const items = await storage.getLearnPlanItemsByDiscipline(req.params.disciplineId);
    res.json(items);
  });

  // Materials routes - more specific routes first
  app.get("/api/materials/chapter/:chapterId/with-children", async (req, res) => {
    const { childIds } = req.query;
    const childChapterIds = typeof childIds === 'string' ? childIds.split(',').filter(Boolean) : [];
    const materials = await storage.getMaterialsByChapterWithChildren(req.params.chapterId, childChapterIds);
    res.json(materials);
  });

  app.get("/api/materials/chapter/:chapterId", async (req, res) => {
    const materials = await storage.getMaterialsByChapter(req.params.chapterId);
    res.json(materials);
  });

  app.get("/api/materials/course/:courseId", async (req, res) => {
    const materials = await storage.getMaterialsByCourse(req.params.courseId);
    res.json(materials);
  });

  app.get("/api/materials/:topicId", async (req, res) => {
    const materials = await storage.getMaterials(req.params.topicId);
    res.json(materials);
  });

  app.get("/api/materials/discipline/:disciplineId", async (req, res) => {
    const materials = await storage.getMaterialsByDiscipline(req.params.disciplineId);
    res.json(materials);
  });

  app.post("/api/materials", async (req, res) => {
    const data = insertMaterialSchema.parse(req.body);
    const material = await storage.createMaterial(data);
    res.json(material);
  });

  app.patch("/api/materials/:id", async (req, res) => {
    const material = await storage.updateMaterial(req.params.id, req.body);
    res.json(material);
  });

  app.delete("/api/materials/:id", async (req, res) => {
    await storage.deleteMaterial(req.params.id);
    res.json({ success: true });
  });

  // Chapter Notes routes
  app.get("/api/notes/chapter/:chapterId", async (req, res) => {
    const notes = await storage.getNotesByChapter(req.params.chapterId);
    res.json(notes);
  });

  app.get("/api/notes/chapter/:chapterId/with-children", async (req, res) => {
    const { childIds } = req.query;
    const childChapterIds = typeof childIds === 'string' ? childIds.split(',').filter(Boolean) : [];
    const notes = await storage.getNotesByChapterWithChildren(req.params.chapterId, childChapterIds);
    res.json(notes);
  });

  app.get("/api/notes/:id", async (req, res) => {
    const note = await storage.getNote(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json(note);
  });

  app.post("/api/notes", async (req, res) => {
    const { insertChapterNoteSchema } = await import("@shared/schema");
    const data = insertChapterNoteSchema.parse(req.body);
    const note = await storage.createNote(data);
    res.json(note);
  });

  app.patch("/api/notes/:id", async (req, res) => {
    const note = await storage.updateNote(req.params.id, req.body);
    res.json(note);
  });

  app.delete("/api/notes/:id", async (req, res) => {
    await storage.deleteNote(req.params.id);
    res.json({ success: true });
  });

  // Flashcards routes - more specific routes first
  app.get("/api/flashcards/chapter/:chapterId/with-children", async (req, res) => {
    const { childIds } = req.query;
    const childChapterIds = typeof childIds === 'string' ? childIds.split(',').filter(Boolean) : [];
    const flashcards = await storage.getFlashcardsByChapterWithChildren(req.params.chapterId, childChapterIds);
    res.json(flashcards);
  });

  app.get("/api/flashcards/chapter/:chapterId", async (req, res) => {
    const flashcards = await storage.getFlashcardsByChapter(req.params.chapterId);
    res.json(flashcards);
  });

  app.get("/api/flashcards/discipline/:disciplineId", async (req, res) => {
    const flashcards = await storage.getFlashcardsByDiscipline(req.params.disciplineId);
    res.json(flashcards);
  });

  app.get("/api/flashcards/course/:courseId", async (req, res) => {
    const flashcards = await storage.getFlashcardsByCourse(req.params.courseId);
    res.json(flashcards);
  });

  app.get("/api/flashcards/theme/:topicId", async (req, res) => {
    const flashcards = await storage.getFlashcardsByTheme(req.params.topicId);
    res.json(flashcards);
  });

  app.post("/api/flashcards", async (req, res) => {
    const data = insertFlashcardSchema.parse(req.body);
    const flashcard = await storage.createFlashcard(data);
    res.json(flashcard);
  });

  app.patch("/api/flashcards/:id", async (req, res) => {
    const data = { ...req.body };
    if (data.lastReviewed && typeof data.lastReviewed === 'string') {
      data.lastReviewed = new Date(data.lastReviewed);
    }
    if (data.nextReview && typeof data.nextReview === 'string') {
      data.nextReview = new Date(data.nextReview);
    }
    const flashcard = await storage.updateFlashcard(req.params.id, data);
    res.json(flashcard);
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    await storage.deleteFlashcard(req.params.id);
    res.json({ success: true });
  });

  // ===== BODY =====
  app.get("/api/workouts/:date", async (req, res) => {
    const workouts = await storage.getWorkouts(req.params.date);
    // Enhance workouts with exercises
    const enhancedWorkouts = await Promise.all(workouts.map(async (w) => {
      const exercises = await storage.getWorkoutExercises(w.id);
      return { ...w, exercises };
    }));
    res.json(enhancedWorkouts);
  });

  app.post("/api/workouts", async (req, res) => {
    const data = insertWorkoutSchema.parse(req.body);
    const workout = await storage.createWorkout(data);
    res.json(workout);
  });

  app.get("/api/workouts/detail/:id", async (req, res) => {
    const workout = await storage.getWorkout(req.params.id);
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    const exercises = await storage.getWorkoutExercises(workout.id);
    res.json({ ...workout, exercises });
  });

  app.patch("/api/workouts/:id", async (req, res) => {
    const workout = await storage.updateWorkout(req.params.id, req.body);
    res.json(workout);
  });

  app.get("/api/workout-presets", async (req, res) => {
    const presets = await storage.getWorkoutPresets();
    res.json(presets);
  });

  app.post("/api/workout-presets", async (req, res) => {
    const { insertWorkoutPresetSchema } = await import("@shared/schema");
    const data = insertWorkoutPresetSchema.parse(req.body);
    const preset = await storage.createWorkoutPreset(data);
    res.json(preset);
  });

  app.delete("/api/workout-presets/:id", async (req, res) => {
    await storage.deleteWorkoutPreset(req.params.id);
    res.json({ success: true });
  });

  // Exercise Library
  app.get("/api/exercise-library", async (req, res) => {
    const library = await storage.getExerciseLibrary();
    res.json(library);
  });

  // Alias for legacy/frontend compatibility
  app.get("/api/exercises", async (req, res) => {
    const library = await storage.getExerciseLibrary();
    res.json(library);
  });

  app.post("/api/exercise-library", async (req, res) => {
    const data = insertExerciseLibrarySchema.parse(req.body);
    const item = await storage.createExerciseLibraryItem(data);
    res.json(item);
  });

  // Workout Execution
  app.get("/api/workouts/:id/exercises", async (req, res) => {
    const exercises = await storage.getWorkoutExercises(req.params.id);
    res.json(exercises);
  });

  app.post("/api/workout-exercises", async (req, res) => {
    const data = insertWorkoutExerciseSchema.parse(req.body);
    const we = await storage.createWorkoutExercise(data);
    res.json(we);
  });

  app.patch("/api/workout-exercises/:id", async (req, res) => {
    // Need to add updateWorkoutExercise to storage if not exists, but for now just skip or assume it exists? 
    // Actually I haven't added updateWorkoutExercise to storage interface. 
    // I'll skip this one for now as I might not need to update exercise-level notes often, 
    // but sets definitively need updates.
    res.status(501).json({ message: "Not implemented" });
  });

  app.post("/api/workout-sets", async (req, res) => {
    const data = insertWorkoutSetSchema.parse(req.body);
    const set = await storage.createWorkoutSet(data);
    res.json(set);
  });

  app.patch("/api/workout-sets/:id", async (req, res) => {
    // Need updateWorkoutSet in storage
    const set = await storage.updateWorkoutSet(req.params.id, req.body);
    res.json(set);
  });

  // Muscle Stats
  app.get("/api/muscle-stats", async (req, res) => {
    const stats = await storage.getMuscleStats();
    res.json(stats);
  });

  app.post("/api/muscle-stats", async (req, res) => {
    const { muscleId, recoveryScore } = req.body;
    const stat = await storage.upsertMuscleStat(muscleId, recoveryScore);
    res.json(stat);
  });

  app.get("/api/intake-logs/:date", async (req, res) => {
    const logs = await storage.getIntakeLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/intake-logs", async (req, res) => {
    const data = insertIntakeLogSchema.parse(req.body);
    const log = await storage.createIntakeLog(data);
    res.json(log);
  });

  app.get("/api/sleep-logs/:date", async (req, res) => {
    const logs = await storage.getSleepLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/sleep-logs", async (req, res) => {
    const data = insertSleepLogSchema.parse(req.body);
    const log = await storage.createSleepLog(data);
    res.json(log);
  });

  app.get("/api/hygiene-routines/:date", async (req, res) => {
    const routines = await storage.getHygieneRoutines(req.params.date);
    res.json(routines);
  });

  app.post("/api/hygiene-routines", async (req, res) => {
    const data = insertHygieneRoutineSchema.parse(req.body);
    const routine = await storage.createHygieneRoutine(data);
    res.json(routine);
  });

  // ===== WORSHIP =====
  app.get("/api/salah-logs/:date", async (req, res) => {
    const logs = await storage.getSalahLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/salah-logs", async (req, res) => {
    const data = insertSalahLogSchema.parse(req.body);
    const log = await storage.createSalahLog(data);
    res.json(log);
  });

  app.get("/api/quran-logs/:date", async (req, res) => {
    const logs = await storage.getQuranLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/quran-logs", async (req, res) => {
    const data = insertQuranLogSchema.parse(req.body);
    const log = await storage.createQuranLog(data);
    res.json(log);
  });

  app.get("/api/dhikr-logs/:date", async (req, res) => {
    const logs = await storage.getDhikrLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/dhikr-logs", async (req, res) => {
    const data = insertDhikrLogSchema.parse(req.body);
    const log = await storage.createDhikrLog(data);
    res.json(log);
  });

  app.get("/api/dua-logs/:date", async (req, res) => {
    const logs = await storage.getDuaLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/dua-logs", async (req, res) => {
    const data = insertDuaLogSchema.parse(req.body);
    const log = await storage.createDuaLog(data);
    res.json(log);
  });

  // ===== FINANCES =====
  app.get("/api/transactions", async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.post("/api/transactions", async (req, res) => {
    const data = insertTransactionSchema.parse(req.body);
    const transaction = await storage.createTransaction(data);
    res.json(transaction);
  });

  // ===== MASTERPIECES =====
  app.get("/api/masterpieces", async (req, res) => {
    const masterpieces = await storage.getMasterpieces();
    res.json(masterpieces);
  });

  app.post("/api/masterpieces", async (req, res) => {
    const data = insertMasterpieceSchema.parse(req.body);
    const masterpiece = await storage.createMasterpiece(data);
    res.json(masterpiece);
  });

  app.get("/api/masterpieces/:id/sections", async (req, res) => {
    const sections = await storage.getMasterpieceSections(req.params.id);
    res.json(sections);
  });

  app.post("/api/masterpiece-sections", async (req, res) => {
    const data = insertMasterpieceSectionSchema.parse(req.body);
    const section = await storage.createMasterpieceSection(data);
    res.json(section);
  });

  // ===== POSSESSIONS =====
  app.get("/api/possessions", async (req, res) => {
    const possessions = await storage.getPossessions();
    res.json(possessions);
  });

  app.post("/api/possessions", async (req, res) => {
    const data = insertPossessionSchema.parse(req.body);
    const possession = await storage.createPossession(data);
    res.json(possession);
  });

  app.patch("/api/possessions/:id", async (req, res) => {
    const possession = await storage.updatePossession(req.params.id, req.body);
    res.json(possession);
  });

  app.delete("/api/possessions/:id", async (req, res) => {
    await storage.deletePossession(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/outfits", async (req, res) => {
    const outfits = await storage.getOutfits();
    res.json(outfits);
  });

  app.post("/api/outfits", async (req, res) => {
    const data = insertOutfitSchema.parse(req.body);
    const outfit = await storage.createOutfit(data);
    res.json(outfit);
  });

  // ===== STUDIES =====
  app.get("/api/courses", async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const course = await storage.getCourse(req.params.id);
    res.json(course);
  });

  app.post("/api/courses", async (req, res) => {
    const data = insertCourseSchema.parse(req.body);
    const course = await storage.createCourse(data);
    res.json(course);
  });

  app.patch("/api/courses/:id", async (req, res) => {
    const course = await storage.updateCourse(req.params.id, req.body);
    res.json(course);
  });

  app.delete("/api/courses/:id", async (req, res) => {
    await storage.deleteCourse(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/courses/:id/lessons", async (req, res) => {
    const lessons = await storage.getLessons(req.params.id);
    res.json(lessons);
  });

  app.post("/api/lessons", async (req, res) => {
    const data = insertLessonSchema.parse(req.body);
    const lesson = await storage.createLesson(data);
    res.json(lesson);
  });

  app.patch("/api/lessons/:id", async (req, res) => {
    const lesson = await storage.updateLesson(req.params.id, req.body);
    res.json(lesson);
  });

  app.get("/api/lessons/:id/exercises", async (req, res) => {
    const exercises = await storage.getCourseExercises(req.params.id);
    res.json(exercises);
  });

  app.post("/api/course-exercises", async (req, res) => {
    const data = insertCourseExerciseSchema.parse(req.body);
    const exercise = await storage.createCourseExercise(data);
    res.json(exercise);
  });

  // ===== BUSINESS & WORK =====
  app.get("/api/businesses", async (req, res) => {
    const businesses = await storage.getBusinesses();
    res.json(businesses);
  });

  app.post("/api/businesses", async (req, res) => {
    const data = insertBusinessSchema.parse(req.body);
    const business = await storage.createBusiness(data);
    res.json(business);
  });

  app.get("/api/work-projects/:type", async (req, res) => {
    const relatedId = req.query.relatedId as string | undefined;
    const projects = await storage.getWorkProjects(req.params.type, relatedId);
    res.json(projects);
  });

  app.post("/api/work-projects", async (req, res) => {
    const data = insertWorkProjectSchema.parse(req.body);
    const project = await storage.createWorkProject(data);
    res.json(project);
  });

  app.get("/api/tasks/:projectId", async (req, res) => {
    const tasks = await storage.getTasks(req.params.projectId);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    const data = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(data);
    res.json(task);
  });

  // ===== SOCIAL PURPOSE =====
  app.get("/api/social-activities", async (req, res) => {
    const activities = await storage.getSocialActivities();
    res.json(activities);
  });

  app.post("/api/social-activities", async (req, res) => {
    const data = insertSocialActivitySchema.parse(req.body);
    const activity = await storage.createSocialActivity(data);
    res.json(activity);
  });

  app.get("/api/people", async (req, res) => {
    const people = await storage.getPeople();
    res.json(people);
  });

  app.post("/api/people", async (req, res) => {
    const data = insertPersonSchema.parse(req.body);
    const person = await storage.createPerson(data);
    res.json(person);
  });

  // ===== SETTINGS & METRICS =====
  app.get("/api/page-settings", async (req, res) => {
    const settings = await storage.getPageSettings();
    res.json(settings);
  });

  app.patch("/api/page-settings/:module", async (req, res) => {
    const setting = await storage.updatePageSetting(req.params.module, req.body.active);
    res.json(setting);
  });

  app.get("/api/daily-metrics/:date", async (req, res) => {
    const metric = await storage.getDailyMetric(req.params.date);
    res.json(metric);
  });

  app.get("/api/daily-metrics", async (req, res) => {
    const metrics = await storage.getAllDailyMetrics();
    res.json(metrics);
  });

  app.post("/api/daily-metrics", async (req, res) => {
    const data = insertDailyMetricSchema.parse(req.body);
    const metric = await storage.createDailyMetric(data);
    res.json(metric);
  });

  app.put("/api/daily-metrics/:date", async (req, res) => {
    const { plannerCompletion } = req.body;
    const metric = await storage.upsertDailyMetric(req.params.date, plannerCompletion);
    res.json(metric);
  });

  app.get("/api/knowledge-metrics/:topicId", async (req, res) => {
    const metrics = await storage.getKnowledgeMetrics(req.params.topicId);
    res.json(metrics);
  });

  app.get("/api/knowledge-metrics-all/:type", async (req, res) => {
    const metrics = await storage.getAllKnowledgeMetricsByType(req.params.type);
    res.json(metrics);
  });

  app.put("/api/knowledge-metrics/:topicId/:date", async (req, res) => {
    const { completion, readiness } = req.body;
    const metric = await storage.upsertKnowledgeMetric(req.params.topicId, req.params.date, completion, readiness);
    res.json(metric);
  });

  app.get("/api/course-metrics/:courseId", async (req, res) => {
    const metrics = await storage.getCourseMetrics(req.params.courseId);
    res.json(metrics);
  });

  app.get("/api/course-metrics-all", async (req, res) => {
    const metrics = await storage.getAllCourseMetrics();
    res.json(metrics);
  });

  app.put("/api/course-metrics/:courseId/:date", async (req, res) => {
    const { completion } = req.body;
    const completionNum = Number(completion);
    if (isNaN(completionNum) || completionNum < 0 || completionNum > 100) {
      return res.status(400).json({ error: "Completion must be a number between 0 and 100" });
    }
    const metric = await storage.upsertCourseMetric(req.params.courseId, req.params.date, completionNum);
    res.json(metric);
  });

  // ===== ULTIMATE TEST =====
  app.get("/api/ultimate-test/metrics", async (req, res) => {
    res.json({
      worship: 0,
      beneficial: 0,
      physical: 0,
      character: 0,
      knowledge: 0,
      speech: 0,
    });
  });

  // ===== AI ANALYSIS =====
  app.post("/api/ai/analyze-food", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ message: "Image data required" });
      }

      const { analyzeFoodImage } = await import("./services/gemini");
      const result = await analyzeFoodImage(image);
      res.json(result);
    } catch (error) {
      console.error("AI Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze food image" });
    }
  });

  // ===== DISCIPLINES MOODULE =====
  app.get("/api/disciplines", async (req, res) => {
    const disciplines = await storage.getDisciplines();
    res.json(disciplines);
  });

  app.get("/api/discipline-metrics-all", async (req, res) => {
    // For now, we can calculate the current completion for each discipline
    const disciplines = await storage.getDisciplines();
    const metrics = await Promise.all(disciplines.map(async (d) => {
      const completion = await storage.calculateDisciplineWeightedCompletion(d.id);
      return {
        topicId: d.id,
        topicName: d.name,
        date: new Date().toISOString().split('T')[0],
        completion: completion.toString(),
        importance: 0 // Placeholder
      };
    }));
    res.json(metrics);
  });

  app.get("/api/disciplines/:id", async (req, res) => {
    const discipline = await storage.getDiscipline(req.params.id);
    if (!discipline) return res.status(404).json({ message: "Discipline not found" });
    res.json(discipline);
  });

  app.post("/api/disciplines", async (req, res) => {
    try {
      const data = insertDisciplineSchema.parse(req.body);
      const discipline = await storage.createDiscipline(data);
      res.json(discipline);
    } catch (error: any) {
      console.error("Discipline creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create discipline" });
    }
  });

  app.patch("/api/disciplines/:id", async (req, res) => {
    const discipline = await storage.updateDiscipline(req.params.id, req.body);
    res.json(discipline);
  });

  app.delete("/api/disciplines/:id", async (req, res) => {
    await storage.deleteDiscipline(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/disciplines/:id/logs", async (req, res) => {
    const logs = await storage.getDisciplineLogs(req.params.id);
    res.json(logs);
  });

  app.post("/api/disciplines/:id/log", async (req, res) => {
    const data = insertDisciplineLogSchema.parse(req.body);

    // Create the log
    const log = await storage.createDisciplineLog({ ...data, disciplineId: req.params.id });

    // Update Discipline XP and Level logic
    const discipline = await storage.getDiscipline(req.params.id);
    if (discipline) {
      let level = discipline.level || 1;
      let currentXp = (discipline.currentXp || 0) + data.xpGained;
      let maxXp = discipline.maxXp || 100;

      // Level up logic
      while (currentXp >= maxXp) {
        currentXp -= maxXp;
        level += 1;
        maxXp = Math.floor(maxXp * 1.5);
      }

      await storage.updateDiscipline(req.params.id, {
        level,
        currentXp,
        maxXp
      });
    }

    res.json(log);
  });

  // ===== SOCIAL =====
  app.get("/api/users/:username/profile", async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Determine relationship
    let isFollowing = false;
    let isSelf = false;

    if (req.user) {
      isSelf = req.user.id === user.id;
      if (!isSelf) {
        const followers = await storage.getFollowers(user.id);
        isFollowing = followers.some(f => f.followerId === req.user!.id);
      }
    }

    // Check visibility logic
    // If public -> show. If private -> show only if following or self.
    const canView = !user.isPrivate || isFollowing || isSelf;

    // Fetch privacy settings
    const privacySettings = await storage.getPrivacySettings(user.id);
    const settingsMap = new Map(privacySettings.map(s => [s.module, s.visibility]));

    // Helper to check if a specific module is visible
    const isModuleVisible = (moduleName: string) => {
      if (isSelf) return true;
      const setting = settingsMap.get(moduleName as any) || "private"; // Default strict
      if (setting === "public") return true;
      if (setting === "followers" && isFollowing) return true;
      return false;
    };

    // Construct response
    const profile = {
      id: user.id,
      username: user.username,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      isPrivate: user.isPrivate,
      stats: {
        following: (await storage.getFollowing(user.id)).length,
        followers: (await storage.getFollowers(user.id)).length,
      },
      relationship: { isFollowing, isSelf },
      modules: {
        goals: isModuleVisible("goals") ? await storage.getGoals().then(gs => gs.length) : null, // Privacy-aware summary
        // Add more modules summaries based on visibility
      }
    };

    res.json(profile);
  });

  app.get("/api/users/search", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const query = (req.query.q as string) || "";

    try {
      const users = await storage.searchUsers(query);
      const myFollowing = await storage.getFollowing(req.user.id);
      const followingIds = new Set(myFollowing.map(f => f.followingId));

      // Sanitize and map results
      const results = users
        .filter(u => u.id !== req.user!.id) // Exclude self
        .map(u => ({
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          profileImageUrl: u.profileImageUrl,
          isFollowing: followingIds.has(u.id)
        }));

      res.json(results);
    } catch (err) {
      console.error("User search failed:", err);
      res.status(500).send("Search failed");
    }
  });

  app.post("/api/users/:id/follow", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (req.user.id === req.params.id) return res.status(400).send("Cannot follow self");

    // Check if user exists
    const target = await storage.getUser(req.params.id);
    if (!target) return res.status(404).send("User not found");

    // Check if already following
    const followers = await storage.getFollowers(req.params.id);
    if (followers.some(f => f.followerId === req.user!.id)) {
      return res.status(200).json({ message: "Already following" });
    }

    const follow = await storage.followUser(req.user.id, req.params.id);
    res.json(follow);
  });

  app.delete("/api/users/:id/follow", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    await storage.unfollowUser(req.user.id, req.params.id);
    res.sendStatus(200);
  });

  app.patch("/api/me/profile", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const { bio, username } = req.body;

    if (username && username !== req.user.username) {
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(400).json({ message: "Username already taken" });
    }

    const updated = await storage.upsertUser({
      ...req.user,
      ...(bio !== undefined ? { bio } : {}),
      ...(username !== undefined ? { username } : {})
    } as any);

    res.json(updated);
  });

  app.patch("/api/me/privacy", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    // Body: { module: string, visibility: 'public' | 'followers' | 'private' }
    // or { globalPrivate: boolean }

    if (req.body.globalPrivate !== undefined) {
      await storage.upsertUser({ ...req.user, isPrivate: req.body.globalPrivate } as any);
    }

    if (req.body.module && req.body.visibility) {
      const setting = await storage.upsertPrivacySetting({
        userId: req.user.id,
        module: req.body.module,
        visibility: req.body.visibility
      } as any);
    }

    res.sendStatus(200);
  });

  app.get("/api/me/privacy", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const settings = await storage.getPrivacySettings(req.user.id);
    res.json(settings);
  });



  const httpServer = createServer(app);
  return httpServer;
}

```

```filepath
server/storage.ts
```

```typescript
// Referenced from javascript_database blueprint - comprehensive storage for all DojoOS modules
import crypto from "crypto";
import {
  users, timeBlocks, dayPresets, activityPresets, goals, knowledgeTopics, learnPlanItems,
  materials, flashcards, chapterNotes, workouts, exerciseLibrary, workoutExercises, workoutSets, muscleStats, intakeLogs, sleepLogs, hygieneRoutines,
  workoutPresets,
  salahLogs, quranLogs, dhikrLogs, duaLogs, transactions, masterpieces, masterpieceSections,
  possessions, outfits, courses, lessons, courseExercises, courseMetrics, businesses, workProjects, tasks,
  socialActivities, people, pageSettings, dailyMetrics, knowledgeMetrics,
  type User, type InsertUser, type UpsertUser,
  type TimeBlock, type InsertTimeBlock, type DayPreset, type InsertDayPreset,
  type ActivityPreset, type InsertActivityPreset, type Goal, type InsertGoal,
  type KnowledgeTopic, type InsertKnowledgeTopic, type LearnPlanItem, type InsertLearnPlanItem,
  type Material, type InsertMaterial, type Flashcard, type InsertFlashcard,
  type ChapterNote, type InsertChapterNote,
  type Workout, type InsertWorkout,
  type ExerciseLibraryItem, type InsertExerciseLibraryItem,
  type WorkoutExercise, type InsertWorkoutExercise,
  type WorkoutSet, type InsertWorkoutSet,
  type MuscleStat, type InsertMuscleStat,
  type IntakeLog, type InsertIntakeLog, type SleepLog, type InsertSleepLog,
  type HygieneRoutine, type InsertHygieneRoutine, type SalahLog, type InsertSalahLog,
  type QuranLog, type InsertQuranLog, type DhikrLog, type InsertDhikrLog,
  type DuaLog, type InsertDuaLog, type Transaction, type InsertTransaction,
  type Masterpiece, type InsertMasterpiece, type MasterpieceSection, type InsertMasterpieceSection,
  type Possession, type InsertPossession, type Outfit, type InsertOutfit,
  type Course, type InsertCourse, type Lesson, type InsertLesson,
  type CourseExercise, type InsertCourseExercise, type CourseMetric, type Business, type InsertBusiness,
  type WorkProject, type InsertWorkProject, type Task, type InsertTask,
  type SocialActivity, type InsertSocialActivity, type Person, type InsertPerson,
  type PageSetting, type InsertPageSetting, type DailyMetric, type InsertDailyMetric,
  type KnowledgeMetric,
  type WorkoutPreset, type InsertWorkoutPreset,
  type Discipline, type InsertDiscipline, type DisciplineLog, type InsertDisciplineLog,
  disciplines, disciplineLogs,
  type Follow, type InsertFollow, type PrivacySetting, type InsertPrivacySetting, type UpdatePrivacySetting,
  follows, privacySettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, ilike, or } from "drizzle-orm"; // Added sql import

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Social & Privacy
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<Follow[]>;
  getFollowing(userId: string): Promise<Follow[]>;
  getPrivacySettings(userId: string): Promise<PrivacySetting[]>;
  upsertPrivacySetting(setting: InsertPrivacySetting): Promise<PrivacySetting>;

  // Time Blocks & Presets
  getTimeBlocks(date: string): Promise<TimeBlock[]>;
  getTimeBlock(id: string): Promise<TimeBlock | undefined>;
  getLinkedTimeBlocks(date: string, module: string, itemId?: string): Promise<TimeBlock[]>;
  createTimeBlock(data: InsertTimeBlock): Promise<TimeBlock>;
  updateTimeBlock(id: string, data: Partial<InsertTimeBlock>): Promise<TimeBlock>;
  deleteTimeBlock(id: string): Promise<void>;
  getDayPresets(): Promise<DayPreset[]>;
  createDayPreset(data: InsertDayPreset): Promise<DayPreset>;
  deleteDayPreset(id: string): Promise<void>;
  getActivityPresets(module: string): Promise<ActivityPreset[]>;
  createActivityPreset(data: InsertActivityPreset): Promise<ActivityPreset>;

  // Goals
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(data: InsertGoal): Promise<Goal>;
  updateGoal(id: string, data: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;

  // Knowledge Tracking
  getKnowledgeTopics(type: string): Promise<KnowledgeTopic[]>;
  getKnowledgeTopic(id: string): Promise<KnowledgeTopic | undefined>;
  createKnowledgeTopic(data: InsertKnowledgeTopic): Promise<KnowledgeTopic>;
  getLearnPlanItems(topicId: string): Promise<LearnPlanItem[]>;
  getCourseLearnPlanItems(courseId: string): Promise<LearnPlanItem[]>;
  createLearnPlanItem(data: InsertLearnPlanItem): Promise<LearnPlanItem>;
  updateLearnPlanItem(id: string, data: Partial<InsertLearnPlanItem>): Promise<LearnPlanItem>;
  deleteLearnPlanItem(id: string): Promise<void>;
  getMaterials(topicId: string): Promise<Material[]>;
  getMaterialsByCourse(courseId: string): Promise<Material[]>;
  getMaterialsByChapter(chapterId: string): Promise<Material[]>;
  getMaterialsByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<Material[]>;
  createMaterial(data: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, data: Partial<InsertMaterial>): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;
  getFlashcardsByTheme(topicId: string): Promise<Flashcard[]>;
  getFlashcardsByCourse(courseId: string): Promise<Flashcard[]>;
  getFlashcardsByChapter(chapterId: string): Promise<Flashcard[]>;
  getFlashcardsByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<Flashcard[]>;
  createFlashcard(data: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, data: Partial<InsertFlashcard>): Promise<Flashcard>;
  deleteFlashcard(id: string): Promise<void>;
  getLearnPlanItemsByDiscipline(disciplineId: string): Promise<LearnPlanItem[]>;
  getMaterialsByDiscipline(disciplineId: string): Promise<Material[]>;
  getFlashcardsByDiscipline(disciplineId: string): Promise<Flashcard[]>;

  // Chapter Notes
  getNotesByChapter(chapterId: string): Promise<ChapterNote[]>;
  getNotesByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<ChapterNote[]>;
  getNote(id: string): Promise<ChapterNote | undefined>;
  createNote(data: InsertChapterNote): Promise<ChapterNote>;
  updateNote(id: string, data: Partial<InsertChapterNote>): Promise<ChapterNote>;
  deleteNote(id: string): Promise<void>;

  // Body
  getWorkouts(date: string): Promise<Workout[]>;
  getWorkout(id: string): Promise<Workout | undefined>; // Added
  createWorkout(data: InsertWorkout): Promise<Workout>;
  updateWorkout(id: string, data: Partial<InsertWorkout>): Promise<Workout>; // Added update

  getExerciseLibrary(): Promise<ExerciseLibraryItem[]>;
  createExerciseLibraryItem(data: InsertExerciseLibraryItem): Promise<ExerciseLibraryItem>;

  getWorkoutExercises(workoutId: string): Promise<(WorkoutExercise & { exercise: ExerciseLibraryItem | null, sets: WorkoutSet[] })[]>;
  createWorkoutExercise(data: InsertWorkoutExercise): Promise<WorkoutExercise>;
  createWorkoutSet(data: InsertWorkoutSet): Promise<WorkoutSet>;
  updateWorkoutSet(id: string, data: Partial<InsertWorkoutSet>): Promise<WorkoutSet>; // Added update

  getMuscleStats(): Promise<MuscleStat[]>;
  upsertMuscleStat(muscleId: string, recoveryScore: number): Promise<MuscleStat>;

  getIntakeLogs(date: string): Promise<IntakeLog[]>;
  createIntakeLog(data: InsertIntakeLog): Promise<IntakeLog>;
  getSleepLogs(date: string): Promise<SleepLog[]>;
  createSleepLog(data: InsertSleepLog): Promise<SleepLog>;
  getHygieneRoutines(date: string): Promise<HygieneRoutine[]>;
  createHygieneRoutine(data: InsertHygieneRoutine): Promise<HygieneRoutine>;

  // Worship
  getSalahLogs(date: string): Promise<SalahLog[]>;
  createSalahLog(data: InsertSalahLog): Promise<SalahLog>;
  getQuranLogs(date: string): Promise<QuranLog[]>;
  createQuranLog(data: InsertQuranLog): Promise<QuranLog>;
  getDhikrLogs(date: string): Promise<DhikrLog[]>;
  createDhikrLog(data: InsertDhikrLog): Promise<DhikrLog>;
  getDuaLogs(date: string): Promise<DuaLog[]>;
  createDuaLog(data: InsertDuaLog): Promise<DuaLog>;

  // Workout Presets
  getWorkoutPresets(): Promise<WorkoutPreset[]>;
  createWorkoutPreset(data: InsertWorkoutPreset): Promise<WorkoutPreset>;
  deleteWorkoutPreset(id: string): Promise<void>;

  // Finances
  getTransactions(): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;

  // Masterpieces
  getMasterpieces(): Promise<Masterpiece[]>;
  createMasterpiece(data: InsertMasterpiece): Promise<Masterpiece>;
  getMasterpieceSections(masterpieceId: string): Promise<MasterpieceSection[]>;
  createMasterpieceSection(data: InsertMasterpieceSection): Promise<MasterpieceSection>;

  // Possessions
  getPossessions(): Promise<Possession[]>;
  createPossession(data: InsertPossession): Promise<Possession>;
  updatePossession(id: string, data: Partial<InsertPossession>): Promise<Possession>;
  deletePossession(id: string): Promise<void>;
  getOutfits(): Promise<Outfit[]>;
  createOutfit(data: InsertOutfit): Promise<Outfit>;

  // Studies
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(data: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course>;
  getLessons(courseId: string): Promise<Lesson[]>;
  createLesson(data: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson>;
  getCourseExercises(lessonId: string): Promise<CourseExercise[]>;
  createCourseExercise(data: InsertCourseExercise): Promise<CourseExercise>;
  deleteCourse(id: string): Promise<void>;
  deleteKnowledgeTopic(id: string): Promise<void>;
  updateIntakeLog(id: string, data: Partial<InsertIntakeLog>): Promise<IntakeLog>;
  deleteIntakeLog(id: string): Promise<void>;

  // Business & Work
  getBusinesses(): Promise<Business[]>;
  createBusiness(data: InsertBusiness): Promise<Business>;
  getWorkProjects(type: string, relatedId?: string): Promise<WorkProject[]>;
  createWorkProject(data: InsertWorkProject): Promise<WorkProject>;
  getTasks(projectId: string): Promise<Task[]>;
  createTask(data: InsertTask): Promise<Task>;

  // Social Purpose
  getSocialActivities(): Promise<SocialActivity[]>;
  createSocialActivity(data: InsertSocialActivity): Promise<SocialActivity>;
  getPeople(): Promise<Person[]>;
  createPerson(data: InsertPerson): Promise<Person>;

  // Settings & Metrics
  getPageSettings(): Promise<PageSetting[]>;
  updatePageSetting(module: string, active: boolean): Promise<PageSetting>;
  getDailyMetric(date: string): Promise<DailyMetric | undefined>;
  getAllDailyMetrics(): Promise<DailyMetric[]>;
  upsertDailyMetric(date: string, completion: number): Promise<DailyMetric>;
  createDailyMetric(data: InsertDailyMetric): Promise<DailyMetric>;
  getKnowledgeMetrics(topicId: string): Promise<KnowledgeMetric[]>;
  getAllKnowledgeMetricsByType(type: string): Promise<{ topicId: string; themeName: string; date: string; completion: string }[]>;
  upsertKnowledgeMetric(topicId: string, date: string, completion: number, readiness: number): Promise<KnowledgeMetric>;
  getCourseMetrics(courseId: string): Promise<CourseMetric[]>;
  getAllCourseMetrics(): Promise<{ courseId: string; courseName: string; date: string; completion: string }[]>;
  upsertCourseMetric(courseId: string, date: string, completion: number): Promise<CourseMetric>;

  // Disciplines
  getDisciplines(): Promise<Discipline[]>;
  getDiscipline(id: string): Promise<Discipline | undefined>;
  createDiscipline(data: InsertDiscipline): Promise<Discipline>;
  updateDiscipline(id: string, data: Partial<InsertDiscipline>): Promise<Discipline>;
  deleteDiscipline(id: string): Promise<void>;
  getDisciplineLogs(disciplineId: string): Promise<DisciplineLog[]>;
  createDisciplineLog(data: InsertDisciplineLog): Promise<DisciplineLog>;
  calculateDisciplineWeightedCompletion(disciplineId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) {
      return await db.select().from(users).limit(20);
    }

    // Fuzzy search on username, firstName, or lastName
    // Using ilike for case-insensitive matching in Postgres
    const searchPattern = `%${query}%`;
    const results = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, searchPattern),
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern)
        )
      )
      .limit(20); // Limit to top 20 matches

    return results;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Social & Privacy
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db.insert(follows).values({ followerId, followingId }).returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    return await db.select().from(follows).where(eq(follows.followingId, userId));
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    return await db.select().from(follows).where(eq(follows.followerId, userId));
  }

  async getPrivacySettings(userId: string): Promise<PrivacySetting[]> {
    return await db.select().from(privacySettings).where(eq(privacySettings.userId, userId));
  }

  async upsertPrivacySetting(setting: InsertPrivacySetting): Promise<PrivacySetting> {
    const [existing] = await db.select().from(privacySettings)
      .where(and(eq(privacySettings.userId, setting.userId), eq(privacySettings.module, setting.module)));

    if (existing) {
      const [updated] = await db.update(privacySettings)
        .set({ visibility: (setting.visibility || "private") as any, updatedAt: new Date() })
        .where(eq(privacySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(privacySettings).values({
        ...setting,
        visibility: setting.visibility || "private"
      } as any).returning();
      return created;
    }
  }

  // Time Blocks & Presets
  async getTimeBlocks(date: string): Promise<TimeBlock[]> {
    return await db.select().from(timeBlocks).where(eq(timeBlocks.date, date));
  }

  async getTimeBlock(id: string): Promise<TimeBlock | undefined> {
    const [block] = await db.select().from(timeBlocks).where(eq(timeBlocks.id, id));
    return block;
  }

  async getLinkedTimeBlocks(date: string, module: string, itemId?: string, subItemId?: string): Promise<TimeBlock[]> {
    const conditions = [
      eq(timeBlocks.date, date),
      eq(timeBlocks.linkedModule, module)
    ];
    if (itemId) {
      conditions.push(eq(timeBlocks.linkedItemId, itemId));
    }
    if (subItemId) {
      conditions.push(eq(timeBlocks.linkedSubItemId, subItemId));
    }
    return await db.select().from(timeBlocks).where(and(...conditions));
  }

  async createTimeBlock(data: InsertTimeBlock): Promise<TimeBlock> {
    // If this is a sub-block (has parentId), calculate the next order value
    if (data.parentId) {
      // Get all siblings (other sub-blocks with same parent) and all parent's tasks
      const siblings = await db.select().from(timeBlocks).where(eq(timeBlocks.parentId, data.parentId));
      const parent = await db.select().from(timeBlocks).where(eq(timeBlocks.id, data.parentId));

      // Find max order among siblings
      let maxOrder = -1;
      siblings.forEach((s: TimeBlock) => {
        if (typeof s.order === 'number' && s.order > maxOrder) {
          maxOrder = s.order;
        }
      });

      // Also check parent's tasks for their orders
      if (parent[0]?.tasks && Array.isArray(parent[0].tasks)) {
        parent[0].tasks.forEach((t: any) => {
          if (typeof t.order === 'number' && t.order > maxOrder) {
            maxOrder = t.order;
          }
        });
      }

      // Set order to next available
      data.order = maxOrder + 1;
    }

    const [block] = await db.insert(timeBlocks).values(data).returning();
    return block;
  }

  async updateTimeBlock(id: string, data: Partial<InsertTimeBlock>): Promise<TimeBlock> {
    // Only update if there are fields to update
    if (Object.keys(data).length === 0) {
      const block = await this.getTimeBlock(id);
      if (!block) throw new Error("Time block not found");
      return block;
    }
    const [block] = await db.update(timeBlocks).set(data).where(eq(timeBlocks.id, id)).returning();
    return block;
  }

  async deleteTimeBlock(id: string): Promise<void> {
    await db.delete(timeBlocks).where(eq(timeBlocks.id, id));
  }

  async getDayPresets(): Promise<DayPreset[]> {
    return await db.select().from(dayPresets).orderBy(desc(dayPresets.createdAt));
  }

  async createDayPreset(data: InsertDayPreset): Promise<DayPreset> {
    const [preset] = await db.insert(dayPresets).values(data).returning();
    return preset;
  }

  async deleteDayPreset(id: string): Promise<void> {
    await db.delete(dayPresets).where(eq(dayPresets.id, id));
  }

  async getActivityPresets(module: string): Promise<ActivityPreset[]> {
    return await db.select().from(activityPresets).where(eq(activityPresets.module, module));
  }

  async createActivityPreset(data: InsertActivityPreset): Promise<ActivityPreset> {
    const [preset] = await db.insert(activityPresets).values(data).returning();
    return preset;
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    return await db.select().from(goals).orderBy(desc(goals.createdAt));
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(data: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(goals).values(data).returning();
    return goal;
  }

  async updateGoal(id: string, data: Partial<InsertGoal>): Promise<Goal> {
    const [goal] = await db.update(goals).set(data).where(eq(goals.id, id)).returning();
    return goal;
  }

  async deleteGoal(id: string): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Knowledge Tracking
  async getKnowledgeTopics(type: string): Promise<KnowledgeTopic[]> {
    return await db.select().from(knowledgeTopics).where(eq(knowledgeTopics.type, type));
  }

  async getKnowledgeTopic(id: string): Promise<KnowledgeTopic | undefined> {
    const [theme] = await db.select().from(knowledgeTopics).where(eq(knowledgeTopics.id, id));
    return theme;
  }

  async createKnowledgeTopic(data: InsertKnowledgeTopic): Promise<KnowledgeTopic> {
    const [theme] = await db.insert(knowledgeTopics).values(data).returning();
    return theme;
  }

  async deleteKnowledgeTopic(id: string): Promise<void> {
    await db.delete(knowledgeMetrics).where(eq(knowledgeMetrics.topicId, id));
    await db.delete(knowledgeTopics).where(eq(knowledgeTopics.id, id));
  }

  async calculateWeightedCompletion(topicId: string): Promise<number> {
    const items = await db.select().from(learnPlanItems).where(eq(learnPlanItems.topicId, topicId));
    if (items.length === 0) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    for (const item of items) {
      const importance = item.importance || 3;
      totalWeight += importance;
      if (item.completed) {
        completedWeight += importance;
      }
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  async calculateDisciplineWeightedCompletion(disciplineId: string): Promise<number> {
    const items = await db.select().from(learnPlanItems).where(eq(learnPlanItems.disciplineId, disciplineId));
    if (items.length === 0) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    for (const item of items) {
      const importance = item.importance || 3;
      totalWeight += importance;
      if (item.completed) {
        completedWeight += importance;
      }
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  async calculateCourseWeightedCompletion(courseId: string): Promise<number> {
    const items = await db.select().from(learnPlanItems).where(eq(learnPlanItems.courseId, courseId));
    if (items.length === 0) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    for (const item of items) {
      const importance = item.importance || 3;
      totalWeight += importance;
      if (item.completed) {
        completedWeight += importance;
      }
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  async getLearnPlanItems(topicId: string): Promise<LearnPlanItem[]> {
    return await db.select().from(learnPlanItems).where(eq(learnPlanItems.topicId, topicId)).orderBy(asc(learnPlanItems.order));
  }

  async getCourseLearnPlanItems(courseId: string): Promise<LearnPlanItem[]> {
    return await db.select().from(learnPlanItems).where(eq(learnPlanItems.courseId, courseId)).orderBy(asc(learnPlanItems.order));
  }

  async createLearnPlanItem(data: InsertLearnPlanItem): Promise<LearnPlanItem> {
    const [item] = await db.insert(learnPlanItems).values(data).returning();
    return item;
  }

  async updateLearnPlanItem(id: string, data: Partial<InsertLearnPlanItem>): Promise<LearnPlanItem> {
    const [item] = await db.update(learnPlanItems).set(data).where(eq(learnPlanItems.id, id)).returning();
    return item;
  }

  async deleteLearnPlanItem(id: string): Promise<void> {
    await db.delete(learnPlanItems).where(eq(learnPlanItems.id, id));
  }

  async getMaterials(topicId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.topicId, topicId));
  }

  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.courseId, courseId));
  }

  async getMaterialsByChapter(chapterId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.chapterId, chapterId));
  }

  async getMaterialsByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<Material[]> {
    const allChapterIds = [chapterId, ...childChapterIds];
    const results = await Promise.all(
      allChapterIds.map(id => db.select().from(materials).where(eq(materials.chapterId, id)))
    );
    return results.flat().sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createMaterial(data: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(data).returning();
    return material;
  }

  async updateMaterial(id: string, data: Partial<InsertMaterial>): Promise<Material> {
    const [material] = await db.update(materials).set(data).where(eq(materials.id, id)).returning();
    return material;
  }

  async deleteMaterial(id: string): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  async getFlashcardsByTheme(topicId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.topicId, topicId));
  }

  async getFlashcardsByCourse(courseId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.courseId, courseId));
  }

  async getFlashcardsByChapter(chapterId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.chapterId, chapterId));
  }

  // Workout Presets
  async getWorkoutPresets(): Promise<WorkoutPreset[]> {
    return await db.select().from(workoutPresets).orderBy(desc(workoutPresets.createdAt));
  }

  async createWorkoutPreset(data: InsertWorkoutPreset): Promise<WorkoutPreset> {
    const [preset] = await db.insert(workoutPresets).values(data).returning();
    return preset;
  }

  async deleteWorkoutPreset(id: string): Promise<void> {
    await db.delete(workoutPresets).where(eq(workoutPresets.id, id));
  }

  async getFlashcardsByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<Flashcard[]> {
    const allChapterIds = [chapterId, ...childChapterIds];
    const results = await Promise.all(
      allChapterIds.map(id => db.select().from(flashcards).where(eq(flashcards.chapterId, id)))
    );
    return results.flat().sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createFlashcard(data: InsertFlashcard): Promise<Flashcard> {
    const [flashcard] = await db.insert(flashcards).values(data).returning();
    return flashcard;
  }

  async updateFlashcard(id: string, data: Partial<InsertFlashcard>): Promise<Flashcard> {
    const [flashcard] = await db.update(flashcards).set(data).where(eq(flashcards.id, id)).returning();
    return flashcard;
  }

  async deleteFlashcard(id: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  async getLearnPlanItemsByDiscipline(disciplineId: string): Promise<LearnPlanItem[]> {
    return await db.select().from(learnPlanItems).where(eq(learnPlanItems.disciplineId, disciplineId)).orderBy(asc(learnPlanItems.order));
  }

  async getMaterialsByDiscipline(disciplineId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.disciplineId, disciplineId));
  }

  async getFlashcardsByDiscipline(disciplineId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.disciplineId, disciplineId));
  }

  // Chapter Notes
  async getNotesByChapter(chapterId: string): Promise<ChapterNote[]> {
    return await db.select().from(chapterNotes).where(eq(chapterNotes.chapterId, chapterId)).orderBy(desc(chapterNotes.updatedAt));
  }

  async getNotesByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<ChapterNote[]> {
    const allChapterIds = [chapterId, ...childChapterIds];
    const results = await Promise.all(
      allChapterIds.map(id => db.select().from(chapterNotes).where(eq(chapterNotes.chapterId, id)))
    );
    return results.flat().sort((a, b) =>
      new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  }

  async getNote(id: string): Promise<ChapterNote | undefined> {
    const [note] = await db.select().from(chapterNotes).where(eq(chapterNotes.id, id));
    return note;
  }

  async createNote(data: InsertChapterNote): Promise<ChapterNote> {
    const [note] = await db.insert(chapterNotes).values(data).returning();
    return note;
  }

  async updateNote(id: string, data: Partial<InsertChapterNote>): Promise<ChapterNote> {
    const [note] = await db.update(chapterNotes).set({ ...data, updatedAt: new Date() }).where(eq(chapterNotes.id, id)).returning();
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(chapterNotes).where(eq(chapterNotes.id, id));
  }

  // Body
  async getWorkouts(date: string): Promise<Workout[]> {
    // Cast date string to timestamp for comparison, or use BETWEEN for day range
    // Since date is now timestamp in schema but passed as YYYY-MM-DD string here,
    // we need to handle it. Assuming input is YYYY-MM-DD.
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Using any for the between clause as Drizzle type inference can be strict
    return await db.select().from(workouts)
      .where(and(
        sql`${workouts.date} >= ${startOfDay}`,
        sql`${workouts.date} <= ${endOfDay}`
      ));
  }

  async getWorkout(id: string): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async createWorkout(data: InsertWorkout): Promise<Workout> {
    const [workout] = await db.insert(workouts).values(data).returning();
    return workout;
  }

  async updateWorkout(id: string, data: Partial<InsertWorkout>): Promise<Workout> {
    const [workout] = await db.update(workouts).set(data).where(eq(workouts.id, id)).returning();
    return workout;
  }

  async getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
    return await db.select().from(exerciseLibrary).orderBy(asc(exerciseLibrary.name));
  }

  async createExerciseLibraryItem(data: InsertExerciseLibraryItem): Promise<ExerciseLibraryItem> {
    const [item] = await db.insert(exerciseLibrary).values(data).returning();
    return item;
  }

  async getWorkoutExercises(workoutId: string): Promise<(WorkoutExercise & { exercise: ExerciseLibraryItem | null, sets: WorkoutSet[] })[]> {
    const wExercises = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, workoutId)).orderBy(asc(workoutExercises.order));

    const result = [];
    for (const we of wExercises) {
      const parentExercise = await db.select().from(exerciseLibrary).where(eq(exerciseLibrary.id, we.exerciseId));
      const sets = await db.select().from(workoutSets).where(eq(workoutSets.workoutExerciseId, we.id)).orderBy(asc(workoutSets.setNumber));
      result.push({
        ...we,
        exercise: parentExercise[0] || null,
        sets
      });
    }
    return result;
  }

  async createWorkoutExercise(data: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [we] = await db.insert(workoutExercises).values(data).returning();
    return we;
  }

  async createWorkoutSet(data: InsertWorkoutSet): Promise<WorkoutSet> {
    const [set] = await db.insert(workoutSets).values(data).returning();
    return set;
  }

  async updateWorkoutSet(id: string, data: Partial<InsertWorkoutSet>): Promise<WorkoutSet> {
    const [set] = await db.update(workoutSets).set(data).where(eq(workoutSets.id, id)).returning();
    return set;
  }

  async getMuscleStats(): Promise<MuscleStat[]> {
    return await db.select().from(muscleStats);
  }

  async upsertMuscleStat(muscleId: string, recoveryScore: number): Promise<MuscleStat> {
    const [existing] = await db.select().from(muscleStats).where(eq(muscleStats.muscleId, muscleId));
    if (existing) {
      const [updated] = await db.update(muscleStats).set({ recoveryScore, updatedAt: new Date() }).where(eq(muscleStats.muscleId, muscleId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(muscleStats).values({ muscleId, recoveryScore }).returning();
      return created;
    }
  }

  async getIntakeLogs(date: string): Promise<IntakeLog[]> {
    return await db.select().from(intakeLogs).where(eq(intakeLogs.date, new Date(date)));
  }

  async createIntakeLog(data: InsertIntakeLog): Promise<IntakeLog> {
    const [log] = await db.insert(intakeLogs).values(data).returning();
    return log;
  }

  async getSleepLogs(date: string): Promise<SleepLog[]> {
    return await db.select().from(sleepLogs).where(eq(sleepLogs.date, date));
  }

  async createSleepLog(data: InsertSleepLog): Promise<SleepLog> {
    const [log] = await db.insert(sleepLogs).values(data).returning();
    return log;
  }

  async getHygieneRoutines(date: string): Promise<HygieneRoutine[]> {
    return await db.select().from(hygieneRoutines).where(eq(hygieneRoutines.date, date));
  }

  async createHygieneRoutine(data: InsertHygieneRoutine): Promise<HygieneRoutine> {
    const [routine] = await db.insert(hygieneRoutines).values(data).returning();
    return routine;
  }

  // Worship
  async getSalahLogs(date: string): Promise<SalahLog[]> {
    return await db.select().from(salahLogs).where(eq(salahLogs.date, date));
  }

  async createSalahLog(data: InsertSalahLog): Promise<SalahLog> {
    const [log] = await db.insert(salahLogs).values(data).returning();
    return log;
  }

  async getQuranLogs(date: string): Promise<QuranLog[]> {
    return await db.select().from(quranLogs).where(eq(quranLogs.date, date));
  }

  async createQuranLog(data: InsertQuranLog): Promise<QuranLog> {
    const [log] = await db.insert(quranLogs).values(data).returning();
    return log;
  }

  async getDhikrLogs(date: string): Promise<DhikrLog[]> {
    return await db.select().from(dhikrLogs).where(eq(dhikrLogs.date, date));
  }

  async createDhikrLog(data: InsertDhikrLog): Promise<DhikrLog> {
    const [log] = await db.insert(dhikrLogs).values(data).returning();
    return log;
  }

  async getDuaLogs(date: string): Promise<DuaLog[]> {
    return await db.select().from(duaLogs).where(eq(duaLogs.date, date));
  }

  async createDuaLog(data: InsertDuaLog): Promise<DuaLog> {
    const [log] = await db.insert(duaLogs).values(data).returning();
    return log;
  }

  // Finances
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data).returning();
    return transaction;
  }

  // Masterpieces
  async getMasterpieces(): Promise<Masterpiece[]> {
    return await db.select().from(masterpieces).orderBy(desc(masterpieces.createdAt));
  }

  async createMasterpiece(data: InsertMasterpiece): Promise<Masterpiece> {
    const [masterpiece] = await db.insert(masterpieces).values(data).returning();
    return masterpiece;
  }

  async getMasterpieceSections(masterpieceId: string): Promise<MasterpieceSection[]> {
    return await db.select().from(masterpieceSections).where(eq(masterpieceSections.masterpieceId, masterpieceId)).orderBy(asc(masterpieceSections.order));
  }

  async createMasterpieceSection(data: InsertMasterpieceSection): Promise<MasterpieceSection> {
    const [section] = await db.insert(masterpieceSections).values(data).returning();
    return section;
  }

  // Possessions
  async getPossessions(): Promise<Possession[]> {
    return await db.select().from(possessions).orderBy(desc(possessions.createdAt));
  }

  async createPossession(data: InsertPossession): Promise<Possession> {
    const [possession] = await db.insert(possessions).values(data).returning();
    return possession;
  }

  async updatePossession(id: string, data: Partial<InsertPossession>): Promise<Possession> {
    const [possession] = await db.update(possessions).set(data).where(eq(possessions.id, id)).returning();
    return possession;
  }

  async deletePossession(id: string): Promise<void> {
    await db.delete(possessions).where(eq(possessions.id, id));
  }

  async getOutfits(): Promise<Outfit[]> {
    return await db.select().from(outfits).orderBy(desc(outfits.date));
  }

  async createOutfit(data: InsertOutfit): Promise<Outfit> {
    const [outfit] = await db.insert(outfits).values(data).returning();
    return outfit;
  }

  // Studies
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course> {
    const [course] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courseMetrics).where(eq(courseMetrics.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.order));
  }

  async createLesson(data: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(data).returning();
    return lesson;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson> {
    const [lesson] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return lesson;
  }

  async getCourseExercises(lessonId: string): Promise<CourseExercise[]> {
    return await db.select().from(courseExercises).where(eq(courseExercises.lessonId, lessonId));
  }

  async createCourseExercise(data: InsertCourseExercise): Promise<CourseExercise> {
    const [exercise] = await db.insert(courseExercises).values(data).returning();
    return exercise;
  }

  // Business & Work
  async getBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses).orderBy(desc(businesses.createdAt));
  }

  async createBusiness(data: InsertBusiness): Promise<Business> {
    const [business] = await db.insert(businesses).values(data).returning();
    return business;
  }

  async getWorkProjects(type: string, relatedId?: string): Promise<WorkProject[]> {
    if (relatedId) {
      return await db.select().from(workProjects).where(and(eq(workProjects.type, type), eq(workProjects.relatedId, relatedId)));
    }
    return await db.select().from(workProjects).where(eq(workProjects.type, type));
  }

  async createWorkProject(data: InsertWorkProject): Promise<WorkProject> {
    const [project] = await db.insert(workProjects).values(data).returning();
    return project;
  }

  async getTasks(projectId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  // Social Purpose
  async getSocialActivities(): Promise<SocialActivity[]> {
    return await db.select().from(socialActivities).orderBy(desc(socialActivities.date));
  }

  async createSocialActivity(data: InsertSocialActivity): Promise<SocialActivity> {
    const [activity] = await db.insert(socialActivities).values(data).returning();
    return activity;
  }

  async getPeople(): Promise<Person[]> {
    return await db.select().from(people).orderBy(asc(people.name));
  }

  async createPerson(data: InsertPerson): Promise<Person> {
    const [person] = await db.insert(people).values(data).returning();
    return person;
  }

  // Settings & Metrics
  async getPageSettings(): Promise<PageSetting[]> {
    return await db.select().from(pageSettings);
  }

  async updatePageSetting(module: string, active: boolean): Promise<PageSetting> {
    const [existing] = await db.select().from(pageSettings).where(eq(pageSettings.module, module));
    if (existing) {
      const [updated] = await db.update(pageSettings).set({ active }).where(eq(pageSettings.module, module)).returning();
      return updated;
    } else {
      const [created] = await db.insert(pageSettings).values({ module, active }).returning();
      return created;
    }
  }

  async getDailyMetric(date: string): Promise<DailyMetric | undefined> {
    const [metric] = await db.select().from(dailyMetrics).where(eq(dailyMetrics.date, date));
    return metric;
  }

  async createDailyMetric(data: InsertDailyMetric): Promise<DailyMetric> {
    const [metric] = await db.insert(dailyMetrics).values(data).returning();
    return metric;
  }

  async getAllDailyMetrics(): Promise<DailyMetric[]> {
    return await db.select().from(dailyMetrics).orderBy(asc(dailyMetrics.date));
  }

  async upsertDailyMetric(date: string, plannerCompletion: number): Promise<DailyMetric> {
    const existing = await this.getDailyMetric(date);
    if (existing) {
      const [updated] = await db.update(dailyMetrics)
        .set({ plannerCompletion: plannerCompletion.toString() })
        .where(eq(dailyMetrics.date, date))
        .returning();
      return updated;
    } else {
      return await this.createDailyMetric({ date, plannerCompletion: plannerCompletion.toString() });
    }
  }

  async getKnowledgeMetrics(topicId: string): Promise<KnowledgeMetric[]> {
    return await db.select().from(knowledgeMetrics)
      .where(eq(knowledgeMetrics.topicId, topicId))
      .orderBy(asc(knowledgeMetrics.date));
  }

  async upsertKnowledgeMetric(topicId: string, date: string, completion: number, readiness: number): Promise<KnowledgeMetric> {
    const weightedCompletion = await this.calculateWeightedCompletion(topicId);
    const [existing] = await db.select().from(knowledgeMetrics)
      .where(and(eq(knowledgeMetrics.topicId, topicId), eq(knowledgeMetrics.date, date)));

    if (existing) {
      const [updated] = await db.update(knowledgeMetrics)
        .set({ completion: weightedCompletion.toString(), readiness: readiness.toString() })
        .where(and(eq(knowledgeMetrics.topicId, topicId), eq(knowledgeMetrics.date, date)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(knowledgeMetrics)
        .values({ topicId, date, completion: weightedCompletion.toString(), readiness: readiness.toString() })
        .returning();
      return created;
    }
  }

  async getAllKnowledgeMetricsByType(type: string): Promise<{ topicId: string; themeName: string; date: string; completion: string; importance: number }[]> {
    const themes = await storage.getKnowledgeTopics("second_brain");
    const topicIds = themes.map((t: any) => t.id);

    if (topicIds.length === 0) return [];

    const allMetrics: { topicId: string; themeName: string; date: string; completion: string; importance: number }[] = [];

    for (const theme of themes) {
      const metrics = await db.select().from(knowledgeMetrics)
        .where(eq(knowledgeMetrics.topicId, theme.id))
        .orderBy(asc(knowledgeMetrics.date));

      const importance = await this.calculateWeightedCompletion(theme.id);

      for (const m of metrics) {
        allMetrics.push({
          topicId: theme.id,
          themeName: theme.name,
          date: m.date,
          completion: m.completion,
          importance,
        });
      }
    }

    return allMetrics;
  }

  async getCourseMetrics(courseId: string): Promise<CourseMetric[]> {
    return await db.select().from(courseMetrics)
      .where(eq(courseMetrics.courseId, courseId))
      .orderBy(asc(courseMetrics.date));
  }

  async getAllCourseMetrics(): Promise<{ courseId: string; courseName: string; date: string; completion: string; importance: number }[]> {
    const allCourses = await db.select().from(courses).where(eq(courses.archived, false));

    if (allCourses.length === 0) return [];

    const allMetrics: { courseId: string; courseName: string; date: string; completion: string; importance: number }[] = [];

    for (const course of allCourses) {
      const metrics = await db.select().from(courseMetrics)
        .where(eq(courseMetrics.courseId, course.id))
        .orderBy(asc(courseMetrics.date));

      const importance = await this.calculateCourseWeightedCompletion(course.id);

      for (const m of metrics) {
        allMetrics.push({
          courseId: course.id,
          courseName: course.name,
          date: m.date,
          completion: m.completion,
          importance,
        });
      }
    }

    return allMetrics;
  }

  async upsertCourseMetric(courseId: string, date: string, completion: number): Promise<CourseMetric> {
    const weightedCompletion = await this.calculateCourseWeightedCompletion(courseId);
    const [existing] = await db.select().from(courseMetrics)
      .where(and(eq(courseMetrics.courseId, courseId), eq(courseMetrics.date, date)));

    if (existing) {
      const [updated] = await db.update(courseMetrics)
        .set({ completion: weightedCompletion.toString() })
        .where(and(eq(courseMetrics.courseId, courseId), eq(courseMetrics.date, date)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(courseMetrics)
        .values({ courseId, date, completion: weightedCompletion.toString() })
        .returning();
      return created;
    }
  }

  async updateIntakeLog(id: string, data: Partial<InsertIntakeLog>): Promise<IntakeLog> {
    const [log] = await db.update(intakeLogs).set(data).where(eq(intakeLogs.id, id)).returning();
    return log;
  }

  async deleteIntakeLog(id: string): Promise<void> {
    await db.delete(intakeLogs).where(eq(intakeLogs.id, id));
  }

  // Disciplines
  async getDisciplines(): Promise<Discipline[]> {
    return await db.select().from(disciplines).orderBy(asc(disciplines.level));
  }

  async getDiscipline(id: string): Promise<Discipline | undefined> {
    const [discipline] = await db.select().from(disciplines).where(eq(disciplines.id, id));
    return discipline;
  }

  async createDiscipline(data: InsertDiscipline): Promise<Discipline> {
    const [discipline] = await db.insert(disciplines).values(data).returning();
    return discipline;
  }

  async updateDiscipline(id: string, data: Partial<InsertDiscipline>): Promise<Discipline> {
    const [discipline] = await db.update(disciplines).set(data).where(eq(disciplines.id, id)).returning();
    return discipline;
  }

  async deleteDiscipline(id: string): Promise<void> {
    await db.delete(disciplineLogs).where(eq(disciplineLogs.disciplineId, id));
    await db.delete(disciplines).where(eq(disciplines.id, id));
  }

  async getDisciplineLogs(disciplineId: string): Promise<DisciplineLog[]> {
    return await db.select().from(disciplineLogs).where(eq(disciplineLogs.disciplineId, disciplineId)).orderBy(desc(disciplineLogs.date));
  }

  async createDisciplineLog(data: InsertDisciplineLog): Promise<DisciplineLog> {
    const [log] = await db.insert(disciplineLogs).values(data).returning();
    return log;
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private timeBlocks: Map<string, TimeBlock>;
  private dayPresets: Map<string, DayPreset>;
  private activityPresets: Map<string, ActivityPreset>;
  private goals: Map<string, Goal>;
  private knowledgeTopics: Map<string, KnowledgeTopic>;
  private learnPlanItems: Map<string, LearnPlanItem>;
  private materials: Map<string, Material>;
  private flashcards: Map<string, Flashcard>;
  private chapterNotes: Map<string, ChapterNote>;
  private workouts: Map<string, Workout>;
  private exerciseLibrary: Map<string, ExerciseLibraryItem>;
  private workoutExercises: Map<string, WorkoutExercise>;
  private workoutSets: Map<string, WorkoutSet>;
  private muscleStats: Map<string, MuscleStat>;
  private intakeLogs: Map<string, IntakeLog>;
  private sleepLogs: Map<string, SleepLog>;
  private hygieneRoutines: Map<string, HygieneRoutine>;
  private salahLogs: Map<string, SalahLog>;
  private quranLogs: Map<string, QuranLog>;
  private dhikrLogs: Map<string, DhikrLog>;
  private duaLogs: Map<string, DuaLog>;
  private transactions: Map<string, Transaction>;
  private masterpieces: Map<string, Masterpiece>;
  private masterpieceSections: Map<string, MasterpieceSection>;
  private possessions: Map<string, Possession>;
  private outfits: Map<string, Outfit>;
  private courses: Map<string, Course>;
  private lessons: Map<string, Lesson>;
  private courseExercises: Map<string, CourseExercise>;
  private courseMetrics: Map<string, CourseMetric>;
  private businesses: Map<string, Business>;
  private workProjects: Map<string, WorkProject>;
  private tasks: Map<string, Task>;
  private socialActivities: Map<string, SocialActivity>;
  private people: Map<string, Person>;
  private pageSettings: Map<string, PageSetting>;
  private dailyMetrics: Map<string, DailyMetric>;
  private knowledgeMetrics: Map<string, KnowledgeMetric>;
  private disciplines: Map<string, Discipline>;
  private disciplineLogs: Map<string, DisciplineLog>;

  constructor() {
    this.users = new Map();
    this.timeBlocks = new Map();
    this.dayPresets = new Map();
    this.activityPresets = new Map();
    this.goals = new Map();
    this.knowledgeTopics = new Map();
    this.learnPlanItems = new Map();
    this.materials = new Map();
    this.flashcards = new Map();
    this.chapterNotes = new Map();
    this.workouts = new Map();
    this.exerciseLibrary = new Map();
    this.workoutExercises = new Map();
    this.workoutSets = new Map();
    this.muscleStats = new Map();
    this.intakeLogs = new Map();
    this.sleepLogs = new Map();
    this.hygieneRoutines = new Map();
    this.salahLogs = new Map();
    this.quranLogs = new Map();
    this.dhikrLogs = new Map();
    this.duaLogs = new Map();
    this.transactions = new Map();
    this.masterpieces = new Map();
    this.masterpieceSections = new Map();
    this.possessions = new Map();
    this.outfits = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.courseExercises = new Map();
    this.courseMetrics = new Map();
    this.businesses = new Map();
    this.workProjects = new Map();
    this.tasks = new Map();
    this.socialActivities = new Map();
    this.people = new Map();
    this.pageSettings = new Map();
    this.dailyMetrics = new Map();
    this.knowledgeMetrics = new Map();
    this.workoutPresets = new Map();
    this.disciplines = new Map();
    this.disciplineLogs = new Map();
    this.follows = new Map();
    this.privacySettings = new Map();

  }

  // Social & Privacy
  private follows: Map<string, Follow>;
  private privacySettings: Map<string, PrivacySetting>;

  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const id = this.generateId();
    const follow: Follow = { id, followerId, followingId, createdAt: new Date() };
    this.follows.set(id, follow);
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const follow = Array.from(this.follows.values()).find(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
    if (follow) {
      this.follows.delete(follow.id);
    }
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    return Array.from(this.follows.values()).filter((f) => f.followingId === userId);
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    return Array.from(this.follows.values()).filter((f) => f.followerId === userId);
  }

  async getPrivacySettings(userId: string): Promise<PrivacySetting[]> {
    return Array.from(this.privacySettings.values()).filter((s) => s.userId === userId);
  }

  async upsertPrivacySetting(setting: InsertPrivacySetting): Promise<PrivacySetting> {
    // Check for existing setting for this user+module
    const existing = Array.from(this.privacySettings.values()).find(
      (s) => s.userId === setting.userId && s.module === setting.module
    );

    if (existing) {
      const updated: PrivacySetting = {
        ...existing,
        visibility: (setting.visibility || "private") as any,
        updatedAt: new Date()
      };
      this.privacySettings.set(existing.id, updated);
      return updated;
    } else {
      const id = this.generateId();
      const newSetting: PrivacySetting = {
        ...setting,
        id,
        updatedAt: new Date(),
        visibility: setting.visibility || "private"
      } as any;
      this.privacySettings.set(id, newSetting);
      return newSetting;
    }
  }

  private generateId() { return crypto.randomUUID(); }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    const q = query.toLowerCase();

    return Array.from(this.users.values())
      .filter(user => {
        const matchUsername = user.username.toLowerCase().includes(q);
        const matchFirst = user.firstName?.toLowerCase().includes(q);
        const matchLast = user.lastName?.toLowerCase().includes(q);
        return matchUsername || matchFirst || matchLast;
      })
      .slice(0, 20);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user: User = {
      // Defaults
      id,
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),

      // Required from input
      username: insertUser.username,
      password: insertUser.password,

      // Optional fields defaulting to null/defaults
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      salt: insertUser.salt ?? null,
      encryptionKeySalt: insertUser.encryptionKeySalt ?? null,
      bio: insertUser.bio ?? null,
      isPrivate: insertUser.isPrivate ?? true,
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existing = await this.getUserByUsername(user.username);
    if (existing) {
      // Merge existing with update
      const updated: User = {
        ...existing,
        ...user,
        updatedAt: new Date()
      };
      this.users.set(existing.id, updated);
      return updated;
    }
    return this.createUser(user);
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  // Time Blocks & Presets
  async getTimeBlocks(date: string): Promise<TimeBlock[]> {
    return Array.from(this.timeBlocks.values()).filter(b => b.date === date);
  }
  async getTimeBlock(id: string): Promise<TimeBlock | undefined> { return this.timeBlocks.get(id); }
  async getLinkedTimeBlocks(date: string, module: string, itemId?: string, subItemId?: string): Promise<TimeBlock[]> {
    return Array.from(this.timeBlocks.values()).filter(b =>
      b.date === date &&
      b.linkedModule === module &&
      (itemId ? b.linkedItemId === itemId : true) &&
      (subItemId ? b.linkedSubItemId === subItemId : true)
    );
  }
  async createTimeBlock(data: InsertTimeBlock): Promise<TimeBlock> {
    const id = this.generateId();
    const block: TimeBlock = { ...data, id, createdAt: new Date() } as any;
    this.timeBlocks.set(id, block);
    return block;
  }
  async updateTimeBlock(id: string, data: Partial<InsertTimeBlock>): Promise<TimeBlock> {
    const existing = this.timeBlocks.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data } as any;
    this.timeBlocks.set(id, updated);
    return updated;
  }
  async deleteTimeBlock(id: string): Promise<void> { this.timeBlocks.delete(id); }
  async getDayPresets(): Promise<DayPreset[]> { return Array.from(this.dayPresets.values()); }
  async createDayPreset(data: InsertDayPreset): Promise<DayPreset> {
    const id = this.generateId();
    const preset: DayPreset = { ...data, id, createdAt: new Date() } as any;
    this.dayPresets.set(id, preset);
    return preset;
  }
  async deleteDayPreset(id: string): Promise<void> { this.dayPresets.delete(id); }
  async getActivityPresets(module: string): Promise<ActivityPreset[]> {
    return Array.from(this.activityPresets.values()).filter(p => p.module === module);
  }
  async createActivityPreset(data: InsertActivityPreset): Promise<ActivityPreset> {
    const id = this.generateId();
    const preset: ActivityPreset = { ...data, id } as any;
    this.activityPresets.set(id, preset);
    return preset;
  }

  // Goals
  async getGoals(): Promise<Goal[]> { return Array.from(this.goals.values()); }
  async getGoal(id: string): Promise<Goal | undefined> { return this.goals.get(id); }
  async createGoal(data: InsertGoal): Promise<Goal> {
    const id = this.generateId();
    const goal: Goal = { ...data, id, createdAt: new Date() } as any;
    this.goals.set(id, goal);
    return goal;
  }
  async updateGoal(id: string, data: Partial<InsertGoal>): Promise<Goal> {
    const existing = this.goals.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.goals.set(id, updated);
    return updated;
  }
  async deleteGoal(id: string): Promise<void> { this.goals.delete(id); }

  // Knowledge Tracking
  async getKnowledgeTopics(type: string): Promise<KnowledgeTopic[]> {
    return Array.from(this.knowledgeTopics.values()).filter(t => t.type === type);
  }
  async getKnowledgeTopic(id: string): Promise<KnowledgeTopic | undefined> { return this.knowledgeTopics.get(id); }
  async createKnowledgeTopic(data: InsertKnowledgeTopic): Promise<KnowledgeTopic> {
    const id = this.generateId();
    const topic: KnowledgeTopic = { ...data, id, createdAt: new Date() } as any;
    this.knowledgeTopics.set(id, topic);
    return topic;
  }
  async deleteKnowledgeTopic(id: string): Promise<void> { this.knowledgeTopics.delete(id); }
  async getLearnPlanItems(topicId: string): Promise<LearnPlanItem[]> {
    return Array.from(this.learnPlanItems.values()).filter(i => i.topicId === topicId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async getCourseLearnPlanItems(courseId: string): Promise<LearnPlanItem[]> {
    return Array.from(this.learnPlanItems.values()).filter(i => i.courseId === courseId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async createLearnPlanItem(data: InsertLearnPlanItem): Promise<LearnPlanItem> {
    const id = this.generateId();
    const item: LearnPlanItem = { ...data, id, createdAt: new Date() } as any;
    this.learnPlanItems.set(id, item);
    return item;
  }
  async updateLearnPlanItem(id: string, data: Partial<InsertLearnPlanItem>): Promise<LearnPlanItem> {
    const existing = this.learnPlanItems.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.learnPlanItems.set(id, updated);
    return updated;
  }
  async deleteLearnPlanItem(id: string): Promise<void> { this.learnPlanItems.delete(id); }
  async getMaterials(topicId: string): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(m => m.topicId === topicId);
  }
  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(m => m.courseId === courseId);
  }
  async getMaterialsByChapter(chapterId: string): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(m => m.chapterId === chapterId);
  }
  async getMaterialsByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<Material[]> {
    const ids = [chapterId, ...childChapterIds];
    return Array.from(this.materials.values()).filter(m => m.chapterId && ids.includes(m.chapterId));
  }
  async createMaterial(data: InsertMaterial): Promise<Material> {
    const id = this.generateId();
    const material: Material = { ...data, id, createdAt: new Date() } as any;
    this.materials.set(id, material);
    return material;
  }
  async updateMaterial(id: string, data: Partial<InsertMaterial>): Promise<Material> {
    const existing = this.materials.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.materials.set(id, updated);
    return updated;
  }
  async deleteMaterial(id: string): Promise<void> { this.materials.delete(id); }
  async getFlashcardsByTheme(topicId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(f => f.topicId === topicId);
  }
  async getFlashcardsByCourse(courseId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(f => f.courseId === courseId);
  }
  async getFlashcardsByChapter(chapterId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(f => f.chapterId === chapterId);
  }
  async getFlashcardsByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<Flashcard[]> {
    const ids = [chapterId, ...childChapterIds];
    return Array.from(this.flashcards.values()).filter(f => f.chapterId && ids.includes(f.chapterId));
  }
  async createFlashcard(data: InsertFlashcard): Promise<Flashcard> {
    const id = this.generateId();
    const flashcard: Flashcard = { ...data, id, createdAt: new Date() } as any;
    this.flashcards.set(id, flashcard);
    return flashcard;
  }
  async updateFlashcard(id: string, data: Partial<InsertFlashcard>): Promise<Flashcard> {
    const existing = this.flashcards.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.flashcards.set(id, updated);
    return updated;
  }
  async deleteFlashcard(id: string): Promise<void> { this.flashcards.delete(id); }

  async getLearnPlanItemsByDiscipline(disciplineId: string): Promise<LearnPlanItem[]> {
    return Array.from(this.learnPlanItems.values()).filter(i => i.disciplineId === disciplineId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getMaterialsByDiscipline(disciplineId: string): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(m => m.disciplineId === disciplineId);
  }

  async getFlashcardsByDiscipline(disciplineId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(f => f.disciplineId === disciplineId);
  }

  // Chapter Notes
  async getNotesByChapter(chapterId: string): Promise<ChapterNote[]> {
    return Array.from(this.chapterNotes.values()).filter(n => n.chapterId === chapterId);
  }
  async getNotesByChapterWithChildren(chapterId: string, childChapterIds: string[]): Promise<ChapterNote[]> {
    const ids = [chapterId, ...childChapterIds];
    return Array.from(this.chapterNotes.values()).filter(n => n.chapterId && ids.includes(n.chapterId));
  }
  async getNote(id: string): Promise<ChapterNote | undefined> { return this.chapterNotes.get(id); }
  async createNote(data: InsertChapterNote): Promise<ChapterNote> {
    const id = this.generateId();
    const note: ChapterNote = { ...data, id, createdAt: new Date(), updatedAt: new Date() } as any;
    this.chapterNotes.set(id, note);
    return note;
  }
  async updateNote(id: string, data: Partial<InsertChapterNote>): Promise<ChapterNote> {
    const existing = this.chapterNotes.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.chapterNotes.set(id, updated);
    return updated;
  }
  async deleteNote(id: string): Promise<void> { this.chapterNotes.delete(id); }

  // Body
  // Body
  async getWorkouts(date: string): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(w => {
      const wDate = w.date instanceof Date ? w.date.toISOString().split('T')[0] : w.date;
      return wDate === date;
    });
  }
  async getWorkout(id: string): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(data: InsertWorkout): Promise<Workout> {
    const id = this.generateId();
    const workout: Workout = { ...data, id, createdAt: new Date() } as any;
    this.workouts.set(id, workout);
    return workout;
  }
  async updateWorkout(id: string, data: Partial<InsertWorkout>): Promise<Workout> {
    const existing = this.workouts.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.workouts.set(id, updated);
    return updated;
  }

  async getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
    return Array.from(this.exerciseLibrary.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  async createExerciseLibraryItem(data: InsertExerciseLibraryItem): Promise<ExerciseLibraryItem> {
    const id = this.generateId();
    const item: ExerciseLibraryItem = { ...data, id, createdAt: new Date() } as any;
    this.exerciseLibrary.set(id, item);
    return item;
  }

  async getWorkoutExercises(workoutId: string): Promise<(WorkoutExercise & { exercise: ExerciseLibraryItem | null, sets: WorkoutSet[] })[]> {
    const wExercises = Array.from(this.workoutExercises.values()).filter(we => we.workoutId === workoutId).sort((a, b) => (a.order || 0) - (b.order || 0));
    return wExercises.map(we => {
      const exercise = this.exerciseLibrary.get(we.exerciseId) || null;
      const sets = Array.from(this.workoutSets.values()).filter(s => s.workoutExerciseId === we.id).sort((a, b) => a.setNumber - b.setNumber);
      return { ...we, exercise, sets };
    });
  }

  async createWorkoutExercise(data: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const id = this.generateId();
    const we: WorkoutExercise = { ...data, id } as any;
    this.workoutExercises.set(id, we);
    return we;
  }

  async createWorkoutSet(data: InsertWorkoutSet): Promise<WorkoutSet> {
    const id = this.generateId();
    const set: WorkoutSet = { ...data, id } as any;
    this.workoutSets.set(id, set);
    return set;
  }

  async updateWorkoutSet(id: string, data: Partial<InsertWorkoutSet>): Promise<WorkoutSet> {
    const existing = this.workoutSets.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.workoutSets.set(id, updated);
    return updated;
  }

  async getMuscleStats(): Promise<MuscleStat[]> {
    return Array.from(this.muscleStats.values());
  }
  async upsertMuscleStat(muscleId: string, recoveryScore: number): Promise<MuscleStat> {
    const existing = Array.from(this.muscleStats.values()).find(m => m.muscleId === muscleId);
    if (existing) {
      const updated = { ...existing, recoveryScore, updatedAt: new Date() };
      this.muscleStats.set(existing.id, updated);
      return updated;
    } else {
      const id = this.generateId();
      const created: MuscleStat = { id, muscleId, recoveryScore, lastTrained: null, volumeAccumulated: 0, updatedAt: new Date() };
      this.muscleStats.set(id, created);
      return created;
    }
  }
  async getIntakeLogs(date: string): Promise<IntakeLog[]> {
    return Array.from(this.intakeLogs.values()).filter(l => l.date.toISOString().split('T')[0] === date);
  }
  async createIntakeLog(data: InsertIntakeLog): Promise<IntakeLog> {
    const id = this.generateId();
    const log: IntakeLog = { ...data, id, createdAt: new Date() } as any;
    this.intakeLogs.set(id, log);
    return log;
  }
  async getSleepLogs(date: string): Promise<SleepLog[]> {
    return Array.from(this.sleepLogs.values()).filter(l => l.date === date);
  }
  async createSleepLog(data: InsertSleepLog): Promise<SleepLog> {
    const id = this.generateId();
    const log: SleepLog = { ...data, id, createdAt: new Date() } as any;
    this.sleepLogs.set(id, log);
    return log;
  }
  async getHygieneRoutines(date: string): Promise<HygieneRoutine[]> {
    return Array.from(this.hygieneRoutines.values()).filter(r => r.date === date);
  }
  async createHygieneRoutine(data: InsertHygieneRoutine): Promise<HygieneRoutine> {
    const id = this.generateId();
    const routine: HygieneRoutine = { ...data, id, createdAt: new Date() } as any;
    this.hygieneRoutines.set(id, routine);
    return routine;
  }

  // Worship
  async getSalahLogs(date: string): Promise<SalahLog[]> {
    return Array.from(this.salahLogs.values()).filter(l => l.date === date);
  }
  async createSalahLog(data: InsertSalahLog): Promise<SalahLog> {
    const id = this.generateId();
    const log: SalahLog = { ...data, id, createdAt: new Date() } as any;
    this.salahLogs.set(id, log);
    return log;
  }
  async getQuranLogs(date: string): Promise<QuranLog[]> {
    return Array.from(this.quranLogs.values()).filter(l => l.date === date);
  }
  async createQuranLog(data: InsertQuranLog): Promise<QuranLog> {
    const id = this.generateId();
    const log: QuranLog = { ...data, id, createdAt: new Date() } as any;
    this.quranLogs.set(id, log);
    return log;
  }
  async getDhikrLogs(date: string): Promise<DhikrLog[]> {
    return Array.from(this.dhikrLogs.values()).filter(l => l.date === date);
  }
  async createDhikrLog(data: InsertDhikrLog): Promise<DhikrLog> {
    const id = this.generateId();
    const log: DhikrLog = { ...data, id, createdAt: new Date() } as any;
    this.dhikrLogs.set(id, log);
    return log;
  }
  async getDuaLogs(date: string): Promise<DuaLog[]> {
    return Array.from(this.duaLogs.values()).filter(l => l.date === date);
  }
  async createDuaLog(data: InsertDuaLog): Promise<DuaLog> {
    const id = this.generateId();
    const log: DuaLog = { ...data, id, createdAt: new Date() } as any;
    this.duaLogs.set(id, log);
    return log;
  }

  // Finances
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }
  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const id = this.generateId();
    const transaction: Transaction = { ...data, id, createdAt: new Date() } as any;
    this.transactions.set(id, transaction);
    return transaction;
  }

  // Masterpieces
  async getMasterpieces(): Promise<Masterpiece[]> {
    return Array.from(this.masterpieces.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  async createMasterpiece(data: InsertMasterpiece): Promise<Masterpiece> {
    const id = this.generateId();
    const masterpiece: Masterpiece = { ...data, id, createdAt: new Date() } as any;
    this.masterpieces.set(id, masterpiece);
    return masterpiece;
  }
  async getMasterpieceSections(masterpieceId: string): Promise<MasterpieceSection[]> {
    return Array.from(this.masterpieceSections.values()).filter(s => s.masterpieceId === masterpieceId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async createMasterpieceSection(data: InsertMasterpieceSection): Promise<MasterpieceSection> {
    const id = this.generateId();
    const section: MasterpieceSection = { ...data, id } as any;
    this.masterpieceSections.set(id, section);
    return section;
  }

  // Possessions
  async getPossessions(): Promise<Possession[]> {
    return Array.from(this.possessions.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  async createPossession(data: InsertPossession): Promise<Possession> {
    const id = this.generateId();
    const possession: Possession = { ...data, id, createdAt: new Date() } as any;
    this.possessions.set(id, possession);
    return possession;
  }
  async updatePossession(id: string, data: Partial<InsertPossession>): Promise<Possession> {
    const existing = this.possessions.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.possessions.set(id, updated);
    return updated;
  }
  async deletePossession(id: string): Promise<void> {
    this.possessions.delete(id);
  }
  async getOutfits(): Promise<Outfit[]> {
    return Array.from(this.outfits.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }
  async createOutfit(data: InsertOutfit): Promise<Outfit> {
    const id = this.generateId();
    const outfit: Outfit = { ...data, id, createdAt: new Date() } as any;
    this.outfits.set(id, outfit);
    return outfit;
  }

  // Studies
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  async getCourse(id: string): Promise<Course | undefined> { return this.courses.get(id); }
  async createCourse(data: InsertCourse): Promise<Course> {
    const id = this.generateId();
    const course: Course = { ...data, id, createdAt: new Date() } as any;
    this.courses.set(id, course);
    return course;
  }
  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course> {
    const existing = this.courses.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.courses.set(id, updated);
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
    this.courseMetrics.forEach((m, k) => {
      if (m.courseId === id) this.courseMetrics.delete(k);
    });
    this.courses.delete(id);
  }
  async getLessons(courseId: string): Promise<Lesson[]> {
    return Array.from(this.lessons.values()).filter(l => l.courseId === courseId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async createLesson(data: InsertLesson): Promise<Lesson> {
    const id = this.generateId();
    const lesson: Lesson = { ...data, id, createdAt: new Date() } as any;
    this.lessons.set(id, lesson);
    return lesson;
  }
  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson> {
    const existing = this.lessons.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.lessons.set(id, updated);
    return updated;
  }
  async getCourseExercises(lessonId: string): Promise<CourseExercise[]> {
    return Array.from(this.courseExercises.values()).filter(e => e.lessonId === lessonId);
  }
  async createCourseExercise(data: InsertCourseExercise): Promise<CourseExercise> {
    const id = this.generateId();
    const exercise: CourseExercise = { ...data, id } as any;
    this.courseExercises.set(id, exercise);
    return exercise;
  }

  // Business & Work
  async getBusinesses(): Promise<Business[]> { return Array.from(this.businesses.values()); }
  async createBusiness(data: InsertBusiness): Promise<Business> {
    const id = this.generateId();
    const business: Business = { ...data, id, createdAt: new Date() } as any;
    this.businesses.set(id, business);
    return business;
  }
  async getWorkProjects(type: string, relatedId?: string): Promise<WorkProject[]> {
    return Array.from(this.workProjects.values()).filter(p => p.type === type && (relatedId ? p.relatedId === relatedId : true));
  }
  async createWorkProject(data: InsertWorkProject): Promise<WorkProject> {
    const id = this.generateId();
    const project: WorkProject = { ...data, id, createdAt: new Date() } as any;
    this.workProjects.set(id, project);
    return project;
  }
  async getTasks(projectId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.projectId === projectId);
  }
  async createTask(data: InsertTask): Promise<Task> {
    const id = this.generateId();
    const task: Task = { ...data, id, createdAt: new Date() } as any;
    this.tasks.set(id, task);
    return task;
  }

  // Social Purpose
  async getSocialActivities(): Promise<SocialActivity[]> { return Array.from(this.socialActivities.values()); }
  async createSocialActivity(data: InsertSocialActivity): Promise<SocialActivity> {
    const id = this.generateId();
    const activity: SocialActivity = { ...data, id, createdAt: new Date() } as any;
    this.socialActivities.set(id, activity);
    return activity;
  }
  async getPeople(): Promise<Person[]> { return Array.from(this.people.values()); }
  async createPerson(data: InsertPerson): Promise<Person> {
    const id = this.generateId();
    const person: Person = { ...data, id, createdAt: new Date() } as any;
    this.people.set(id, person);
    return person;
  }

  // Settings & Metrics
  async getPageSettings(): Promise<PageSetting[]> { return Array.from(this.pageSettings.values()); }
  async updatePageSetting(module: string, active: boolean): Promise<PageSetting> {
    const id = module;
    const setting: PageSetting = { module, active, id } as any;
    this.pageSettings.set(id, setting);
    return setting;
  }
  async getDailyMetric(date: string): Promise<DailyMetric | undefined> {
    return Array.from(this.dailyMetrics.values()).find(m => m.date === date);
  }
  async getAllDailyMetrics(): Promise<DailyMetric[]> { return Array.from(this.dailyMetrics.values()); }
  async upsertDailyMetric(date: string, completion: number): Promise<DailyMetric> {
    const existing = await this.getDailyMetric(date);
    const updated = { ...existing, date, plannerCompletion: completion.toString(), id: existing?.id || this.generateId() } as any;
    this.dailyMetrics.set(updated.id, updated);
    return updated;
  }
  async createDailyMetric(data: InsertDailyMetric): Promise<DailyMetric> {
    const id = this.generateId();
    const metric: DailyMetric = { ...data, id } as any;
    this.dailyMetrics.set(id, metric);
    return metric;
  }
  async getKnowledgeMetrics(topicId: string): Promise<KnowledgeMetric[]> {
    return Array.from(this.knowledgeMetrics.values()).filter(m => m.topicId === topicId);
  }
  async getAllKnowledgeMetricsByType(type: string): Promise<{ topicId: string; themeName: string; date: string; completion: string }[]> {
    return []; // Simplified for mock
  }
  async upsertKnowledgeMetric(topicId: string, date: string, completion: number, readiness: number): Promise<KnowledgeMetric> {
    const id = `${topicId}-${date}`;
    const metric: KnowledgeMetric = { topicId, date, completion: completion.toString(), readiness: readiness.toString(), id } as any;
    this.knowledgeMetrics.set(id, metric);
    return metric;
  }
  async getCourseMetrics(courseId: string): Promise<CourseMetric[]> {
    return Array.from(this.courseMetrics.values()).filter(m => m.courseId === courseId);
  }
  async getAllCourseMetrics(): Promise<{ courseId: string; courseName: string; date: string; completion: string }[]> {
    return []; // Simplified for mock
  }
  async upsertCourseMetric(courseId: string, date: string, completion: number): Promise<CourseMetric> {
    const id = `${courseId}-${date}`;
    const metric: CourseMetric = { courseId, date, completion: completion.toString(), id } as any;
    this.courseMetrics.set(id, metric);
    return metric;
  }

  async updateIntakeLog(id: string, data: Partial<InsertIntakeLog>): Promise<IntakeLog> {
    const existing = this.intakeLogs.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data } as IntakeLog;
    this.intakeLogs.set(id, updated);
    return updated;
  }

  async deleteIntakeLog(id: string): Promise<void> {
    this.intakeLogs.delete(id);
  }

  // Workout Presets
  private workoutPresets: Map<string, WorkoutPreset>;
  workoutPresetIdCounter = 1;

  async getWorkoutPresets(): Promise<WorkoutPreset[]> {
    return Array.from(this.workoutPresets.values()).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createWorkoutPreset(data: InsertWorkoutPreset): Promise<WorkoutPreset> {
    const id = this.generateId();
    const preset: WorkoutPreset = {
      id,
      name: data.name,
      exercises: data.exercises as any,
      lastPerformed: null,
      createdAt: new Date()
    };
    this.workoutPresets.set(id, preset);
    return preset;
  }

  async deleteWorkoutPreset(id: string): Promise<void> {
    this.workoutPresets.delete(id);
  }

  // Disciplines
  async getDisciplines(): Promise<Discipline[]> {
    return Array.from(this.disciplines.values()).sort((a, b) => (a.level || 0) - (b.level || 0));
  }

  async getDiscipline(id: string): Promise<Discipline | undefined> {
    return this.disciplines.get(id);
  }

  async createDiscipline(data: InsertDiscipline): Promise<Discipline> {
    const id = this.generateId();
    const discipline: Discipline = {
      ...data,
      id,
      level: data.level ?? 1,
      currentXp: data.currentXp ?? 0,
      maxXp: data.maxXp ?? 100,
      color: data.color ?? "text-primary",
      icon: data.icon ?? "Zap",
      createdAt: new Date()
    } as any;
    this.disciplines.set(id, discipline);
    return discipline;
  }

  async updateDiscipline(id: string, data: Partial<InsertDiscipline>): Promise<Discipline> {
    const existing = this.disciplines.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    this.disciplines.set(id, updated);
    return updated;
  }

  async deleteDiscipline(id: string): Promise<void> {
    // Delete logs first
    Array.from(this.disciplineLogs.values())
      .filter(l => l.disciplineId === id)
      .forEach(l => this.disciplineLogs.delete(l.id));
    this.disciplines.delete(id);
  }

  async getDisciplineLogs(disciplineId: string): Promise<DisciplineLog[]> {
    return Array.from(this.disciplineLogs.values())
      .filter(l => l.disciplineId === disciplineId)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }

  async createDisciplineLog(data: InsertDisciplineLog): Promise<DisciplineLog> {
    const id = this.generateId();
    const log: DisciplineLog = { ...data, id, date: new Date() } as any;
    this.disciplineLogs.set(id, log);
    return log;
  }

  async calculateDisciplineWeightedCompletion(disciplineId: string): Promise<number> {
    const items = Array.from(this.learnPlanItems.values()).filter(i => i.disciplineId === disciplineId);
    if (items.length === 0) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    for (const item of items) {
      const importance = item.importance || 3;
      totalWeight += importance;
      if (item.completed) {
        completedWeight += importance;
      }
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

```

```filepath
client/src/App.tsx
```

```typescript
import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient, getQueryFn } from "./lib/queryClient";
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
      <Route path="/body/workout/active/:id" component={ProtectedActiveWorkoutSession} />
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
    <header className="flex items-center justify-between h-16 px-4 border-b bg-background sticky top-0 z-40 shrink-0">
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
        <span className="text-sm font-medium text-muted-foreground">
          DojoOS
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
    hasTrajectorySidebar,
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

  const desktopShowTrajectory = hasTrajectorySidebar
    ? (trajectorySidebarOpen || !mainSidebarOpen)
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
      <div className="flex h-[100dvh] w-full overflow-hidden">
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

            <Sheet open={hasTrajectorySidebar && trajectorySidebarOpen} onOpenChange={setTrajectorySidebarOpen}>
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
            {/* Always render AppSidebar on desktop to allow CSS transitions */}
            <AppSidebar />
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
  '/body/workout/active/'
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

```

```filepath
client/src/contexts/theme-context.tsx
```

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageSetting } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MODULE_THEMES as DEFAULT_THEMES } from "@/lib/constants";

// Map of user-friendly color names to Tailwind HSL vars
export const PRESET_COLORS = {
    red: { label: "Red", class: "text-red-500", cssVar: "0 84.2% 60.2%" },
    orange: { label: "Orange", class: "text-orange-500", cssVar: "24.6 95% 53.1%" },
    amber: { label: "Amber", class: "text-amber-500", cssVar: "38 92% 50%" },
    yellow: { label: "Yellow", class: "text-yellow-500", cssVar: "47.9 95.8% 53.1%" },
    lime: { label: "Lime", class: "text-lime-500", cssVar: "84 81% 44%" },
    green: { label: "Green", class: "text-green-500", cssVar: "142.1 76.2% 36.3%" },
    emerald: { label: "Emerald", class: "text-emerald-500", cssVar: "160 84% 39%" },
    teal: { label: "Teal", class: "text-teal-500", cssVar: "173 80% 40%" },
    cyan: { label: "Cyan", class: "text-cyan-500", cssVar: "189 94% 43%" },
    sky: { label: "Sky", class: "text-sky-500", cssVar: "199 89% 48%" },
    blue: { label: "Blue", class: "text-blue-500", cssVar: "221.2 83.2% 53.3%" },
    indigo: { label: "Indigo", class: "text-indigo-500", cssVar: "226 71% 55%" },
    violet: { label: "Violet", class: "text-violet-500", cssVar: "262.1 83.3% 57.8%" },
    purple: { label: "Purple", class: "text-purple-500", cssVar: "271 81% 56%" },
    fuchsia: { label: "Fuchsia", class: "text-fuchsia-500", cssVar: "292 84% 61%" },
    pink: { label: "Pink", class: "text-pink-500", cssVar: "330 81% 60%" },
    rose: { label: "Rose", class: "text-rose-500", cssVar: "343 88% 61%" },
};

type ThemeParams = { color: string; cssVar: string };

interface ThemeContextType {
    getModuleTheme: (path: string) => ThemeParams;
    setModuleTheme: (module: string, colorKey: string) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [localThemes, setLocalThemes] = useState<Record<string, string>>({});

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("dojoModuleThemes");
            if (saved) {
                setLocalThemes(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load themes", e);
        }
    }, []);

    // Fetch settings from API (still try to sync, but don't block)
    const { data: pageSettings, isLoading } = useQuery<PageSetting[]>({
        queryKey: ["/api/page-settings"],
    });

    // Check remote settings but prioritize local edits if conflicts, for now we merge remote if local is missing
    useEffect(() => {
        if (pageSettings) {
            // If we have remote settings with colors, merge them into local state IF not already set?
            // Or actually, let's treat local as the master for this session to be fast.
            // If local is empty, populate from remote.
            setLocalThemes(prev => {
                const next = { ...prev };
                let changed = false;
                pageSettings.forEach(p => {
                    if (p.color && !next[p.module]) {
                        next[p.module] = p.color;
                        changed = true;
                    }
                });
                if (changed) return next;
                return prev;
            });
        }
    }, [pageSettings]);

    // Mutation to save settings
    const mutation = useMutation({
        mutationFn: async ({ module, color }: { module: string; color: string }) => {
            // 1. Update Local State & Storage immediately
            const newThemes = { ...localThemes, [module]: color };
            setLocalThemes(newThemes);
            localStorage.setItem("dojoModuleThemes", JSON.stringify(newThemes));

            // 2. Try to sync to backend (best effort)
            // If backend fails (e.g. schema missing), we catch and ignore
            try {
                // We need to match the module ID to an API resource. 
                // Using 'page-settings' is correct but we need to know if we are POSTing or PATCHing.
                const existing = pageSettings?.find(p => p.module === module);

                if (existing) {
                    await apiRequest("PATCH", `/api/page-settings/${existing.id}`, { color, active: existing.active });
                } else {
                    await apiRequest("POST", "/api/page-settings", { module, color, active: true });
                }
            } catch (err) {
                console.warn("Theme sync failed (backend likely missing 'color' column), using local storage.", err);
            }
        },
        onSuccess: () => {
            // We invalidate queries to get latest ID if we just POSTed, but we don't depend on it for UI
            queryClient.invalidateQueries({ queryKey: ["/api/page-settings"] });
        },
    });

    const getModuleTheme = (path: string): ThemeParams => {
        // Normalize path to ID: "/body" -> "body", "body" -> "body"
        const normalizedId = path.startsWith("/") ? path.substring(1) : path;

        // 1. Check local themes (master record)
        const colorKey = localThemes[normalizedId];
        if (colorKey && PRESET_COLORS[colorKey as keyof typeof PRESET_COLORS]) {
            const preset = PRESET_COLORS[colorKey as keyof typeof PRESET_COLORS];
            return { color: preset.class, cssVar: preset.cssVar };
        }

        // 2. Fallback to default constants
        const defaultKey = "/" + normalizedId;
        return DEFAULT_THEMES[defaultKey] || { color: "", cssVar: "" };
    };

    const setModuleTheme = (module: string, colorKey: string) => {
        const normalizedId = module.startsWith("/") ? module.substring(1) : module;
        mutation.mutate({ module: normalizedId, color: colorKey });
    };

    return (
        <ThemeContext.Provider value={{ getModuleTheme, setModuleTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}

```

```filepath
client/src/lib/queryClient.ts
```

```typescript
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

```

