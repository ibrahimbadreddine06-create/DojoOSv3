import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLearningTrajectory, findMaterialsForChapter, type TrajectoryParams, type FindMaterialsParams } from "./ai";
import { calculateRecoveryScore } from "./recovery";
import {
  insertTimeBlockSchema, insertDayPresetSchema, insertActivityPresetSchema,
  insertGoalSchema, insertKnowledgeTopicSchema, insertLearnPlanItemSchema,
  insertMaterialSchema, insertFlashcardSchema, insertWorkoutSchema,
  insertExerciseLibrarySchema, insertWorkoutExerciseSchema, insertWorkoutSetSchema,
  insertIntakeLogSchema, insertSleepLogSchema, insertHygieneRoutineSchema,
  insertSupplementLogSchema, insertFastingLogSchema, insertMealPresetSchema, insertBodyProfileSchema,
  insertSalahLogSchema, insertQuranLogSchema, insertDhikrLogSchema, insertDuaLogSchema,
  insertTransactionSchema, insertMasterpieceSchema, insertMasterpieceSectionSchema,
  insertPossessionSchema, insertOutfitSchema, insertCourseSchema, insertLessonSchema,
  insertCourseExerciseSchema, insertBusinessSchema, insertWorkProjectSchema, insertTaskSchema,
  insertSocialActivitySchema, insertPersonSchema, insertPageSettingSchema, insertDailyMetricSchema,
  insertDisciplineSchema, insertDisciplineLogSchema, insertDailyStateSchema
} from "../shared/schema";

export function registerRoutes(app: Express): Server {
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

  // Bulk create chapters from AI trajectory
  app.post("/api/learn-plan-items/bulk", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { chapters, topicId, courseId, disciplineId, trajectoryContext } = req.body;
    if (!chapters || !Array.isArray(chapters)) {
      return res.status(400).json({ message: "chapters array required" });
    }

    interface ChapterNode { title: string; children: ChapterNode[]; }
    async function createRecursively(nodes: ChapterNode[], parentId: string | null, startOrder: number) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const item = await storage.createLearnPlanItem({
          title: node.title,
          topicId: topicId || null,
          courseId: courseId || null,
          disciplineId: disciplineId || null,
          parentId: parentId || null,
          order: startOrder + i,
          importance: 3,
          completed: false,
        });
        if (node.children?.length > 0) {
          await createRecursively(node.children, item.id, 0);
        }
      }
    }

    await createRecursively(chapters, null, 0);

    // Save trajectory context so AI Material Finder can use it later
    if (trajectoryContext) {
      const ctx = { ...trajectoryContext, createdAt: new Date().toISOString() };
      if (topicId) {
        await storage.updateKnowledgeTopic(topicId, { trajectoryContext: ctx } as any);
      } else if (courseId) {
        await storage.updateCourse(courseId, { trajectoryContext: ctx } as any);
      } else if (disciplineId) {
        await storage.updateDiscipline(disciplineId, { trajectoryContext: ctx } as any);
      }
    }

    res.json({ success: true });
  });

  // AI: Generate learning objectives directive for a chapter
  app.post("/api/ai/generate-learning-objectives", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI not configured (missing GEMINI_API_KEY)" });
    }
    try {
      const { generateLearningObjectives } = await import("./ai");
      const objectives = await generateLearningObjectives(req.body);
      res.json({ objectives });
    } catch (e: any) {
      console.error("AI generate-learning-objectives error:", e);
      res.status(500).json({ message: e.message || "Generation failed" });
    }
  });

  // AI: Find materials for a chapter
  app.post("/api/ai/find-materials", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI not configured (missing GEMINI_API_KEY)" });
    }
    try {
      const result = await findMaterialsForChapter(req.body as FindMaterialsParams);
      res.json(result);
    } catch (e: any) {
      console.error("AI find-materials error:", e);
      res.status(500).json({ message: e.message || "AI search failed" });
    }
  });

  app.post("/api/ai/generate-notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI not configured (missing GEMINI_API_KEY)" });
    }
    try {
      const { generateNotes } = await import("./ai");
      const result = await generateNotes(req.body);
      res.json(result);
    } catch (e: any) {
      console.error("AI generate-notes error:", e);
      res.status(500).json({ message: e.message || "Note generation failed" });
    }
  });

  app.post("/api/ai/generate-flashcards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI not configured (missing GEMINI_API_KEY)" });
    }
    try {
      const { generateFlashcards } = await import("./ai");
      const result = await generateFlashcards(req.body);
      res.json(result);
    } catch (e: any) {
      console.error("AI generate-flashcards error:", e);
      res.status(500).json({ message: e.message || "Flashcard generation failed" });
    }
  });

  // AI: Generate learning trajectory
  app.post("/api/ai/generate-trajectory", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI not configured (missing GEMINI_API_KEY)" });
    }
    try {
      const params = req.body as TrajectoryParams;
      const result = await generateLearningTrajectory(params);
      res.json(result);
    } catch (e: any) {
      console.error("AI trajectory error:", e);
      res.status(500).json({ message: e.message || "AI generation failed" });
    }
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
    const { insertChapterNoteSchema } = await import("../shared/schema");
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
    const { insertWorkoutPresetSchema } = await import("../shared/schema");
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
    res.status(405).json({ message: "Use /api/workout-sets to update individual set data" });
  });

  app.post("/api/workout-sets", async (req, res) => {
    const data = insertWorkoutSetSchema.parse(req.body);
    const set = await storage.createWorkoutSet(data);
    res.json(set);
  });

  app.patch("/api/workout-sets/:id", async (req, res) => {
    const set = await storage.updateWorkoutSet(req.params.id, req.body);
    res.json(set);
  });

  app.get("/api/exercises/:id/progress", async (req, res) => {
    const progress = await storage.getExerciseProgress(req.params.id);
    res.json(progress);
  });

  // Muscle Stats
  app.get("/api/muscle-stats", async (req, res) => {
    const stats = await storage.getMuscleStats();
    // Recompute recovery scores live based on lastTrained + volumeAccumulated
    const enriched = stats.map(s => ({
      ...s,
      recoveryScore: calculateRecoveryScore({
        muscleId: s.muscleId,
        lastTrainedAt: s.lastTrained ? new Date(s.lastTrained) : null,
        volumeAccumulated: Number(s.volumeAccumulated || 0),
        rpe: null,
      }),
    }));
    res.json(enriched);
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
    try {
      const data = insertIntakeLogSchema.parse(req.body);
      const log = await storage.createIntakeLog(data);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/intake-logs/:id", async (req, res) => {
    try {
      const log = await storage.updateIntakeLog(req.params.id, req.body);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/intake-logs/:id", async (req, res) => {
    await storage.deleteIntakeLog(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/sleep-logs/all", async (req, res) => {
    const logs = await storage.getAllSleepLogs();
    res.json(logs);
  });

  app.get("/api/sleep-logs/:date", async (req, res) => {
    const logs = await storage.getSleepLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/sleep-logs", async (req, res) => {
    try {
      const data = insertSleepLogSchema.parse(req.body);
      const log = await storage.createSleepLog(data);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Hygiene — global recurring templates (no date param)
  app.get("/api/hygiene-routines", async (req, res) => {
    const routines = await storage.getHygieneRoutines();
    res.json(routines);
  });

  app.post("/api/hygiene-routines", async (req, res) => {
    try {
      const data = insertHygieneRoutineSchema.parse(req.body);
      const routine = await storage.createHygieneRoutine(data);
      res.json(routine);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/hygiene-routines/:id", async (req, res) => {
    try {
      const routine = await storage.updateHygieneRoutine(req.params.id, req.body);
      res.json(routine);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/hygiene-routines/:id", async (req, res) => {
    await storage.deleteHygieneRoutine(req.params.id);
    res.json({ success: true });
  });

  // Supplement Logs
  app.get("/api/supplement-logs/:date", async (req, res) => {
    const logs = await storage.getSupplementLogs(req.params.date);
    res.json(logs);
  });

  app.post("/api/supplement-logs", async (req, res) => {
    try {
      const data = insertSupplementLogSchema.parse(req.body);
      const log = await storage.createSupplementLog(data);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/supplement-logs/:id", async (req, res) => {
    try {
      const log = await storage.updateSupplementLog(req.params.id, req.body);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/supplement-logs/:id", async (req, res) => {
    await storage.deleteSupplementLog(req.params.id);
    res.json({ success: true });
  });

  // Fasting Logs
  app.get("/api/fasting-logs", async (req, res) => {
    const logs = await storage.getFastingLogs();
    res.json(logs);
  });

  app.get("/api/fasting-logs/active", async (req, res) => {
    const log = await storage.getActiveFastingLog();
    res.json(log || null);
  });

  app.post("/api/fasting-logs", async (req, res) => {
    try {
      const data = insertFastingLogSchema.parse(req.body);
      const log = await storage.createFastingLog(data);
      res.json(log);
    } catch (e: any) {
      res.status(409).json({ message: e.message });
    }
  });

  app.patch("/api/fasting-logs/:id", async (req, res) => {
    try {
      const log = await storage.updateFastingLog(req.params.id, req.body);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Fasting lifecycle actions
  app.post("/api/fasting-logs/:id/stop", async (req, res) => {
    try {
      const log = await storage.stopFastingLog(req.params.id);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/fasting-logs/:id/complete", async (req, res) => {
    try {
      const log = await storage.completeFastingLog(req.params.id);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/fasting-logs/:id", async (req, res) => {
    await storage.deleteFastingLog(req.params.id);
    res.json({ success: true });
  });

  // Meal Presets
  app.get("/api/meal-presets", async (req, res) => {
    const presets = await storage.getMealPresets();
    res.json(presets);
  });

  app.post("/api/meal-presets", async (req, res) => {
    try {
      const data = insertMealPresetSchema.parse(req.body);
      const preset = await storage.createMealPreset(data);
      res.json(preset);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/meal-presets/:id", async (req, res) => {
    await storage.deleteMealPreset(req.params.id);
    res.json({ success: true });
  });

  // Body Profile
  app.get("/api/body-profile", async (req, res) => {
    const profile = await storage.getBodyProfile();
    res.json(profile || null);
  });

  app.post("/api/body-profile", async (req, res) => {
    try {
      const data = insertBodyProfileSchema.parse(req.body);
      const profile = await storage.upsertBodyProfile(data);
      res.json(profile);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Daily State
  app.get("/api/daily-state/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const state = await storage.getDailyState((req.user as any).id, req.params.date);
    res.json(state || null);
  });

  app.post("/api/daily-state/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const data = insertDailyStateSchema.partial().parse(req.body);
      const state = await storage.upsertDailyState((req.user as any).id, req.params.date, data);
      res.json(state);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
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
