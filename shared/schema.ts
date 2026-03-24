import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, date, decimal, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== ENUMS =====
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const salahStatusEnum = pgEnum("salah_status", ["on_time", "late", "makeup", "missed"]);
export const laundryStatusEnum = pgEnum("laundry_status", ["clean", "second_wear", "dirty"]);
export const intakeStatusEnum = pgEnum("intake_status", ["planned", "consumed"]);
export const fastingStatusEnum = pgEnum("fasting_status", ["active", "completed", "cancelled"]);
export const hygieneFrequencyEnum = pgEnum("hygiene_frequency", ["daily", "weekly", "monthly"]);
export const moduleEnum = pgEnum("module", [
  "planner", "goals", "second_brain", "languages", "disciplines",
  "body", "body_workout", "body_intake", "body_sleep", "body_hygiene",
  "worship", "finances", "masterpieces", "possessions", "studies",
  "business", "work", "social_purpose"
]);
export const visibilityEnum = pgEnum("visibility", ["public", "followers", "private"]);

// ===== AUTHENTICATION =====
// Session storage table - mandatory for Authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Authentication
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
  trajectoryContext: jsonb("trajectory_context").$type<{
    goal: string;
    context: string;
    structure: string;
    submoduleType: string;
    submoduleName: string;
    createdAt: string;
  }>(),
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
  thumbnailUrl: text("thumbnail_url"), // YouTube thumbnail or website preview
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
  linkedBlockId: varchar("linked_block_id"), // optional FK to timeBlocks
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
  // Legacy columns kept for DB compatibility (do not remove)
  difficulty: text("difficulty"),
  met: text("met"),
  recommendedReps: text("recommended_reps"),
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
  date: timestamp("date").notNull(),
  mealName: text("meal_name"),
  mealType: text("meal_type"), // breakfast, lunch, dinner, snack
  calories: decimal("calories", { precision: 7, scale: 2 }),
  protein: decimal("protein", { precision: 6, scale: 2 }),
  carbs: decimal("carbs", { precision: 6, scale: 2 }),
  fats: decimal("fats", { precision: 6, scale: 2 }),
  // Micronutrients
  fiber: decimal("fiber", { precision: 6, scale: 2 }),
  sugar: decimal("sugar", { precision: 6, scale: 2 }),
  sodium: decimal("sodium", { precision: 7, scale: 2 }), // mg
  zinc: decimal("zinc", { precision: 6, scale: 2 }), // mg
  magnesium: decimal("magnesium", { precision: 6, scale: 2 }), // mg
  vitaminD: decimal("vitamin_d", { precision: 6, scale: 2 }), // mcg
  vitaminC: decimal("vitamin_c", { precision: 6, scale: 2 }), // mg
  iron: decimal("iron", { precision: 6, scale: 2 }), // mg
  calcium: decimal("calcium", { precision: 7, scale: 2 }), // mg
  potassium: decimal("potassium", { precision: 7, scale: 2 }), // mg
  water: decimal("water", { precision: 6, scale: 2 }), // ml
  vitaminB12: decimal("vitamin_b12", { precision: 6, scale: 2 }), // mcg
  omega3: decimal("omega_3", { precision: 6, scale: 2 }), // g
  fuelCategories: jsonb("fuel_categories").$type<string[]>(), // Fuel Fingerprint assignments
  linkedBlockId: varchar("linked_block_id"), // optional FK to timeBlocks
  routineId: varchar("routine_id"), // optional link to intakeRoutines for automatic logging
  notes: text("notes"),
  imageUrl: text("image_url"),
  status: intakeStatusEnum("status").notNull().default("consumed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sleepLogs = pgTable("sleep_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  plannedHours: decimal("planned_hours", { precision: 4, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 4, scale: 2 }),
  quality: integer("quality"), // 1-5
  readinessScore: integer("readiness_score"), // 0-100, calculated from sleep data
  notes: text("notes"),
});

export const hygieneRoutines = pgTable("hygiene_routines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  completed: boolean("completed").notNull().default(false),
  date: date("date").notNull(),
  frequency: hygieneFrequencyEnum("frequency").default("daily"),
  streak: integer("streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastCompletedDate: date("last_completed_date"),
  goalId: varchar("goal_id"), // Optional link to a goal for auto progress events
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== SUPPLEMENT LOGS =====
export const supplementLogs = pgTable("supplement_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  date: date("date").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 7, scale: 2 }),
  unit: text("unit"), // mg, mcg, g, IU, ml, capsule, tablet
  timeTaken: text("time_taken"), // HH:MM time the supplement was taken
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== FASTING LOGS =====
export const fastingLogs = pgTable("fasting_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  targetHours: decimal("target_hours", { precision: 4, scale: 1 }),
  status: fastingStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== INTAKE ROUTINES (supplements & medications with schedules) =====
export const intakeRoutines = pgTable("intake_routines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dose: decimal("dose", { precision: 7, scale: 2 }),
  unit: text("unit"), // mg, mcg, g, IU, ml, capsule, tablet
  type: text("type").notNull().default("supplement"), // supplement | medication
  frequency: text("frequency").notNull().default("daily"), // daily | weekdays | custom
  daysOfWeek: jsonb("days_of_week").$type<string[]>(), // ["Mon","Tue",...] for custom
  timeOfDay: text("time_of_day"), // morning | evening | with-meals | HH:MM
  micronutrientField: text("micronutrient_field"), // e.g. "vitaminD"
  micronutrientAmount: decimal("micronutrient_amount", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const intakeRoutineCheckins = pgTable("intake_routine_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routineId: varchar("routine_id").notNull(),
  date: date("date").notNull(),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// ===== MEAL PRESETS =====
export const mealPresets = pgTable("meal_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  mealType: text("meal_type"),
  calories: decimal("calories", { precision: 7, scale: 2 }),
  protein: decimal("protein", { precision: 6, scale: 2 }),
  carbs: decimal("carbs", { precision: 6, scale: 2 }),
  fats: decimal("fats", { precision: 6, scale: 2 }),
  fiber: decimal("fiber", { precision: 6, scale: 2 }),
  sugar: decimal("sugar", { precision: 6, scale: 2 }),
  sodium: decimal("sodium", { precision: 7, scale: 2 }),
  zinc: decimal("zinc", { precision: 6, scale: 2 }),
  magnesium: decimal("magnesium", { precision: 6, scale: 2 }),
  vitaminD: decimal("vitamin_d", { precision: 6, scale: 2 }),
  vitaminC: decimal("vitamin_c", { precision: 6, scale: 2 }),
  iron: decimal("iron", { precision: 6, scale: 2 }),
  calcium: decimal("calcium", { precision: 7, scale: 2 }),
  potassium: decimal("potassium", { precision: 7, scale: 2 }),
  water: decimal("water", { precision: 6, scale: 2 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== BODY PROFILE (for BMR / TDEE calculations) =====
export const bodyProfile = pgTable("body_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  heightCm: decimal("height_cm", { precision: 5, scale: 1 }),
  weightKg: decimal("weight_kg", { precision: 5, scale: 1 }),
  age: integer("age"),
  sex: text("sex"), // male, female
  activityLevel: text("activity_level"), // sedentary, light, moderate, active, very_active
  bodyGoal: text("body_goal"), // lose, maintain, gain
  dailyCalorieGoal: integer("daily_calorie_goal"), // computed or overridden
  dailyProteinGoal: integer("daily_protein_goal"),
  dailyCarbsGoal: integer("daily_carbs_goal"),
  dailyFatsGoal: integer("daily_fats_goal"),
  sleepGoalHours: decimal("sleep_goal_hours", { precision: 3, scale: 1 }).default("8.0"),
  weeklyEffortTarget: integer("weekly_effort_target").default(500),
  dailyEnergyGoal: integer("daily_energy_goal"), // kcal burn goal
  activeTimeGoal: integer("active_time_goal").default(45), // minutes
  fiberGoal: integer("fiber_goal").default(30), // grams
  waterGoal: integer("water_goal").default(2500), // ml
  fastingProgram: jsonb("fasting_program").$type<{
    preset: "16:8" | "18:6" | "20:4" | "OMAD" | "custom";
    fastingHours: number;
    eatingWindowStart: string; // HH:MM
    activeDays: string[]; // ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] or subset
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== DAILY STATE (comprehensive per-day snapshot for SenseiOS) =====
export const dailyState = pgTable("daily_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  // Sleep
  sleepHours: decimal("sleep_hours", { precision: 4, scale: 2 }),
  sleepQuality: integer("sleep_quality"), // 1-5
  readinessScore: integer("readiness_score"), // 0-100
  // Workout
  workoutCompleted: boolean("workout_completed").default(false),
  musclesTrained: jsonb("muscles_trained").$type<string[]>().default([]),
  workoutIntensity: decimal("workout_intensity", { precision: 3, scale: 1 }), // avg RPE
  totalVolume: integer("total_volume"), // sum of sets * weight
  workoutDurationMin: integer("workout_duration_min"),
  // Nutrition
  caloriesConsumed: integer("calories_consumed"),
  calorieGoal: integer("calorie_goal"),
  caloricBalance: integer("caloric_balance"), // consumed - goal
  proteinConsumed: decimal("protein_consumed", { precision: 6, scale: 2 }),
  carbsConsumed: decimal("carbs_consumed", { precision: 6, scale: 2 }),
  fatsConsumed: decimal("fats_consumed", { precision: 6, scale: 2 }),
  waterConsumed: decimal("water_consumed", { precision: 6, scale: 2 }), // ml
  // Hygiene
  hygieneCompletionRate: decimal("hygiene_completion_rate", { precision: 5, scale: 2 }), // 0-100
  // Activity metrics
  effortScore: integer("effort_score"), // 0-100 composite
  caloriesBurned: integer("calories_burned"),
  recoveryScore: integer("recovery_score"), // 0-100 (wearable)
  activeMinutes: integer("active_minutes"),
  steps: integer("steps"),
  distanceKm: decimal("distance_km", { precision: 7, scale: 2 }),
  avgHeartRate: integer("avg_heart_rate"),
  // Planner
  plannerCompletion: decimal("planner_completion", { precision: 5, scale: 2 }), // 0-100
  // Goal events
  goalProgressEvents: jsonb("goal_progress_events").$type<{ goalId: string; event: string; timestamp: string }[]>().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
},
(table) => [
  unique("daily_state_user_date_unique").on(table.userId, table.date),
]);

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

// ===== ACTIVITY LOGS (non-workout activities: runs, walks, etc.) =====
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  activityType: text("activity_type").notNull(), // run, walk, cycle, swim, sport, other
  activityName: text("activity_name"), // custom name for sport/other
  durationMinutes: integer("duration_minutes"),
  distanceKm: decimal("distance_km", { precision: 7, scale: 2 }),
  caloriesBurned: integer("calories_burned"),
  perceivedEffort: integer("perceived_effort"), // 1-10
  notes: text("notes"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  trajectoryContext: jsonb("trajectory_context").$type<{
    goal: string;
    context: string;
    structure: string;
    submoduleType: string;
    submoduleName: string;
    createdAt: string;
  }>(),
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
export const insertWorkoutSchema = createInsertSchema(workouts, {
  date: z.coerce.date(),
  startTime: z.coerce.date().optional().nullable(),
  endTime: z.coerce.date().optional().nullable(),
}).omit({ id: true, createdAt: true });
export const insertExerciseLibrarySchema = createInsertSchema(exerciseLibrary).omit({ id: true, createdAt: true });
export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({ id: true });
export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({ id: true });
export const insertMuscleStatSchema = createInsertSchema(muscleStats).omit({ id: true, updatedAt: true });

export const insertIntakeLogSchema = createInsertSchema(intakeLogs, {
  date: z.coerce.date(),
}).omit({ id: true, createdAt: true });
export const insertSleepLogSchema = createInsertSchema(sleepLogs, {
  startTime: z.coerce.date().optional().nullable(),
  endTime: z.coerce.date().optional().nullable(),
}).omit({ id: true });
export const insertHygieneRoutineSchema = createInsertSchema(hygieneRoutines).omit({ id: true, createdAt: true });
export const insertSupplementLogSchema = createInsertSchema(supplementLogs).omit({ id: true, createdAt: true });
export const insertFastingLogSchema = createInsertSchema(fastingLogs, {
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
}).omit({ id: true, createdAt: true });
export const insertIntakeRoutineSchema = createInsertSchema(intakeRoutines).omit({ id: true, createdAt: true });
export const insertIntakeRoutineCheckinSchema = createInsertSchema(intakeRoutineCheckins).omit({ id: true });
export const insertMealPresetSchema = createInsertSchema(mealPresets).omit({ id: true, createdAt: true });
export const insertBodyProfileSchema = createInsertSchema(bodyProfile).omit({ id: true, updatedAt: true });
export const insertDailyStateSchema = createInsertSchema(dailyState).omit({ id: true, updatedAt: true });
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
export const insertActivityLogSchema = createInsertSchema(activityLogs, {
  loggedAt: z.coerce.date().optional(),
}).omit({ id: true, createdAt: true });

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
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type IntakeLog = typeof intakeLogs.$inferSelect;
export type InsertIntakeLog = z.infer<typeof insertIntakeLogSchema>;
export type SleepLog = typeof sleepLogs.$inferSelect;
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
export type HygieneRoutine = typeof hygieneRoutines.$inferSelect;
export type InsertHygieneRoutine = z.infer<typeof insertHygieneRoutineSchema>;
export type SupplementLog = typeof supplementLogs.$inferSelect;
export type InsertSupplementLog = z.infer<typeof insertSupplementLogSchema>;
export type FastingLog = typeof fastingLogs.$inferSelect;
export type InsertFastingLog = z.infer<typeof insertFastingLogSchema>;
export type IntakeRoutine = typeof intakeRoutines.$inferSelect;
export type InsertIntakeRoutine = z.infer<typeof insertIntakeRoutineSchema>;
export type IntakeRoutineCheckin = typeof intakeRoutineCheckins.$inferSelect;
export type InsertIntakeRoutineCheckin = z.infer<typeof insertIntakeRoutineCheckinSchema>;
export type MealPreset = typeof mealPresets.$inferSelect;
export type InsertMealPreset = z.infer<typeof insertMealPresetSchema>;
export type BodyProfile = typeof bodyProfile.$inferSelect;
export type InsertBodyProfile = z.infer<typeof insertBodyProfileSchema>;
export type DailyState = typeof dailyState.$inferSelect;
export type InsertDailyState = z.infer<typeof insertDailyStateSchema>;
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
  trajectoryContext: jsonb("trajectory_context").$type<{
    goal: string;
    context: string;
    structure: string;
    submoduleType: string;
    submoduleName: string;
    createdAt: string;
  }>(),
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
