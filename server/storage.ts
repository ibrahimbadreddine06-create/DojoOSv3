// Referenced from javascript_database blueprint - comprehensive storage for all DojoOS modules
import crypto from "crypto";
import {
  users, timeBlocks, dayPresets, activityPresets, goals, knowledgeTopics, learnPlanItems,
  materials, flashcards, chapterNotes, workouts, exerciseLibrary, workoutExercises, workoutSets, muscleStats, intakeLogs, sleepLogs, hygieneRoutines,
  supplementLogs, fastingLogs, mealPresets, bodyProfile, dailyState,
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
  type HygieneRoutine, type InsertHygieneRoutine,
  type SupplementLog, type InsertSupplementLog,
  type FastingLog, type InsertFastingLog,
  type MealPreset, type InsertMealPreset,
  type BodyProfile, type InsertBodyProfile,
  type DailyState, type InsertDailyState,
  type SalahLog, type InsertSalahLog,
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
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, ilike, or } from "drizzle-orm"; // Added sql import

export interface IStorage {
  // User operations
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
  updateKnowledgeTopic(id: string, data: Partial<InsertKnowledgeTopic>): Promise<KnowledgeTopic>;
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
  updateWorkoutSet(id: string, data: Partial<InsertWorkoutSet>): Promise<WorkoutSet>;
  getExerciseProgress(exerciseId: string): Promise<{ date: string; maxWeight: number; totalVolume: number }[]>;

  getMuscleStats(): Promise<MuscleStat[]>;
  upsertMuscleStat(muscleId: string, recoveryScore: number): Promise<MuscleStat>;

  getIntakeLogs(date: string): Promise<IntakeLog[]>;
  createIntakeLog(data: InsertIntakeLog): Promise<IntakeLog>;
  updateIntakeLog(id: string, data: Partial<InsertIntakeLog>): Promise<IntakeLog>;
  deleteIntakeLog(id: string): Promise<void>;
  getSleepLogs(date: string): Promise<SleepLog[]>;
  getAllSleepLogs(): Promise<SleepLog[]>;
  createSleepLog(data: InsertSleepLog): Promise<SleepLog>;
  // Hygiene — global templates, not date-specific
  getHygieneRoutines(): Promise<HygieneRoutine[]>;
  createHygieneRoutine(data: InsertHygieneRoutine): Promise<HygieneRoutine>;
  updateHygieneRoutine(id: string, data: Partial<InsertHygieneRoutine>): Promise<HygieneRoutine>;
  deleteHygieneRoutine(id: string): Promise<void>;
  // Supplements & Fasting
  getSupplementLogs(date: string): Promise<SupplementLog[]>;
  createSupplementLog(data: InsertSupplementLog): Promise<SupplementLog>;
  updateSupplementLog(id: string, data: Partial<InsertSupplementLog>): Promise<SupplementLog>;
  deleteSupplementLog(id: string): Promise<void>;
  getFastingLogs(): Promise<FastingLog[]>;
  getActiveFastingLog(): Promise<FastingLog | undefined>;
  createFastingLog(data: InsertFastingLog): Promise<FastingLog>;
  updateFastingLog(id: string, data: Partial<InsertFastingLog>): Promise<FastingLog>;
  stopFastingLog(id: string): Promise<FastingLog>;
  completeFastingLog(id: string): Promise<FastingLog>;
  deleteFastingLog(id: string): Promise<void>;
  // Meal Presets
  getMealPresets(): Promise<MealPreset[]>;
  createMealPreset(data: InsertMealPreset): Promise<MealPreset>;
  deleteMealPreset(id: string): Promise<void>;
  // Body Profile
  getBodyProfile(): Promise<BodyProfile | undefined>;
  upsertBodyProfile(data: InsertBodyProfile): Promise<BodyProfile>;
  // Daily State
  getDailyState(userId: string, date: string): Promise<DailyState | undefined>;
  upsertDailyState(userId: string, date: string, data: Partial<InsertDailyState>): Promise<DailyState>;

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
  private ensureDb() {
    if (!db) {
      throw new Error("Database connection not established. Please check your DATABASE_URL environment variable.");
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    this.ensureDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    this.ensureDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    this.ensureDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    this.ensureDb();
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
    this.ensureDb();
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    this.ensureDb();
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
    this.ensureDb();
    await db.delete(users).where(eq(users.id, id));
  }

  // Social & Privacy
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    this.ensureDb();
    const [follow] = await db.insert(follows).values({ followerId, followingId }).returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    this.ensureDb();
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    this.ensureDb();
    return await db.select().from(follows).where(eq(follows.followingId, userId));
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    this.ensureDb();
    return await db.select().from(follows).where(eq(follows.followerId, userId));
  }

  async getPrivacySettings(userId: string): Promise<PrivacySetting[]> {
    this.ensureDb();
    return await db.select().from(privacySettings).where(eq(privacySettings.userId, userId));
  }

  async upsertPrivacySetting(setting: InsertPrivacySetting): Promise<PrivacySetting> {
    this.ensureDb();
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
    this.ensureDb();
    return await db.select().from(timeBlocks).where(eq(timeBlocks.date, date));
  }

  async getTimeBlock(id: string): Promise<TimeBlock | undefined> {
    this.ensureDb();
    const [block] = await db.select().from(timeBlocks).where(eq(timeBlocks.id, id));
    return block;
  }

  async getLinkedTimeBlocks(date: string, module: string, itemId?: string, subItemId?: string): Promise<TimeBlock[]> {
    this.ensureDb();
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
    this.ensureDb();
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
    this.ensureDb();
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
    this.ensureDb();
    await db.delete(timeBlocks).where(eq(timeBlocks.id, id));
  }

  async getDayPresets(): Promise<DayPreset[]> {
    this.ensureDb();
    return await db.select().from(dayPresets).orderBy(desc(dayPresets.createdAt));
  }

  async createDayPreset(data: InsertDayPreset): Promise<DayPreset> {
    this.ensureDb();
    const [preset] = await db.insert(dayPresets).values(data).returning();
    return preset;
  }

  async deleteDayPreset(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(dayPresets).where(eq(dayPresets.id, id));
  }

  async getActivityPresets(module: string): Promise<ActivityPreset[]> {
    this.ensureDb();
    return await db.select().from(activityPresets).where(eq(activityPresets.module, module));
  }

  async createActivityPreset(data: InsertActivityPreset): Promise<ActivityPreset> {
    this.ensureDb();
    const [preset] = await db.insert(activityPresets).values(data).returning();
    return preset;
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    this.ensureDb();
    return await db.select().from(goals).orderBy(desc(goals.createdAt));
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    this.ensureDb();
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(data: InsertGoal): Promise<Goal> {
    this.ensureDb();
    const [goal] = await db.insert(goals).values(data).returning();
    return goal;
  }

  async updateGoal(id: string, data: Partial<InsertGoal>): Promise<Goal> {
    this.ensureDb();
    const [goal] = await db.update(goals).set(data).where(eq(goals.id, id)).returning();
    return goal;
  }

  async deleteGoal(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Knowledge Tracking
  async getKnowledgeTopics(type: string): Promise<KnowledgeTopic[]> {
    this.ensureDb();
    return await db.select().from(knowledgeTopics).where(eq(knowledgeTopics.type, type));
  }

  async getKnowledgeTopic(id: string): Promise<KnowledgeTopic | undefined> {
    this.ensureDb();
    const [theme] = await db.select().from(knowledgeTopics).where(eq(knowledgeTopics.id, id));
    return theme;
  }

  async createKnowledgeTopic(data: InsertKnowledgeTopic): Promise<KnowledgeTopic> {
    this.ensureDb();
    const [theme] = await db.insert(knowledgeTopics).values(data).returning();
    return theme;
  }

  async updateKnowledgeTopic(id: string, data: Partial<InsertKnowledgeTopic>): Promise<KnowledgeTopic> {
    this.ensureDb();
    const [topic] = await db.update(knowledgeTopics).set(data).where(eq(knowledgeTopics.id, id)).returning();
    return topic;
  }

  async deleteKnowledgeTopic(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(knowledgeMetrics).where(eq(knowledgeMetrics.topicId, id));
    await db.delete(knowledgeTopics).where(eq(knowledgeTopics.id, id));
  }

  async calculateWeightedCompletion(topicId: string): Promise<number> {
    this.ensureDb();
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
    this.ensureDb();
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
    this.ensureDb();
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
    this.ensureDb();
    return await db.select().from(learnPlanItems).where(eq(learnPlanItems.topicId, topicId)).orderBy(asc(learnPlanItems.order));
  }

  async getCourseLearnPlanItems(courseId: string): Promise<LearnPlanItem[]> {
    this.ensureDb();
    return await db.select().from(learnPlanItems).where(eq(learnPlanItems.courseId, courseId)).orderBy(asc(learnPlanItems.order));
  }

  async createLearnPlanItem(data: InsertLearnPlanItem): Promise<LearnPlanItem> {
    this.ensureDb();
    const [item] = await db.insert(learnPlanItems).values(data).returning();
    return item;
  }

  async updateLearnPlanItem(id: string, data: Partial<InsertLearnPlanItem>): Promise<LearnPlanItem> {
    this.ensureDb();
    const [item] = await db.update(learnPlanItems).set(data).where(eq(learnPlanItems.id, id)).returning();
    return item;
  }

  async deleteLearnPlanItem(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(learnPlanItems).where(eq(learnPlanItems.id, id));
  }

  async getMaterials(topicId: string): Promise<Material[]> {
    this.ensureDb();
    return await db.select().from(materials).where(eq(materials.topicId, topicId));
  }

  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    this.ensureDb();
    return await db.select().from(materials).where(eq(materials.courseId, courseId));
  }

  async getMaterialsByChapter(chapterId: string): Promise<Material[]> {
    this.ensureDb();
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
    this.ensureDb();
    const [material] = await db.insert(materials).values(data).returning();
    return material;
  }

  async updateMaterial(id: string, data: Partial<InsertMaterial>): Promise<Material> {
    this.ensureDb();
    const [material] = await db.update(materials).set(data).where(eq(materials.id, id)).returning();
    return material;
  }

  async deleteMaterial(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(materials).where(eq(materials.id, id));
  }

  async getFlashcardsByTheme(topicId: string): Promise<Flashcard[]> {
    this.ensureDb();
    return await db.select().from(flashcards).where(eq(flashcards.topicId, topicId));
  }

  async getFlashcardsByCourse(courseId: string): Promise<Flashcard[]> {
    this.ensureDb();
    return await db.select().from(flashcards).where(eq(flashcards.courseId, courseId));
  }

  async getFlashcardsByChapter(chapterId: string): Promise<Flashcard[]> {
    this.ensureDb();
    return await db.select().from(flashcards).where(eq(flashcards.chapterId, chapterId));
  }

  // Workout Presets
  async getWorkoutPresets(): Promise<WorkoutPreset[]> {
    this.ensureDb();
    return await db.select().from(workoutPresets).orderBy(desc(workoutPresets.createdAt));
  }

  async createWorkoutPreset(data: InsertWorkoutPreset): Promise<WorkoutPreset> {
    this.ensureDb();
    const [preset] = await db.insert(workoutPresets).values(data).returning();
    return preset;
  }

  async deleteWorkoutPreset(id: string): Promise<void> {
    this.ensureDb();
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
    this.ensureDb();
    const [flashcard] = await db.insert(flashcards).values(data).returning();
    return flashcard;
  }

  async updateFlashcard(id: string, data: Partial<InsertFlashcard>): Promise<Flashcard> {
    this.ensureDb();
    const [flashcard] = await db.update(flashcards).set(data).where(eq(flashcards.id, id)).returning();
    return flashcard;
  }

  async deleteFlashcard(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  async getLearnPlanItemsByDiscipline(disciplineId: string): Promise<LearnPlanItem[]> {
    this.ensureDb();
    return await db.select().from(learnPlanItems).where(eq(learnPlanItems.disciplineId, disciplineId)).orderBy(asc(learnPlanItems.order));
  }

  async getMaterialsByDiscipline(disciplineId: string): Promise<Material[]> {
    this.ensureDb();
    return await db.select().from(materials).where(eq(materials.disciplineId, disciplineId));
  }

  async getFlashcardsByDiscipline(disciplineId: string): Promise<Flashcard[]> {
    this.ensureDb();
    return await db.select().from(flashcards).where(eq(flashcards.disciplineId, disciplineId));
  }

  // Chapter Notes
  async getNotesByChapter(chapterId: string): Promise<ChapterNote[]> {
    this.ensureDb();
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
    this.ensureDb();
    const [workout] = await db.insert(workouts).values(data).returning();
    return workout;
  }

  async updateWorkout(id: string, data: Partial<InsertWorkout>): Promise<Workout> {
    this.ensureDb();
    const [workout] = await db.update(workouts).set(data).where(eq(workouts.id, id)).returning();
    return workout;
  }

  async getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
    return await db.select().from(exerciseLibrary).orderBy(asc(exerciseLibrary.name));
  }

  async createExerciseLibraryItem(data: InsertExerciseLibraryItem): Promise<ExerciseLibraryItem> {
    this.ensureDb();
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
    this.ensureDb();
    const [we] = await db.insert(workoutExercises).values(data).returning();
    return we;
  }

  async createWorkoutSet(data: InsertWorkoutSet): Promise<WorkoutSet> {
    this.ensureDb();
    const [set] = await db.insert(workoutSets).values(data).returning();
    return set;
  }

  async updateWorkoutSet(id: string, data: Partial<InsertWorkoutSet>): Promise<WorkoutSet> {
    this.ensureDb();
    const [set] = await db.update(workoutSets).set(data).where(eq(workoutSets.id, id)).returning();
    return set;
  }

  async getExerciseProgress(exerciseId: string): Promise<{ date: string; maxWeight: number; totalVolume: number }[]> {
    this.ensureDb();
    const rows = await db
      .select({
        date: workouts.date,
        weight: workoutSets.weight,
        reps: workoutSets.reps,
      })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(eq(workoutExercises.exerciseId, exerciseId))
      .orderBy(asc(workouts.date));

    const byDate = new Map<string, { maxWeight: number; totalVolume: number }>();
    for (const r of rows) {
      const d = r.date?.toString().slice(0, 10) || "";
      const w = Number(r.weight || 0);
      const reps = Number(r.reps || 0);
      const existing = byDate.get(d) || { maxWeight: 0, totalVolume: 0 };
      byDate.set(d, {
        maxWeight: Math.max(existing.maxWeight, w),
        totalVolume: existing.totalVolume + w * reps,
      });
    }
    return Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v }));
  }

  async getMuscleStats(): Promise<MuscleStat[]> {
    this.ensureDb();
    return await db.select().from(muscleStats);
  }

  async upsertMuscleStat(muscleId: string, recoveryScore: number): Promise<MuscleStat> {
    this.ensureDb();
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
    this.ensureDb();
    return await db.select().from(intakeLogs).where(eq(intakeLogs.date, new Date(date)));
  }

  async createIntakeLog(data: InsertIntakeLog): Promise<IntakeLog> {
    this.ensureDb();
    const [log] = await db.insert(intakeLogs).values(data).returning();
    return log;
  }

  async getSleepLogs(date: string): Promise<SleepLog[]> {
    this.ensureDb();
    return await db.select().from(sleepLogs).where(eq(sleepLogs.date, date));
  }

  async getAllSleepLogs(): Promise<SleepLog[]> {
    this.ensureDb();
    return await db.select().from(sleepLogs).orderBy(desc(sleepLogs.date));
  }

  async createSleepLog(data: InsertSleepLog): Promise<SleepLog> {
    this.ensureDb();
    const [log] = await db.insert(sleepLogs).values(data).returning();
    return log;
  }

  async getHygieneRoutines(): Promise<HygieneRoutine[]> {
    this.ensureDb();
    return await db.select().from(hygieneRoutines).orderBy(asc(hygieneRoutines.name));
  }

  async createHygieneRoutine(data: InsertHygieneRoutine): Promise<HygieneRoutine> {
    this.ensureDb();
    const [routine] = await db.insert(hygieneRoutines).values(data).returning();
    return routine;
  }

  async updateHygieneRoutine(id: string, data: Partial<InsertHygieneRoutine>): Promise<HygieneRoutine> {
    this.ensureDb();
    const [updated] = await db.update(hygieneRoutines).set(data).where(eq(hygieneRoutines.id, id)).returning();
    return updated;
  }

  async deleteHygieneRoutine(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(hygieneRoutines).where(eq(hygieneRoutines.id, id));
  }

  async getSupplementLogs(date: string): Promise<SupplementLog[]> {
    this.ensureDb();
    return await db.select().from(supplementLogs).where(eq(supplementLogs.date, date));
  }

  async createSupplementLog(data: InsertSupplementLog): Promise<SupplementLog> {
    this.ensureDb();
    const [log] = await db.insert(supplementLogs).values(data).returning();
    return log;
  }

  async updateSupplementLog(id: string, data: Partial<InsertSupplementLog>): Promise<SupplementLog> {
    this.ensureDb();
    const [updated] = await db.update(supplementLogs).set(data).where(eq(supplementLogs.id, id)).returning();
    return updated;
  }

  async deleteSupplementLog(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(supplementLogs).where(eq(supplementLogs.id, id));
  }

  async getFastingLogs(): Promise<FastingLog[]> {
    this.ensureDb();
    return await db.select().from(fastingLogs).orderBy(desc(fastingLogs.startTime));
  }

  async getActiveFastingLog(): Promise<FastingLog | undefined> {
    this.ensureDb();
    const [log] = await db.select().from(fastingLogs).where(eq(fastingLogs.status, "active"));
    return log;
  }

  async createFastingLog(data: InsertFastingLog): Promise<FastingLog> {
    this.ensureDb();
    // Enforce only one active fast at a time
    const active = await this.getActiveFastingLog();
    if (active) throw new Error("An active fast already exists. Stop or cancel it first.");
    const [log] = await db.insert(fastingLogs).values({ ...data, status: "active" }).returning();
    return log;
  }

  async updateFastingLog(id: string, data: Partial<InsertFastingLog>): Promise<FastingLog> {
    this.ensureDb();
    const [updated] = await db.update(fastingLogs).set(data).where(eq(fastingLogs.id, id)).returning();
    return updated;
  }

  async stopFastingLog(id: string): Promise<FastingLog> {
    this.ensureDb();
    const [updated] = await db
      .update(fastingLogs)
      .set({ status: "cancelled", endTime: new Date() })
      .where(eq(fastingLogs.id, id))
      .returning();
    return updated;
  }

  async completeFastingLog(id: string): Promise<FastingLog> {
    this.ensureDb();
    const [updated] = await db
      .update(fastingLogs)
      .set({ status: "completed", endTime: new Date() })
      .where(eq(fastingLogs.id, id))
      .returning();
    return updated;
  }

  async deleteFastingLog(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(fastingLogs).where(eq(fastingLogs.id, id));
  }

  async getMealPresets(): Promise<MealPreset[]> {
    this.ensureDb();
    return await db.select().from(mealPresets).orderBy(asc(mealPresets.name));
  }

  async createMealPreset(data: InsertMealPreset): Promise<MealPreset> {
    this.ensureDb();
    const [preset] = await db.insert(mealPresets).values(data).returning();
    return preset;
  }

  async deleteMealPreset(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(mealPresets).where(eq(mealPresets.id, id));
  }

  async getBodyProfile(): Promise<BodyProfile | undefined> {
    this.ensureDb();
    const [profile] = await db.select().from(bodyProfile);
    return profile;
  }

  async upsertBodyProfile(data: InsertBodyProfile): Promise<BodyProfile> {
    this.ensureDb();
    const existing = await this.getBodyProfile();
    if (existing) {
      const [updated] = await db.update(bodyProfile).set({ ...data, updatedAt: new Date() }).where(eq(bodyProfile.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(bodyProfile).values(data).returning();
      return created;
    }
  }

  async getDailyState(userId: string, date: string): Promise<DailyState | undefined> {
    this.ensureDb();
    const [row] = await db.select().from(dailyState).where(and(eq(dailyState.userId, userId), eq(dailyState.date, date)));
    return row;
  }

  async upsertDailyState(userId: string, date: string, data: Partial<InsertDailyState>): Promise<DailyState> {
    this.ensureDb();
    const existing = await this.getDailyState(userId, date);
    if (existing) {
      const [updated] = await db.update(dailyState).set({ ...data, updatedAt: new Date() }).where(eq(dailyState.id, existing.id)).returning();
      return updated;
    } else {
      const insertValues = { ...data, userId, date, updatedAt: new Date() };
      const [created] = await db.insert(dailyState).values(insertValues as typeof dailyState.$inferInsert).returning();
      return created;
    }
  }

  // Worship
  async getSalahLogs(date: string): Promise<SalahLog[]> {
    this.ensureDb();
    return await db.select().from(salahLogs).where(eq(salahLogs.date, date));
  }

  async createSalahLog(data: InsertSalahLog): Promise<SalahLog> {
    this.ensureDb();
    const [log] = await db.insert(salahLogs).values(data).returning();
    return log;
  }

  async getQuranLogs(date: string): Promise<QuranLog[]> {
    this.ensureDb();
    return await db.select().from(quranLogs).where(eq(quranLogs.date, date));
  }

  async createQuranLog(data: InsertQuranLog): Promise<QuranLog> {
    this.ensureDb();
    const [log] = await db.insert(quranLogs).values(data).returning();
    return log;
  }

  async getDhikrLogs(date: string): Promise<DhikrLog[]> {
    this.ensureDb();
    return await db.select().from(dhikrLogs).where(eq(dhikrLogs.date, date));
  }

  async createDhikrLog(data: InsertDhikrLog): Promise<DhikrLog> {
    this.ensureDb();
    const [log] = await db.insert(dhikrLogs).values(data).returning();
    return log;
  }

  async getDuaLogs(date: string): Promise<DuaLog[]> {
    this.ensureDb();
    return await db.select().from(duaLogs).where(eq(duaLogs.date, date));
  }

  async createDuaLog(data: InsertDuaLog): Promise<DuaLog> {
    this.ensureDb();
    const [log] = await db.insert(duaLogs).values(data).returning();
    return log;
  }

  // Finances
  async getTransactions(): Promise<Transaction[]> {
    this.ensureDb();
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    this.ensureDb();
    const [transaction] = await db.insert(transactions).values(data).returning();
    return transaction;
  }

  // Masterpieces
  async getMasterpieces(): Promise<Masterpiece[]> {
    this.ensureDb();
    return await db.select().from(masterpieces).orderBy(desc(masterpieces.createdAt));
  }

  async createMasterpiece(data: InsertMasterpiece): Promise<Masterpiece> {
    this.ensureDb();
    const [masterpiece] = await db.insert(masterpieces).values(data).returning();
    return masterpiece;
  }

  async getMasterpieceSections(masterpieceId: string): Promise<MasterpieceSection[]> {
    this.ensureDb();
    return await db.select().from(masterpieceSections).where(eq(masterpieceSections.masterpieceId, masterpieceId)).orderBy(asc(masterpieceSections.order));
  }

  async createMasterpieceSection(data: InsertMasterpieceSection): Promise<MasterpieceSection> {
    this.ensureDb();
    const [section] = await db.insert(masterpieceSections).values(data).returning();
    return section;
  }

  // Possessions
  async getPossessions(): Promise<Possession[]> {
    this.ensureDb();
    return await db.select().from(possessions).orderBy(desc(possessions.createdAt));
  }

  async createPossession(data: InsertPossession): Promise<Possession> {
    this.ensureDb();
    const [possession] = await db.insert(possessions).values(data).returning();
    return possession;
  }

  async updatePossession(id: string, data: Partial<InsertPossession>): Promise<Possession> {
    this.ensureDb();
    const [possession] = await db.update(possessions).set(data).where(eq(possessions.id, id)).returning();
    return possession;
  }

  async deletePossession(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(possessions).where(eq(possessions.id, id));
  }

  async getOutfits(): Promise<Outfit[]> {
    this.ensureDb();
    return await db.select().from(outfits).orderBy(desc(outfits.date));
  }

  async createOutfit(data: InsertOutfit): Promise<Outfit> {
    this.ensureDb();
    const [outfit] = await db.insert(outfits).values(data).returning();
    return outfit;
  }

  // Studies
  async getCourses(): Promise<Course[]> {
    this.ensureDb();
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    this.ensureDb();
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    this.ensureDb();
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course> {
    this.ensureDb();
    const [course] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(courseMetrics).where(eq(courseMetrics.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    this.ensureDb();
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.order));
  }

  async createLesson(data: InsertLesson): Promise<Lesson> {
    this.ensureDb();
    const [lesson] = await db.insert(lessons).values(data).returning();
    return lesson;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson> {
    this.ensureDb();
    const [lesson] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return lesson;
  }

  async getCourseExercises(lessonId: string): Promise<CourseExercise[]> {
    this.ensureDb();
    return await db.select().from(courseExercises).where(eq(courseExercises.lessonId, lessonId));
  }

  async createCourseExercise(data: InsertCourseExercise): Promise<CourseExercise> {
    this.ensureDb();
    const [exercise] = await db.insert(courseExercises).values(data).returning();
    return exercise;
  }

  // Business & Work
  async getBusinesses(): Promise<Business[]> {
    this.ensureDb();
    return await db.select().from(businesses).orderBy(desc(businesses.createdAt));
  }

  async createBusiness(data: InsertBusiness): Promise<Business> {
    this.ensureDb();
    const [business] = await db.insert(businesses).values(data).returning();
    return business;
  }

  async getWorkProjects(type: string, relatedId?: string): Promise<WorkProject[]> {
    this.ensureDb();
    if (relatedId) {
      return await db.select().from(workProjects).where(and(eq(workProjects.type, type), eq(workProjects.relatedId, relatedId)));
    }
    return await db.select().from(workProjects).where(eq(workProjects.type, type));
  }

  async createWorkProject(data: InsertWorkProject): Promise<WorkProject> {
    this.ensureDb();
    const [project] = await db.insert(workProjects).values(data).returning();
    return project;
  }

  async getTasks(projectId: string): Promise<Task[]> {
    this.ensureDb();
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(data: InsertTask): Promise<Task> {
    this.ensureDb();
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  // Social Purpose
  async getSocialActivities(): Promise<SocialActivity[]> {
    this.ensureDb();
    return await db.select().from(socialActivities).orderBy(desc(socialActivities.date));
  }

  async createSocialActivity(data: InsertSocialActivity): Promise<SocialActivity> {
    this.ensureDb();
    const [activity] = await db.insert(socialActivities).values(data).returning();
    return activity;
  }

  async getPeople(): Promise<Person[]> {
    this.ensureDb();
    return await db.select().from(people).orderBy(asc(people.name));
  }

  async createPerson(data: InsertPerson): Promise<Person> {
    this.ensureDb();
    const [person] = await db.insert(people).values(data).returning();
    return person;
  }

  // Settings & Metrics
  async getPageSettings(): Promise<PageSetting[]> {
    this.ensureDb();
    return await db.select().from(pageSettings);
  }

  async updatePageSetting(module: string, active: boolean): Promise<PageSetting> {
    this.ensureDb();
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
    this.ensureDb();
    const [metric] = await db.select().from(dailyMetrics).where(eq(dailyMetrics.date, date));
    return metric;
  }

  async createDailyMetric(data: InsertDailyMetric): Promise<DailyMetric> {
    this.ensureDb();
    const [metric] = await db.insert(dailyMetrics).values(data).returning();
    return metric;
  }

  async getAllDailyMetrics(): Promise<DailyMetric[]> {
    this.ensureDb();
    return await db.select().from(dailyMetrics).orderBy(asc(dailyMetrics.date));
  }

  async upsertDailyMetric(date: string, plannerCompletion: number): Promise<DailyMetric> {
    this.ensureDb();
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
    this.ensureDb();
    return await db.select().from(knowledgeMetrics)
      .where(eq(knowledgeMetrics.topicId, topicId))
      .orderBy(asc(knowledgeMetrics.date));
  }

  async upsertKnowledgeMetric(topicId: string, date: string, completion: number, readiness: number): Promise<KnowledgeMetric> {
    this.ensureDb();
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
    this.ensureDb();
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
    this.ensureDb();
    return await db.select().from(courseMetrics)
      .where(eq(courseMetrics.courseId, courseId))
      .orderBy(asc(courseMetrics.date));
  }

  async getAllCourseMetrics(): Promise<{ courseId: string; courseName: string; date: string; completion: string; importance: number }[]> {
    this.ensureDb();
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
    this.ensureDb();
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
    this.ensureDb();
    const [log] = await db.update(intakeLogs).set(data).where(eq(intakeLogs.id, id)).returning();
    return log;
  }

  async deleteIntakeLog(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(intakeLogs).where(eq(intakeLogs.id, id));
  }

  // Disciplines
  async getDisciplines(): Promise<Discipline[]> {
    this.ensureDb();
    return await db.select().from(disciplines).orderBy(asc(disciplines.level));
  }

  async getDiscipline(id: string): Promise<Discipline | undefined> {
    this.ensureDb();
    const [discipline] = await db.select().from(disciplines).where(eq(disciplines.id, id));
    return discipline;
  }

  async createDiscipline(data: InsertDiscipline): Promise<Discipline> {
    this.ensureDb();
    const [discipline] = await db.insert(disciplines).values(data).returning();
    return discipline;
  }

  async updateDiscipline(id: string, data: Partial<InsertDiscipline>): Promise<Discipline> {
    this.ensureDb();
    const [discipline] = await db.update(disciplines).set(data).where(eq(disciplines.id, id)).returning();
    return discipline;
  }

  async deleteDiscipline(id: string): Promise<void> {
    this.ensureDb();
    await db.delete(disciplineLogs).where(eq(disciplineLogs.disciplineId, id));
    await db.delete(disciplines).where(eq(disciplines.id, id));
  }

  async getDisciplineLogs(disciplineId: string): Promise<DisciplineLog[]> {
    this.ensureDb();
    return await db.select().from(disciplineLogs).where(eq(disciplineLogs.disciplineId, disciplineId)).orderBy(desc(disciplineLogs.date));
  }

  async createDisciplineLog(data: InsertDisciplineLog): Promise<DisciplineLog> {
    this.ensureDb();
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
  private supplementLogs: Map<string, SupplementLog>;
  private fastingLogs: Map<string, FastingLog>;
  private mealPresets: Map<string, MealPreset>;
  private bodyProfiles: Map<string, BodyProfile>;
  private dailyStates: Map<string, DailyState>;
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
    this.supplementLogs = new Map();
    this.fastingLogs = new Map();
    this.mealPresets = new Map();
    this.bodyProfiles = new Map();
    this.dailyStates = new Map();
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
  async updateKnowledgeTopic(id: string, data: Partial<InsertKnowledgeTopic>): Promise<KnowledgeTopic> {
    const existing = this.knowledgeTopics.get(id);
    if (!existing) throw new Error("Topic not found");
    const updated = { ...existing, ...data };
    this.knowledgeTopics.set(id, updated);
    return updated;
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

  async getExerciseProgress(exerciseId: string): Promise<{ date: string; maxWeight: number; totalVolume: number }[]> {
    return [];
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
  async getAllSleepLogs(): Promise<SleepLog[]> {
    return Array.from(this.sleepLogs.values()).sort((a, b) => b.date.localeCompare(a.date));
  }
  async getHygieneRoutines(): Promise<HygieneRoutine[]> {
    return Array.from(this.hygieneRoutines.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  async createHygieneRoutine(data: InsertHygieneRoutine): Promise<HygieneRoutine> {
    const id = this.generateId();
    const routine: HygieneRoutine = { ...data, id, createdAt: new Date() } as any;
    this.hygieneRoutines.set(id, routine);
    return routine;
  }
  async updateHygieneRoutine(id: string, data: Partial<InsertHygieneRoutine>): Promise<HygieneRoutine> {
    const existing = this.hygieneRoutines.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data } as HygieneRoutine;
    this.hygieneRoutines.set(id, updated);
    return updated;
  }
  async deleteHygieneRoutine(id: string): Promise<void> {
    this.hygieneRoutines.delete(id);
  }
  async getSupplementLogs(date: string): Promise<SupplementLog[]> {
    return Array.from(this.supplementLogs.values()).filter(l => {
      const d = l.date instanceof Date ? l.date : new Date(l.date);
      return d.toISOString().split('T')[0] === date;
    });
  }
  async createSupplementLog(data: InsertSupplementLog): Promise<SupplementLog> {
    const id = this.generateId();
    const log: SupplementLog = { ...data, id, createdAt: new Date() } as any;
    this.supplementLogs.set(id, log);
    return log;
  }
  async updateSupplementLog(id: string, data: Partial<InsertSupplementLog>): Promise<SupplementLog> {
    const existing = this.supplementLogs.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data } as SupplementLog;
    this.supplementLogs.set(id, updated);
    return updated;
  }
  async deleteSupplementLog(id: string): Promise<void> {
    this.supplementLogs.delete(id);
  }
  async getFastingLogs(): Promise<FastingLog[]> {
    return Array.from(this.fastingLogs.values()).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
  async getActiveFastingLog(): Promise<FastingLog | undefined> {
    return Array.from(this.fastingLogs.values()).find(l => l.status === "active");
  }
  async createFastingLog(data: InsertFastingLog): Promise<FastingLog> {
    const active = await this.getActiveFastingLog();
    if (active) throw new Error("An active fast already exists. Stop or cancel it first.");
    const id = this.generateId();
    const log: FastingLog = { ...data, status: "active", id, createdAt: new Date() } as any;
    this.fastingLogs.set(id, log);
    return log;
  }
  async updateFastingLog(id: string, data: Partial<InsertFastingLog>): Promise<FastingLog> {
    const existing = this.fastingLogs.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data } as FastingLog;
    this.fastingLogs.set(id, updated);
    return updated;
  }
  async stopFastingLog(id: string): Promise<FastingLog> {
    return this.updateFastingLog(id, { status: "cancelled", endTime: new Date() } as any);
  }
  async completeFastingLog(id: string): Promise<FastingLog> {
    return this.updateFastingLog(id, { status: "completed", endTime: new Date() } as any);
  }
  async deleteFastingLog(id: string): Promise<void> {
    this.fastingLogs.delete(id);
  }
  async getMealPresets(): Promise<MealPreset[]> {
    return Array.from(this.mealPresets.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  async createMealPreset(data: InsertMealPreset): Promise<MealPreset> {
    const id = this.generateId();
    const preset: MealPreset = { ...data, id, createdAt: new Date() } as any;
    this.mealPresets.set(id, preset);
    return preset;
  }
  async deleteMealPreset(id: string): Promise<void> {
    this.mealPresets.delete(id);
  }
  async getBodyProfile(): Promise<BodyProfile | undefined> {
    const profiles = Array.from(this.bodyProfiles.values());
    return profiles[0];
  }
  async upsertBodyProfile(data: InsertBodyProfile): Promise<BodyProfile> {
    const existing = await this.getBodyProfile();
    if (existing) {
      const updated = { ...existing, ...data, updatedAt: new Date() } as BodyProfile;
      this.bodyProfiles.set(existing.id, updated);
      return updated;
    } else {
      const id = this.generateId();
      const created: BodyProfile = { ...data, id, updatedAt: new Date() } as any;
      this.bodyProfiles.set(id, created);
      return created;
    }
  }
  async getDailyState(userId: string, date: string): Promise<DailyState | undefined> {
    return Array.from(this.dailyStates.values()).find(d => d.userId === userId && d.date === date);
  }
  async upsertDailyState(userId: string, date: string, data: Partial<InsertDailyState>): Promise<DailyState> {
    const existing = await this.getDailyState(userId, date);
    if (existing) {
      const updated = { ...existing, ...data, updatedAt: new Date() } as DailyState;
      this.dailyStates.set(existing.id, updated);
      return updated;
    } else {
      const id = this.generateId();
      const created = { ...data, userId, date, id, updatedAt: new Date() } as any as DailyState;
      this.dailyStates.set(id, created);
      return created;
    }
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
