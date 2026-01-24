import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTimeBlockSchema, insertDayPresetSchema, insertActivityPresetSchema,
  insertGoalSchema, insertKnowledgeTopicSchema, insertLearnPlanItemSchema,
  insertMaterialSchema, insertFlashcardSchema, insertWorkoutSchema, insertExerciseSchema,
  insertIntakeLogSchema, insertSleepLogSchema, insertHygieneRoutineSchema,
  insertSalahLogSchema, insertQuranLogSchema, insertDhikrLogSchema, insertDuaLogSchema,
  insertTransactionSchema, insertMasterpieceSchema, insertMasterpieceSectionSchema,
  insertPossessionSchema, insertOutfitSchema, insertCourseSchema, insertLessonSchema,
  insertCourseExerciseSchema, insertBusinessSchema, insertWorkProjectSchema, insertTaskSchema,
  insertSocialActivitySchema, insertPersonSchema, insertPageSettingSchema, insertDailyMetricSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== TIME BLOCKS & PRESETS =====
  // Note: /linked route must come BEFORE /:date to avoid matching "linked" as a date
  app.get("/api/time-blocks/linked", async (req, res) => {
    const { date, module, itemId } = req.query;
    if (!date || !module) {
      return res.status(400).json({ message: "date and module are required" });
    }
    const blocks = await storage.getLinkedTimeBlocks(
      date as string, 
      module as string, 
      itemId as string | undefined
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
  app.get("/api/knowledge-topics/:type", async (req, res) => {
    const themes = await storage.getKnowledgeTopics(req.params.type);
    res.json(themes);
  });

  app.get("/api/knowledge-topics/detail/:id", async (req, res) => {
    const theme = await storage.getKnowledgeTopic(req.params.id);
    res.json(theme);
  });

  app.post("/api/knowledge-topics", async (req, res) => {
    const data = insertKnowledgeTopicSchema.parse(req.body);
    const theme = await storage.createKnowledgeTopic(data);
    res.json(theme);
  });

  app.delete("/api/knowledge-topics/:id", async (req, res) => {
    await storage.deleteKnowledgeTopic(req.params.id);
    res.json({ success: true });
  });

  // Route for course chapters must come first (more specific path)
  app.get("/api/learn-plan-items/course/:courseId", async (req, res) => {
    const items = await storage.getCourseLearnPlanItems(req.params.courseId);
    res.json(items);
  });

  // Route for theme chapters (less specific, matches any :topicId)
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
    res.json(workouts);
  });

  app.post("/api/workouts", async (req, res) => {
    const data = insertWorkoutSchema.parse(req.body);
    const workout = await storage.createWorkout(data);
    res.json(workout);
  });

  app.get("/api/exercises/:workoutId", async (req, res) => {
    const exercises = await storage.getExercises(req.params.workoutId);
    res.json(exercises);
  });

  app.post("/api/exercises", async (req, res) => {
    const data = insertExerciseSchema.parse(req.body);
    const exercise = await storage.createExercise(data);
    res.json(exercise);
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

  const httpServer = createServer(app);
  return httpServer;
}
