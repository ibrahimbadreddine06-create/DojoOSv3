import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, date, decimal, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ===== ENUMS =====
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const salahStatusEnum = pgEnum("salah_status", ["on_time", "late", "makeup", "missed"]);
export const laundryStatusEnum = pgEnum("laundry_status", ["clean", "second_wear", "dirty"]);
export const moduleEnum = pgEnum("module", [
  "planner", "goals", "second_brain", "languages", "disciplines",
  "body", "body_workout", "body_intake", "body_sleep", "body_hygiene",
  "worship", "finances", "masterpieces", "possessions", "studies",
  "business", "work", "social_purpose"
]);

// ===== TIME BLOCKS & PRESETS =====
export const timeBlocks = pgTable("time_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id"), // For sub-blocks (max 2 levels deep)
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  linkedModule: text("linked_module"), // Which module this block is linked to (e.g., "languages", "second_brain")
  linkedItemId: varchar("linked_item_id"), // ID of the linked theme/language/course
  linkedSubItemId: varchar("linked_sub_item_id"), // ID of the linked sub-item (chapter/lesson)
  tasks: jsonb("tasks").$type<{ id: string; text: string; completed: boolean; importance: number }[]>().default([]),
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
export const knowledgeThemes = pgTable("knowledge_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "second_brain", "language", "discipline"
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const learnPlanItems = pgTable("learn_plan_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  themeId: varchar("theme_id"), // For Second Brain / Languages
  courseId: varchar("course_id"), // For Studies (courses)
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
  themeId: varchar("theme_id"), // For Second Brain / Languages
  courseId: varchar("course_id"), // For Studies (courses)
  chapterId: varchar("chapter_id"), // Optional: link material to specific chapter
  type: text("type").notNull(), // "pdf", "video", "link", "file"
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  themeId: varchar("theme_id"), // For Second Brain / Languages
  courseId: varchar("course_id"), // For Studies (courses)
  chapterId: varchar("chapter_id"), // Optional: link to specific chapter
  front: text("front").notNull(),
  back: text("back").notNull(),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  ease: decimal("ease", { precision: 3, scale: 2 }).default("2.5"),
  interval: integer("interval").default(0),
  mastery: integer("mastery").notNull().default(0), // 0=new, 1=bad, 2=okay, 3=good, 4=perfect
  createdAt: timestamp("created_at").defaultNow(),
});

export const knowledgeMetrics = pgTable("knowledge_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  themeId: varchar("theme_id").notNull(),
  date: date("date").notNull(),
  completion: decimal("completion", { precision: 5, scale: 2 }).notNull(), // Percentage
  readiness: decimal("readiness", { precision: 5, scale: 2 }).notNull(), // Percentage
});

export const knowledgeThemesRelations = relations(knowledgeThemes, ({ many }) => ({
  learnPlanItems: many(learnPlanItems),
  materials: many(materials),
  metrics: many(knowledgeMetrics),
}));

export const learnPlanItemsRelations = relations(learnPlanItems, ({ one, many }) => ({
  theme: one(knowledgeThemes, {
    fields: [learnPlanItems.themeId],
    references: [knowledgeThemes.id],
  }),
  course: one(courses, {
    fields: [learnPlanItems.courseId],
    references: [courses.id],
  }),
  parent: one(learnPlanItems, {
    fields: [learnPlanItems.parentId],
    references: [learnPlanItems.id],
    relationName: "subChapters"
  }),
  children: many(learnPlanItems, { relationName: "subChapters" }),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  theme: one(knowledgeThemes, {
    fields: [materials.themeId],
    references: [knowledgeThemes.id],
  }),
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
  chapter: one(learnPlanItems, {
    fields: [materials.chapterId],
    references: [learnPlanItems.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  theme: one(knowledgeThemes, {
    fields: [flashcards.themeId],
    references: [knowledgeThemes.id],
  }),
  course: one(courses, {
    fields: [flashcards.courseId],
    references: [courses.id],
  }),
  chapter: one(learnPlanItems, {
    fields: [flashcards.chapterId],
    references: [learnPlanItems.id],
  }),
}));

export const knowledgeMetricsRelations = relations(knowledgeMetrics, ({ one }) => ({
  theme: one(knowledgeThemes, {
    fields: [knowledgeMetrics.themeId],
    references: [knowledgeThemes.id],
  }),
}));

// ===== BODY TRACKING =====
export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id").notNull(),
  name: text("name").notNull(),
  sets: integer("sets"),
  reps: integer("reps"),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  notes: text("notes"),
});

export const intakeLogs = pgTable("intake_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  mealName: text("meal_name"),
  calories: decimal("calories", { precision: 7, scale: 2 }),
  protein: decimal("protein", { precision: 6, scale: 2 }),
  carbs: decimal("carbs", { precision: 6, scale: 2 }),
  fats: decimal("fats", { precision: 6, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sleepLogs = pgTable("sleep_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
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
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  workout: one(workouts, {
    fields: [exercises.workoutId],
    references: [workouts.id],
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

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
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
export const insertKnowledgeThemeSchema = createInsertSchema(knowledgeThemes).omit({ id: true, createdAt: true });
export const insertLearnPlanItemSchema = createInsertSchema(learnPlanItems).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true });
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
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

// ===== TYPES =====
export type TimeBlock = typeof timeBlocks.$inferSelect;
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type DayPreset = typeof dayPresets.$inferSelect;
export type InsertDayPreset = z.infer<typeof insertDayPresetSchema>;
export type ActivityPreset = typeof activityPresets.$inferSelect;
export type InsertActivityPreset = z.infer<typeof insertActivityPresetSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type KnowledgeTheme = typeof knowledgeThemes.$inferSelect;
export type InsertKnowledgeTheme = z.infer<typeof insertKnowledgeThemeSchema>;
export type LearnPlanItem = typeof learnPlanItems.$inferSelect;
export type InsertLearnPlanItem = z.infer<typeof insertLearnPlanItemSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
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
