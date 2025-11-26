// Referenced from javascript_database blueprint - comprehensive storage for all Dojo OS modules
import {
  users, timeBlocks, dayPresets, activityPresets, goals, knowledgeThemes, learnPlanItems,
  materials, flashcards, workouts, exercises, intakeLogs, sleepLogs, hygieneRoutines,
  salahLogs, quranLogs, dhikrLogs, duaLogs, transactions, masterpieces, masterpieceSections,
  possessions, outfits, courses, lessons, courseExercises, businesses, workProjects, tasks,
  socialActivities, people, pageSettings, dailyMetrics,
  type User, type UpsertUser,
  type TimeBlock, type InsertTimeBlock, type DayPreset, type InsertDayPreset,
  type ActivityPreset, type InsertActivityPreset, type Goal, type InsertGoal,
  type KnowledgeTheme, type InsertKnowledgeTheme, type LearnPlanItem, type InsertLearnPlanItem,
  type Material, type InsertMaterial, type Flashcard, type InsertFlashcard,
  type Workout, type InsertWorkout, type Exercise, type InsertExercise,
  type IntakeLog, type InsertIntakeLog, type SleepLog, type InsertSleepLog,
  type HygieneRoutine, type InsertHygieneRoutine, type SalahLog, type InsertSalahLog,
  type QuranLog, type InsertQuranLog, type DhikrLog, type InsertDhikrLog,
  type DuaLog, type InsertDuaLog, type Transaction, type InsertTransaction,
  type Masterpiece, type InsertMasterpiece, type MasterpieceSection, type InsertMasterpieceSection,
  type Possession, type InsertPossession, type Outfit, type InsertOutfit,
  type Course, type InsertCourse, type Lesson, type InsertLesson,
  type CourseExercise, type InsertCourseExercise, type Business, type InsertBusiness,
  type WorkProject, type InsertWorkProject, type Task, type InsertTask,
  type SocialActivity, type InsertSocialActivity, type Person, type InsertPerson,
  type PageSetting, type InsertPageSetting, type DailyMetric, type InsertDailyMetric
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Time Blocks & Presets
  getTimeBlocks(date: string): Promise<TimeBlock[]>;
  createTimeBlock(data: InsertTimeBlock): Promise<TimeBlock>;
  updateTimeBlock(id: string, data: Partial<InsertTimeBlock>): Promise<TimeBlock>;
  deleteTimeBlock(id: string): Promise<void>;
  getDayPresets(): Promise<DayPreset[]>;
  createDayPreset(data: InsertDayPreset): Promise<DayPreset>;
  getActivityPresets(module: string): Promise<ActivityPreset[]>;
  createActivityPreset(data: InsertActivityPreset): Promise<ActivityPreset>;

  // Goals
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(data: InsertGoal): Promise<Goal>;
  updateGoal(id: string, data: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;

  // Knowledge Tracking
  getKnowledgeThemes(type: string): Promise<KnowledgeTheme[]>;
  getKnowledgeTheme(id: string): Promise<KnowledgeTheme | undefined>;
  createKnowledgeTheme(data: InsertKnowledgeTheme): Promise<KnowledgeTheme>;
  getLearnPlanItems(themeId: string): Promise<LearnPlanItem[]>;
  createLearnPlanItem(data: InsertLearnPlanItem): Promise<LearnPlanItem>;
  updateLearnPlanItem(id: string, data: Partial<InsertLearnPlanItem>): Promise<LearnPlanItem>;
  getMaterials(themeId: string): Promise<Material[]>;
  createMaterial(data: InsertMaterial): Promise<Material>;
  getFlashcards(materialId: string): Promise<Flashcard[]>;
  createFlashcard(data: InsertFlashcard): Promise<Flashcard>;

  // Body
  getWorkouts(date: string): Promise<Workout[]>;
  createWorkout(data: InsertWorkout): Promise<Workout>;
  getExercises(workoutId: string): Promise<Exercise[]>;
  createExercise(data: InsertExercise): Promise<Exercise>;
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
  getOutfits(): Promise<Outfit[]>;
  createOutfit(data: InsertOutfit): Promise<Outfit>;

  // Studies
  getCourses(): Promise<Course[]>;
  createCourse(data: InsertCourse): Promise<Course>;
  getLessons(courseId: string): Promise<Lesson[]>;
  createLesson(data: InsertLesson): Promise<Lesson>;
  getCourseExercises(lessonId: string): Promise<CourseExercise[]>;
  createCourseExercise(data: InsertCourseExercise): Promise<CourseExercise>;

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
  createDailyMetric(data: InsertDailyMetric): Promise<DailyMetric>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  // Time Blocks & Presets
  async getTimeBlocks(date: string): Promise<TimeBlock[]> {
    return await db.select().from(timeBlocks).where(eq(timeBlocks.date, date));
  }

  async createTimeBlock(data: InsertTimeBlock): Promise<TimeBlock> {
    const [block] = await db.insert(timeBlocks).values(data).returning();
    return block;
  }

  async updateTimeBlock(id: string, data: Partial<InsertTimeBlock>): Promise<TimeBlock> {
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
  async getKnowledgeThemes(type: string): Promise<KnowledgeTheme[]> {
    return await db.select().from(knowledgeThemes).where(eq(knowledgeThemes.type, type));
  }

  async getKnowledgeTheme(id: string): Promise<KnowledgeTheme | undefined> {
    const [theme] = await db.select().from(knowledgeThemes).where(eq(knowledgeThemes.id, id));
    return theme;
  }

  async createKnowledgeTheme(data: InsertKnowledgeTheme): Promise<KnowledgeTheme> {
    const [theme] = await db.insert(knowledgeThemes).values(data).returning();
    return theme;
  }

  async getLearnPlanItems(themeId: string): Promise<LearnPlanItem[]> {
    return await db.select().from(learnPlanItems).where(eq(learnPlanItems.themeId, themeId)).orderBy(asc(learnPlanItems.order));
  }

  async createLearnPlanItem(data: InsertLearnPlanItem): Promise<LearnPlanItem> {
    const [item] = await db.insert(learnPlanItems).values(data).returning();
    return item;
  }

  async updateLearnPlanItem(id: string, data: Partial<InsertLearnPlanItem>): Promise<LearnPlanItem> {
    const [item] = await db.update(learnPlanItems).set(data).where(eq(learnPlanItems.id, id)).returning();
    return item;
  }

  async getMaterials(themeId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.themeId, themeId));
  }

  async createMaterial(data: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(data).returning();
    return material;
  }

  async getFlashcards(materialId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.materialId, materialId));
  }

  async createFlashcard(data: InsertFlashcard): Promise<Flashcard> {
    const [flashcard] = await db.insert(flashcards).values(data).returning();
    return flashcard;
  }

  // Body
  async getWorkouts(date: string): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.date, date));
  }

  async createWorkout(data: InsertWorkout): Promise<Workout> {
    const [workout] = await db.insert(workouts).values(data).returning();
    return workout;
  }

  async getExercises(workoutId: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(eq(exercises.workoutId, workoutId));
  }

  async createExercise(data: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(data).returning();
    return exercise;
  }

  async getIntakeLogs(date: string): Promise<IntakeLog[]> {
    return await db.select().from(intakeLogs).where(eq(intakeLogs.date, date));
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

  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.order));
  }

  async createLesson(data: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(data).returning();
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
}

export const storage = new DatabaseStorage();
