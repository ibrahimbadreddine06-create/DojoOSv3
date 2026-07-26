import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { storage } from "./storage";
import { generateLearningTrajectory, findMaterialsForChapter, type TrajectoryParams, type FindMaterialsParams, generateNutritionBrief, classifyFuelCategory, analyzeMealDescription, analyzeMealPhoto } from "./ai";
import { calculateRecoveryScore } from "./recovery";
import { computeDailyEffort, computeWeeklyEffort } from "./effort";
import {
  bodyOperationalStore,
  coerceOperationalDates,
} from "./body-operational-store";
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
  insertDisciplineSchema, insertDisciplineLogSchema, insertDailyStateSchema,
  insertActivityLogSchema, insertWorkoutPresetSchema,
  insertIntakeRoutineSchema, insertIntakeRoutineCheckinSchema
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

  app.get("/api/linkable-items/:type", async (req, res) => {
    const type = req.params.type;
    const normalizedType = type.replace(/-/g, '_');

    switch (normalizedType) {
      case "goals":
        const goals = await storage.getGoals();
        return res.json(goals.map(g => ({ id: g.id, name: g.title })));
      case "disciplines":
        const disciplines = await storage.getDisciplines();
        return res.json(disciplines.map(d => ({ id: d.id, name: d.name })));
      case "body":
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
        const dbType = (normalizedType === "languages" || normalizedType === "language") ? "language" : "second_brain";
        const themes = await storage.getKnowledgeTopics(dbType);
        return res.json(themes.map(t => ({ id: t.id, name: t.name })));
      default:
        res.json([]);
    }
  });

  app.get("/api/knowledge-topics/:type", async (req, res) => {
    const type = req.params.type;
    const normalizedType = type.replace(/-/g, '_');
    const dbType = (normalizedType === "languages" || normalizedType === "language") ? "language" : "second_brain";

    const themes = await storage.getKnowledgeTopics(dbType);
    res.json(themes); // Return full objects for Second Brain and Languages
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
          if (!req.user) return res.json([]);
          const routines = await storage.getHygieneRoutines((req.user as any).id);
          return res.json(routines.map((r: any) => ({ id: r.id, name: r.name || "Routine" })));
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
    const body = req.body as FindMaterialsParams;
    if (body.materialType === "youtube" && !process.env.YOUTUBE_API_KEY) {
      return res.status(503).json({ message: "YouTube search not configured (missing YOUTUBE_API_KEY)" });
    }
    try {
      const result = await findMaterialsForChapter(body);
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

  // AI: Sensei Chat
  app.post("/api/ai/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI not configured (missing GEMINI_API_KEY)" });
    }

    const { message, history, subModuleType, subModuleId } = req.body;
    if (!message || !subModuleType || !subModuleId) {
      return res.status(400).json({ message: "message, subModuleType, subModuleId are required" });
    }

    try {
      let submoduleName = "";
      let submoduleDescription: string | undefined;
      let trajectoryContext: any;
      let chapters: any[] = [];
      let flashcards: any[] = [];
      let chapterNotes: any[] = [];
      let materials: any[] = [];
      let metrics: { completion: number; readiness: number } | undefined;
      let disciplineLevel: number | undefined;
      let disciplineXp: number | undefined;

      // Build hierarchical chapter tree
      const buildTree = (items: any[]): any[] => {
        const map = new Map<string, any>();
        const roots: any[] = [];
        items.forEach(item => map.set(item.id, { ...item, children: [] }));
        items.forEach(item => {
          const node = map.get(item.id)!;
          if (item.parentId && map.has(item.parentId)) {
            map.get(item.parentId)!.children.push(node);
          } else {
            roots.push(node);
          }
        });
        return roots;
      };

      // Fetch notes for all top-level chapters (including their direct children)
      const fetchAllNotes = async (flatItems: any[]): Promise<any[]> => {
        const topLevel = flatItems.filter(i => !i.parentId);
        const allNotes = await Promise.all(
          topLevel.map(item => {
            const childIds = flatItems
              .filter(c => c.parentId === item.id)
              .map(c => c.id);
            return storage.getNotesByChapterWithChildren(item.id, childIds);
          })
        );
        return allNotes.flat();
      };

      if (subModuleType === "second-brain" || subModuleType === "languages") {
        const topic = await storage.getKnowledgeTopic(subModuleId);
        if (!topic) return res.status(404).json({ message: "Topic not found" });
        submoduleName = topic.name;
        submoduleDescription = topic.description ?? undefined;
        trajectoryContext = (topic as any).trajectoryContext ?? null;

        const [items, cards, mats, metricsData] = await Promise.all([
          storage.getLearnPlanItems(subModuleId),
          storage.getFlashcardsByTheme(subModuleId),
          storage.getMaterials(subModuleId),
          storage.getKnowledgeMetrics(subModuleId),
        ]);
        chapters = buildTree(items);
        flashcards = cards;
        materials = mats;
        chapterNotes = await fetchAllNotes(items);
        if (metricsData.length > 0) {
          const latest = metricsData[metricsData.length - 1];
          metrics = {
            completion: parseFloat(String(latest.completion ?? 0)),
            readiness: parseFloat(String(latest.readiness ?? 0)),
          };
        }

      } else if (subModuleType === "studies") {
        const course = await storage.getCourse(subModuleId);
        if (!course) return res.status(404).json({ message: "Course not found" });
        submoduleName = course.name;
        submoduleDescription = (course as any).description ?? undefined;
        trajectoryContext = (course as any).trajectoryContext ?? null;

        const [items, cards, mats, metricsData] = await Promise.all([
          storage.getCourseLearnPlanItems(subModuleId),
          storage.getFlashcardsByCourse(subModuleId),
          storage.getMaterialsByCourse(subModuleId),
          storage.getCourseMetrics(subModuleId),
        ]);
        chapters = buildTree(items);
        flashcards = cards;
        materials = mats;
        chapterNotes = await fetchAllNotes(items);
        if (metricsData.length > 0) {
          const latest = metricsData[metricsData.length - 1];
          metrics = {
            completion: parseFloat(String((latest as any).completion ?? 0)),
            readiness: 0,
          };
        }

      } else if (subModuleType === "disciplines") {
        const discipline = await storage.getDiscipline(subModuleId);
        if (!discipline) return res.status(404).json({ message: "Discipline not found" });
        submoduleName = discipline.name;
        submoduleDescription = (discipline as any).description ?? undefined;
        trajectoryContext = (discipline as any).trajectoryContext ?? null;
        disciplineLevel = discipline.level ?? undefined;
        disciplineXp = discipline.currentXp ?? undefined;

        const [items, cards, mats] = await Promise.all([
          storage.getLearnPlanItemsByDiscipline(subModuleId),
          storage.getFlashcardsByDiscipline(subModuleId),
          storage.getMaterialsByDiscipline(subModuleId),
        ]);
        chapters = buildTree(items);
        flashcards = cards;
        materials = mats;
        chapterNotes = await fetchAllNotes(items);
      } else {
        return res.status(400).json({ message: "Unsupported subModuleType" });
      }

      // Today's planned sessions linked to this submodule
      const today = new Date().toISOString().split("T")[0];
      let todaysSessions: Array<{ title: string; startTime: string; duration: number }> = [];
      try {
        const moduleKey = subModuleType.replace(/-/g, "_");
        const linkedBlocks = await storage.getLinkedTimeBlocks(today, moduleKey, subModuleId);
        todaysSessions = linkedBlocks.map((b: any) => ({
          title: b.title || "Session",
          startTime: b.startTime || "",
          duration: b.duration || 0,
        }));
      } catch {
        // Not critical; continue without session data
      }

      const { chatWithSensei } = await import("./ai");
      const reply = await chatWithSensei({
        message,
        history: history || [],
        context: {
          submoduleType: subModuleType,
          submoduleName,
          submoduleDescription,
          trajectoryContext: trajectoryContext ? {
            goal: trajectoryContext.goal ?? "",
            context: trajectoryContext.context ?? "",
            structure: trajectoryContext.structure ?? "",
          } : undefined,
          chapters,
          flashcards: flashcards.map((f: any) => ({
            front: f.front,
            back: f.back,
            mastery: f.mastery ?? 0,
          })),
          chapterNotes: chapterNotes.map((n: any) => ({
            title: n.title || "Note",
            content: n.content || "",
          })),
          materials: materials.map((m: any) => ({
            title: m.title,
            type: m.type,
            url: m.url ?? undefined,
          })),
          metrics,
          todaysSessions,
          disciplineLevel,
          disciplineXp,
        },
      });

      res.json({ reply });
    } catch (e: any) {
      console.error("Sensei chat error:", e);
      res.status(500).json({ message: e.message || "Chat failed" });
    }
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
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const workouts = await storage.getWorkouts((req.user as any).id, req.params.date);
    // Enhance workouts with exercises
    const enhancedWorkouts = await Promise.all(workouts.map(async (w) => {
      const exercises = await storage.getWorkoutExercises(w.id);
      return { ...w, exercises };
    }));
    res.json(enhancedWorkouts);
  });

  app.post("/api/workouts", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const data = insertWorkoutSchema.parse(req.body);
    const userId = (req.user as any).id;
    const workout = await storage.createWorkout({ ...data, userId });
    const subject = await bodyOperationalStore.createSubject({
      userId,
      subjectType: "workout",
      entityId: workout.id,
      titleSnapshot: workout.title,
      source: "legacy_workout",
    });
    const actualStartAt = workout.startTime ?? workout.date;
    const execution = await bodyOperationalStore.createExecution({
      userId,
      subjectId: subject.id,
      status: workout.completed ? "completed" : "ready",
      actualStartAt: workout.completed ? actualStartAt : undefined,
      actualEndAt: workout.completed ? workout.endTime ?? undefined : undefined,
      source: "manual",
      domainRecordType: "workout",
      domainRecordId: workout.id,
    });
    res.json({
      ...workout,
      operationalSubjectId: subject.id,
      executionId: execution.id,
    });
  });

  app.get("/api/workouts/detail/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const workout = await storage.getWorkout((req.user as any).id, req.params.id);
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    const exercises = await storage.getWorkoutExercises(workout.id);
    res.json({ ...workout, exercises });
  });

  app.patch("/api/workouts/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).id;
    const workout = await storage.updateWorkout(userId, req.params.id, req.body);
    const execution = await bodyOperationalStore.getExecutionByDomainRecord(
      userId,
      "workout",
      workout.id,
    );
    let updatedExecution = execution;
    if (execution) {
      const status = workout.completed
        ? "completed"
        : workout.startTime
          ? "in_progress"
          : "ready";
      updatedExecution = await bodyOperationalStore.updateExecution(
        userId,
        execution.id,
        {
          status,
          actualStartAt:
            workout.startTime ?? execution.actualStartAt ?? undefined,
          actualEndAt: workout.endTime ?? undefined,
        },
      );
    }
    res.json({ ...workout, executionId: updatedExecution?.id ?? null });
  });

  app.get("/api/workout-presets", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const presets = await storage.getWorkoutPresets((req.user as any).id);
    res.json(presets);
  });

  app.post("/api/workout-presets", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { insertWorkoutPresetSchema } = await import("../shared/schema");
    const data = insertWorkoutPresetSchema.parse(req.body);
    const preset = await storage.createWorkoutPreset({ ...data, userId: (req.user as any).id });
    res.json(preset);
  });

  app.delete("/api/workout-presets/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteWorkoutPreset((req.user as any).id, req.params.id);
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
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const data = insertExerciseLibrarySchema.parse(req.body);
    const item = await storage.createExerciseLibraryItem(data);
    res.json(item);
  });

  // Nutrition Optimizations
  app.get("/api/nutrition/overview/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).id;
    try {
      const overview = await storage.getNutritionOverview(userId, req.params.date);
      res.json(overview);
    } catch (error: any) {
      console.error(`[Nutrition] Error:`, error);
      res.status(500).json({ message: "Failed to fetch nutrition overview", error: error.message });
    }
  });

  app.get("/api/nutrition/trends/batch", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const metrics = (req.query.metrics as string || "").split(',').filter(Boolean);
    const days = parseInt(req.query.days as string) || 7;
    const trends = await storage.getNutritionTrendsBatch(metrics, days);
    res.json(trends);
  });

  app.get("/api/activity/trends", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const metric = req.query.metric as string || "steps";
    const days = parseInt(req.query.days as string) || 7;
    if (metric === "effortScore" || metric === "weeklyEffort") {
      const today = new Date();
      const trends = [];
      for (let offset = days - 1; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const dateKey = date.toISOString().split("T")[0];
        if (metric === "weeklyEffort") {
          const effort = await computeWeeklyEffort(storage, (req.user as any).id, dateKey);
          trends.push({ date: dateKey, value: effort.weeklyPercent });
        } else {
          const effort = await computeDailyEffort(storage, (req.user as any).id, dateKey);
          trends.push({ date: dateKey, value: effort.effortScore });
        }
      }
      return res.json(trends);
    }
    const trends = await storage.getActivityTrends((req.user as any).id, metric, days);
    res.json(trends);
  });

  app.get("/api/rest/trends", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const metric = req.query.metric as string || "sleepHours";
    const days = parseInt(req.query.days as string) || 7;
    const trends = await storage.getRestTrends((req.user as any).id, metric, days);
    res.json(trends);
  });

  app.get("/api/body/signals", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const signals = await storage.getBodySignals((req.user as any).id);
    res.json(signals);
  });

  // Workout Execution
  app.get("/api/workouts/:id/exercises", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const workout = await storage.getWorkout((req.user as any).id, req.params.id);
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    const exercises = await storage.getWorkoutExercises(req.params.id);
    res.json(exercises);
  });

  app.post("/api/workout-exercises", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const data = insertWorkoutExerciseSchema.parse(req.body);
    const workout = await storage.getWorkout((req.user as any).id, data.workoutId);
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    const we = await storage.createWorkoutExercise(data);
    res.json(we);
  });

  app.patch("/api/workout-exercises/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.status(405).json({ message: "Use /api/workout-sets to update individual set data" });
  });

  app.post("/api/workout-sets", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const data = insertWorkoutSetSchema.parse(req.body);
    const ownerId = await storage.getWorkoutExerciseOwner(data.workoutExerciseId);
    if (ownerId !== (req.user as any).id) {
      return res.status(404).json({ message: "Workout exercise not found" });
    }
    const set = await storage.createWorkoutSet(data);
    res.json(set);
  });

  app.patch("/api/workout-sets/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const ownerId = await storage.getWorkoutSetOwner(req.params.id);
    if (ownerId !== (req.user as any).id) {
      return res.status(404).json({ message: "Workout set not found" });
    }
    const set = await storage.updateWorkoutSet(req.params.id, req.body);
    res.json(set);
  });

  app.get("/api/exercises/:id/progress", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const progress = await storage.getExerciseProgress(
      (req.user as any).id,
      req.params.id,
    );
    res.json(progress);
  });

  // Muscle Stats
  app.get("/api/muscle-stats", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const stats = await storage.getMuscleStats((req.user as any).id);
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
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { muscleId, recoveryScore } = req.body;
    const stat = await storage.upsertMuscleStat((req.user as any).id, muscleId, recoveryScore);
    res.json(stat);
  });

  app.get("/api/sleep-logs/all", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const logs = await storage.getAllSleepLogs((req.user as any).id);
    res.json(logs);
  });

  app.get("/api/sleep-logs/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const logs = await storage.getSleepLogs((req.user as any).id, req.params.date);
    res.json(logs);
  });

  app.post("/api/sleep-logs", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertSleepLogSchema.parse(req.body);
      const userId = (req.user as any).id;
      const log = await storage.createSleepLog({ ...data, userId });
      const subject = await bodyOperationalStore.createSubject({
        userId, subjectType: "rest", entityId: log.id,
        titleSnapshot: log.actualHours ? "Sleep" : "Planned sleep", source: "manual",
      });
      if (log.startTime) {
        const execution = await bodyOperationalStore.createExecution({
          userId, subjectId: subject.id, status: "completed",
          actualStartAt: log.startTime ?? undefined,
          actualEndAt: log.endTime ?? undefined,
          source: "manual", domainRecordType: "sleep_log", domainRecordId: log.id,
        });
        return res.json({ ...log, operationalSubjectId: subject.id, executionId: execution.id });
      }
      if (log.actualHours) {
        return res.json({
          ...log,
          operationalSubjectId: subject.id,
          executionId: null,
          operationalState: "awaiting_exact_interval",
        });
      }
      const commitment = await bodyOperationalStore.createCommitment({
        userId, subjectId: subject.id, scheduleKind: "day_bound",
        localDate: log.date, source: "rest",
      });
      res.json({ ...log, operationalSubjectId: subject.id, commitmentId: commitment.id });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Hygiene — global recurring templates (no date param)
  app.get("/api/hygiene-routines", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const routines = await storage.getHygieneRoutines((req.user as any).id);
    res.json(routines);
  });

  app.post("/api/hygiene-routines", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertHygieneRoutineSchema.parse(req.body);
      const userId = (req.user as any).id;
      const routine = await storage.createHygieneRoutine({ ...data, userId });
      const subject = await bodyOperationalStore.createSubject({
        userId, subjectType: "hygiene_routine", entityId: routine.id,
        titleSnapshot: routine.name, source: "manual",
      });
      const commitment = await bodyOperationalStore.createCommitment({
        userId, subjectId: subject.id, scheduleKind: "day_bound",
        localDate: routine.date, status: routine.completed ? "completed" : "planned",
        source: "hygiene",
      });
      let execution = null;
      if (routine.completed) {
        execution = await bodyOperationalStore.createExecution({
          userId, subjectId: subject.id, commitmentId: commitment.id,
          status: "completed", actualStartAt: new Date(), source: "manual",
          domainRecordType: "hygiene_routine", domainRecordId: routine.id,
        });
      }
      res.json({ ...routine, operationalSubjectId: subject.id, commitmentId: commitment.id, executionId: execution?.id ?? null });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/hygiene-routines/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const routine = await storage.updateHygieneRoutine((req.user as any).id, req.params.id, req.body);
      res.json(routine);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/hygiene-routines/:id/complete", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).id;
      const routines = await storage.getHygieneRoutines(userId);
      const current = routines.find((routine) => routine.id === req.params.id);
      if (!current) return res.status(404).json({ message: "Routine not found" });
      const existingExecution =
        await bodyOperationalStore.getExecutionByDomainRecord(
          userId,
          "hygiene_routine",
          current.id,
        );
      if (current.completed && existingExecution) {
        return res.json({
          ...current,
          executionId: existingExecution.id,
          alreadyCompleted: true,
        });
      }
      const routine = await storage.updateHygieneRoutine(userId, current.id, {
        completed: true,
        lastCompletedDate: current.date,
        streak: (current.streak ?? 0) + 1,
        bestStreak: Math.max(current.bestStreak ?? 0, (current.streak ?? 0) + 1),
      });
      const subject = await bodyOperationalStore.createSubject({
        userId, subjectType: "hygiene_routine", entityId: routine.id,
        titleSnapshot: routine.name, source: "manual",
      });
      const snapshot = await bodyOperationalStore.getSnapshot(userId, routine.date, "hygiene_routine");
      const commitment = snapshot.commitments.find((item) => item.subjectId === subject.id);
      const execution = await bodyOperationalStore.createExecution({
        userId, subjectId: subject.id, commitmentId: commitment?.id,
        status: "completed", actualStartAt: new Date(), source: "manual",
        domainRecordType: "hygiene_routine", domainRecordId: routine.id,
      });
      if (commitment) {
        await bodyOperationalStore.updateCommitment(userId, commitment.id, { status: "completed" });
        await bodyOperationalStore.createReconciliation({
          userId, commitmentId: commitment.id,
          executionId: execution.id, resolution: "fulfilled",
          confirmedByUser: true,
          reason: "Routine completed from Hygiene",
        });
      }
      res.json({ ...routine, operationalSubjectId: subject.id, executionId: execution.id });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/hygiene-routines/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteHygieneRoutine((req.user as any).id, req.params.id);
    res.json({ success: true });
  });

  // Supplement Logs
  app.get("/api/supplement-logs/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const logs = await storage.getSupplementLogs((req.user as any).id, req.params.date);
    res.json(logs);
  });

  app.post("/api/supplement-logs", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertSupplementLogSchema.parse(req.body);
      const log = await storage.createSupplementLog({ ...data, userId: (req.user as any).id });
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/supplement-logs/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const log = await storage.updateSupplementLog((req.user as any).id, req.params.id, req.body);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/supplement-logs/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteSupplementLog((req.user as any).id, req.params.id);
    res.json({ success: true });
  });

  // Fasting Logs
  app.get("/api/fasting-logs", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const logs = await storage.getFastingLogs((req.user as any).id);
    res.json(logs);
  });

  app.get("/api/fasting-logs/active", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const log = await storage.getActiveFastingLog((req.user as any).id);
    res.json(log || null);
  });

  app.post("/api/fasting-logs", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertFastingLogSchema.parse(req.body);
      const userId = (req.user as any).id;
      const log = await storage.createFastingLog({ ...data, userId });
      const subject = await bodyOperationalStore.createSubject({
        userId, subjectType: "fasting", entityId: log.id,
        titleSnapshot: "Fast", source: "manual",
      });
      const execution = await bodyOperationalStore.createExecution({
        userId, subjectId: subject.id, status: "in_progress",
        actualStartAt: log.startTime, source: "manual",
        domainRecordType: "fasting_log", domainRecordId: log.id,
      });
      res.json({ ...log, operationalSubjectId: subject.id, executionId: execution.id });
    } catch (e: any) {
      res.status(409).json({ message: e.message });
    }
  });

  app.patch("/api/fasting-logs/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const log = await storage.updateFastingLog((req.user as any).id, req.params.id, req.body);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Fasting lifecycle actions
  app.post("/api/fasting-logs/:id/stop", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const log = await storage.stopFastingLog((req.user as any).id, req.params.id);
      const userId = (req.user as any).id;
      const execution = await bodyOperationalStore.getExecutionByDomainRecord(userId, "fasting_log", log.id);
      const updated = execution ? await bodyOperationalStore.updateExecution(userId, execution.id, {
        status: "cancelled", actualEndAt: log.endTime ?? new Date(),
      }) : null;
      res.json({ ...log, executionId: updated?.id ?? null });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/fasting-logs/:id/complete", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const log = await storage.completeFastingLog((req.user as any).id, req.params.id);
      const userId = (req.user as any).id;
      const execution = await bodyOperationalStore.getExecutionByDomainRecord(userId, "fasting_log", log.id);
      const updated = execution ? await bodyOperationalStore.updateExecution(userId, execution.id, {
        status: "completed", actualEndAt: log.endTime ?? new Date(),
      }) : null;
      res.json({ ...log, executionId: updated?.id ?? null });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/fasting-logs/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteFastingLog((req.user as any).id, req.params.id);
    res.json({ success: true });
  });

  // Meal Presets
  app.get("/api/meal-presets", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const presets = await storage.getMealPresets((req.user as any).id);
    res.json(presets);
  });

  app.post("/api/meal-presets", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertMealPresetSchema.parse(req.body);
      const preset = await storage.createMealPreset({ ...data, userId: (req.user as any).id });
      res.json(preset);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/meal-presets/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteMealPreset((req.user as any).id, req.params.id);
    res.json({ success: true });
  });

  // ===== INTAKE LOGS =====
  app.get("/api/intake-logs/:date", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const logs = await storage.getIntakeLogs((req.user as any).id, req.params.date);
      res.json(logs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/intake-logs", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertIntakeLogSchema.parse(req.body);
      const userId = (req.user as any).id;
      const log = await storage.createIntakeLog({ ...data, userId });
      const subject = await bodyOperationalStore.createSubject({
        userId,
        subjectType: "intake",
        entityId: log.id,
        titleSnapshot: log.mealName ?? log.mealType ?? "Intake",
        source: "manual",
      });
      if (log.status === "planned") {
        const commitment = await bodyOperationalStore.createCommitment({
          userId,
          subjectId: subject.id,
          scheduleKind: "day_bound",
          localDate: log.date.toISOString().slice(0, 10),
          plannerBlockId: log.linkedBlockId ?? undefined,
          source: "nutrition",
        });
        return res.json({
          ...log,
          operationalSubjectId: subject.id,
          commitmentId: commitment.id,
        });
      }
      const execution = await bodyOperationalStore.createExecution({
        userId,
        subjectId: subject.id,
        status: "completed",
        actualStartAt: log.date,
        source: "manual",
        domainRecordType: "intake_log",
        domainRecordId: log.id,
      });
      res.json({
        ...log,
        operationalSubjectId: subject.id,
        executionId: execution.id,
      });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.patch("/api/intake-logs/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const log = await storage.updateIntakeLog((req.user as any).id, req.params.id, req.body);
      res.json(log);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.post("/api/intake-logs/:id/consume", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).id;
      const date = typeof req.body.date === "string" ? req.body.date : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "date must use YYYY-MM-DD" });
      }
      const planned = (await storage.getIntakeLogs(userId, date)).find(
        (item) => item.id === req.params.id && item.status === "planned",
      );
      if (!planned) return res.status(404).json({ message: "Planned intake not found" });
      const existingConsumption =
        await bodyOperationalStore.getExecutionByDomainRecord(
          userId,
          "intake_plan_consumption",
          planned.id,
        );
      if (existingConsumption) {
        return res.status(409).json({
          message: "This planned intake has already been consumed",
          executionId: existingConsumption.id,
        });
      }
      const consumed = await storage.createIntakeLog({
        userId,
        date: new Date(`${date}T12:00:00.000Z`),
        mealName: planned.mealName,
        mealType: planned.mealType,
        calories: planned.calories,
        protein: planned.protein,
        carbs: planned.carbs,
        fats: planned.fats,
        fiber: planned.fiber,
        sugar: planned.sugar,
        sodium: planned.sodium,
        water: planned.water,
        notes: planned.notes,
        status: "consumed",
      });
      const subject = await bodyOperationalStore.createSubject({
        userId, subjectType: "intake", entityId: planned.id,
        titleSnapshot: planned.mealName ?? planned.mealType ?? "Intake",
        source: "manual",
      });
      const snapshot = await bodyOperationalStore.getSnapshot(userId, date, "intake");
      const commitment = snapshot.commitments.find((item) => item.subjectId === subject.id);
      const execution = await bodyOperationalStore.createExecution({
        userId, subjectId: subject.id, commitmentId: commitment?.id,
        status: "completed", actualStartAt: consumed.date, source: "manual",
        domainRecordType: "intake_plan_consumption", domainRecordId: planned.id,
      });
      if (commitment) {
        await bodyOperationalStore.updateCommitment(userId, commitment.id, { status: "completed" });
        await bodyOperationalStore.createReconciliation({
          userId, commitmentId: commitment.id, executionId: execution.id,
          resolution: "fulfilled", confirmedByUser: true,
          reason: "Consumed from Nutrition meal plan",
        });
      }
      res.status(201).json({ planned, consumed, executionId: execution.id });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/intake-logs/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      await storage.deleteIntakeLog((req.user as any).id, req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ===== INTAKE ROUTINES =====
  app.get("/api/intake-routines", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const routines = await storage.getIntakeRoutines((req.user as any).id);
    res.json(routines);
  });
  app.post("/api/intake-routines", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertIntakeRoutineSchema.parse(req.body);
      res.json(await storage.createIntakeRoutine({ ...data, userId: (req.user as any).id }));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.patch("/api/intake-routines/:id", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      res.json(await storage.updateIntakeRoutine((req.user as any).id, req.params.id, req.body));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.delete("/api/intake-routines/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteIntakeRoutine((req.user as any).id, req.params.id);
    res.json({ success: true });
  });

  // ===== INTAKE ROUTINE CHECKINS =====
  app.get("/api/intake-routine-checkins/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.json(await storage.getIntakeRoutineCheckins((req.user as any).id, req.params.date));
  });
  app.post("/api/intake-routine-checkins", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const { routineId, date } = req.body;
      const result = await storage.toggleIntakeRoutineCheckin((req.user as any).id, routineId, date);
      res.json({ checked: result !== null, checkin: result });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // ===== NUTRITION AGGREGATIONS =====
  app.get("/api/fuel-fingerprint/week", async (_req, res) => {
    res.json(await storage.getFuelFingerprintWeek());
  });
  app.get("/api/nutrition/trends", async (req, res) => {
    const metric = String(req.query.metric || "calories");
    const rangeStr = String(req.query.range || "30d");
    const days = rangeStr === "7d" ? 7 : rangeStr === "90d" ? 90 : rangeStr === "180d" ? 180 : rangeStr === "365d" ? 365 : 30;
    res.json(await storage.getNutritionTrends(metric, days));
  });

  // ===== FOOD SEARCH (OpenFoodFacts proxy) =====
  app.get("/api/food-search", async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ products: [] });
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=20&fields=product_name,nutriments,serving_size,brands`;
      const r = await fetch(url);
      const data = await r.json() as any;
      res.json({ products: data.products || [] });
    } catch (e: any) { res.status(500).json({ message: "Food search failed", error: e.message }); }
  });
  app.get("/api/food-barcode/:barcode", async (req, res) => {
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${req.params.barcode}.json`;
      const r = await fetch(url);
      const data = await r.json() as any;
      res.json(data);
    } catch (e: any) { res.status(500).json({ message: "Barcode lookup failed", error: e.message }); }
  });

  // ===== NUTRITION AI ROUTES =====
  app.post("/api/nutrition/ai-brief", async (req, res) => {
    try {
      const { intakeLogs: logs, bodyProfile: profile } = req.body;
      const brief = await generateNutritionBrief(logs || [], profile || null);
      res.json({ status: "ready", brief });
    } catch (e: any) {
      res.status(503).json({
        status: "unavailable",
        brief: null,
        reason: e instanceof Error ? e.message : "Nutrition brief unavailable",
      });
    }
  });
  app.post("/api/nutrition/classify-fuel", async (req, res) => {
    try {
      const { foodName } = req.body;
      const categories = await classifyFuelCategory(foodName || "");
      res.json({ categories });
    } catch (e: any) { res.status(500).json({ categories: [] }); }
  });

  app.post("/api/nutrition/analyze-description", async (req, res) => {
    try {
      const { description } = req.body;
      const analysis = await analyzeMealDescription(description);
      res.json(analysis);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/nutrition/analyze-photo", async (req, res) => {
    try {
      const { image } = req.body; // base64
      const analysis = await analyzeMealPhoto(image);
      res.json(analysis);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Body Profile
  app.get("/api/body-profile", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const profile = await storage.getBodyProfile((req.user as any).id);
    res.json(profile || null);
  });

  app.post("/api/body-profile", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const data = insertBodyProfileSchema.parse(req.body);
      const profile = await storage.upsertBodyProfile((req.user as any).id, data);
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

  app.get("/api/activity/effort/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const effort = await computeDailyEffort(storage, (req.user as any).id, req.params.date);
    res.json(effort);
  });

  app.get("/api/activity/effort/week/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const effort = await computeWeeklyEffort(storage, (req.user as any).id, req.params.date);
    res.json(effort);
  });

  // ===== ACTIVITY LOGS =====
  app.get("/api/activity-logs/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const logs = await storage.getActivityLogs((req.user as any).id, req.params.date);
    res.json(logs);
  });

  app.get("/api/activity-logs", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const logs = await storage.getAllActivityLogs((req.user as any).id);
    res.json(logs);
  });

  app.post("/api/activity-logs", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).id;
      const data = insertActivityLogSchema.parse({ ...req.body, userId });
      if (!data.durationMinutes || data.durationMinutes <= 0) {
        return res.status(400).json({
          message: "A completed activity requires a positive duration",
        });
      }
      const log = await storage.createActivityLog(data);
      const definition = await bodyOperationalStore.createActivityDefinition({
        userId,
        slug: log.activityType,
        name: log.activityName || log.activityType,
        source: "legacy_activity",
      });
      const subject = await bodyOperationalStore.createSubject({
        userId,
        subjectType: "activity",
        entityId: definition.id,
        titleSnapshot: definition.name,
        source: definition.source,
      });
      const actualEndAt = log.loggedAt;
      const actualStartAt = new Date(
        actualEndAt.getTime() - (log.durationMinutes ?? 0) * 60_000,
      );
      const execution = await bodyOperationalStore.createExecution({
        userId,
        subjectId: subject.id,
        status: "completed",
        actualStartAt,
        actualEndAt,
        source: "manual",
        domainRecordType: "activity_log",
        domainRecordId: log.id,
      });
      res.json({
        ...log,
        activityDefinitionId: definition.id,
        operationalSubjectId: subject.id,
        executionId: execution.id,
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Activity AI Brief
  app.post("/api/activity/ai-brief", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const { generateActivityBrief } = await import("./ai");
      const brief = await generateActivityBrief(req.body.dailyData);
      res.json({ status: "ready", brief });
    } catch (e: any) {
      res.status(503).json({
        status: "unavailable",
        brief: null,
        reason: e instanceof Error ? e.message : "Activity brief unavailable",
      });
    }
  });

  // Rest AI Brief
  app.post("/api/rest/ai-brief", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const { generateRestBrief } = await import("./ai");
      const brief = await generateRestBrief(req.body.dailyState);
      res.json({ status: "ready", brief });
    } catch (e: any) {
      res.status(503).json({
        status: "unavailable",
        brief: null,
        reason: e instanceof Error ? e.message : "Rest brief unavailable",
      });
    }
  });

  // Hygiene AI Brief
  app.post("/api/hygiene/ai-brief", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.status(501).json({
      status: "unsupported",
      brief: null,
      reason: "Hygiene analysis is not implemented",
    });
  });

  // ===== BODY OPERATIONAL SPINE =====
  app.get("/api/body/operations", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const date = typeof req.query.date === "string" ? req.query.date : "";
    const subjectType =
      typeof req.query.subjectType === "string"
        ? req.query.subjectType
        : undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "date must use YYYY-MM-DD" });
    }
    try {
      const snapshot = await bodyOperationalStore.getSnapshot(
        (req.user as any).id,
        date,
        subjectType,
      );
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to load Body operations",
      });
    }
  });

  app.get("/api/body/subjects", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const subjectType =
      typeof req.query.subjectType === "string"
        ? req.query.subjectType
        : undefined;
    res.json(
      await bodyOperationalStore.listSubjects(
        (req.user as any).id,
        subjectType,
      ),
    );
  });

  app.get("/api/body/subjects/:id/history", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const history = await bodyOperationalStore.getSubjectHistory(
      (req.user as any).id,
      req.params.id,
    );
    if (!history) return res.status(404).json({ message: "Body subject not found" });
    res.json(history);
  });

  app.get("/api/body/activity-definitions", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await bodyOperationalStore.ensureInitialActivityDefinitions();
    res.json(
      await bodyOperationalStore.listActivityDefinitions(
        (req.user as any).id,
      ),
    );
  });

  app.post("/api/body/activity-definitions", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const definition = await bodyOperationalStore.createActivityDefinition({
        ...req.body,
        userId: (req.user as any).id,
        source: "user",
      });
      res.status(201).json(definition);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Invalid activity definition",
      });
    }
  });

  app.post("/api/body/activity-plans", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).id;
    const {
      activityDefinitionId,
      scheduleKind,
      localDate,
      startTime,
      endTime,
      plannedStartAt,
      plannedEndAt,
      timezone,
      title,
    } = req.body;
    if (
      typeof activityDefinitionId !== "string" ||
      !["timed", "day_bound"].includes(scheduleKind) ||
      typeof localDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(localDate)
    ) {
      return res.status(400).json({ message: "Invalid activity plan" });
    }

    const definition = await bodyOperationalStore.getActivityDefinition(
      userId,
      activityDefinitionId,
    );
    if (!definition) {
      return res.status(404).json({ message: "Activity definition not found" });
    }

    let plannerBlock: Awaited<ReturnType<typeof storage.createTimeBlock>> | null =
      null;
    try {
      if (scheduleKind === "timed") {
        if (
          typeof startTime !== "string" ||
          typeof endTime !== "string" ||
          !/^\d{2}:\d{2}$/.test(startTime) ||
          !/^\d{2}:\d{2}$/.test(endTime) ||
          typeof plannedStartAt !== "string" ||
          typeof plannedEndAt !== "string" ||
          typeof timezone !== "string"
        ) {
          return res.status(400).json({
            message:
              "Timed activity plans require local times, exact timestamps, and timezone",
          });
        }
        plannerBlock = await storage.createTimeBlock(
          insertTimeBlockSchema.parse({
            date: localDate,
            startTime,
            endTime,
            title:
              typeof title === "string" && title.trim()
                ? title.trim()
                : definition.name,
            linkedModule: "activity",
            linkedItemId: definition.id,
          }),
        );
      }

      const subject = await bodyOperationalStore.createSubject({
        userId,
        subjectType: "activity",
        entityId: definition.id,
        titleSnapshot: definition.name,
        source: definition.source,
      });
      const commitment = await bodyOperationalStore.createCommitment({
        userId,
        subjectId: subject.id,
        scheduleKind,
        localDate,
        plannedStartAt:
          scheduleKind === "timed" ? new Date(plannedStartAt) : undefined,
        plannedEndAt:
          scheduleKind === "timed" ? new Date(plannedEndAt) : undefined,
        timezone: scheduleKind === "timed" ? timezone : undefined,
        plannerBlockId: plannerBlock?.id,
        source: "body_activity_plan",
      });
      res.status(201).json({ definition, subject, commitment, plannerBlock });
    } catch (error) {
      if (plannerBlock) {
        await storage.deleteTimeBlock(plannerBlock.id);
      }
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Unable to plan activity",
      });
    }
  });

  app.post("/api/body/activity-executions", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).id;
    const { activityDefinitionId, commitmentId, actualStartAt } = req.body;
    if (typeof activityDefinitionId !== "string") {
      return res.status(400).json({
        message: "activityDefinitionId is required",
      });
    }
    const definition = await bodyOperationalStore.getActivityDefinition(
      userId,
      activityDefinitionId,
    );
    if (!definition) {
      return res.status(404).json({ message: "Activity definition not found" });
    }
    try {
      const subject = await bodyOperationalStore.createSubject({
        userId,
        subjectType: "activity",
        entityId: definition.id,
        titleSnapshot: definition.name,
        source: definition.source,
      });
      const execution = await bodyOperationalStore.createExecution({
        userId,
        subjectId: subject.id,
        commitmentId:
          typeof commitmentId === "string" ? commitmentId : undefined,
        status: "in_progress",
        actualStartAt:
          typeof actualStartAt === "string"
            ? new Date(actualStartAt)
            : new Date(),
        source: "manual",
      });
      res.status(201).json({ definition, subject, execution });
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Unable to start activity",
      });
    }
  });

  app.post("/api/body/activity-executions/:id/complete", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).id;
    const execution = await bodyOperationalStore.getExecution(
      userId,
      req.params.id,
    );
    if (!execution) {
      return res.status(404).json({ message: "Activity execution not found" });
    }
    if (execution.status === "completed") {
      return res.json({ execution, alreadyCompleted: true });
    }
    const subject = await bodyOperationalStore.getSubject(
      userId,
      execution.subjectId,
    );
    if (!subject || subject.subjectType !== "activity") {
      return res.status(400).json({ message: "Execution is not an activity" });
    }
    const definition = await bodyOperationalStore.getActivityDefinition(
      userId,
      subject.entityId,
    );
    if (!definition) {
      return res.status(404).json({ message: "Activity definition not found" });
    }

    try {
      const actualEndAt =
        typeof req.body.actualEndAt === "string"
          ? new Date(req.body.actualEndAt)
          : new Date();
      const actualStartAt = execution.actualStartAt;
      if (!actualStartAt || actualEndAt <= actualStartAt) {
        return res.status(400).json({
          message: "Activity completion requires a valid execution interval",
        });
      }
      const durationMinutes = Math.max(
        1,
        Math.round((actualEndAt.getTime() - actualStartAt.getTime()) / 60_000),
      );
      const completedExecution = await bodyOperationalStore.updateExecution(
        userId,
        execution.id,
        {
          status: "completed",
          actualStartAt,
          actualEndAt,
        },
      );
      const log = await storage.createActivityLog(
        insertActivityLogSchema.parse({
          userId,
          activityType: definition.slug,
          activityName: definition.name,
          durationMinutes,
          distanceKm: req.body.distanceKm ?? null,
          caloriesBurned: req.body.caloriesBurned ?? null,
          perceivedEffort: req.body.perceivedEffort ?? null,
          notes: req.body.notes ?? null,
          loggedAt: actualEndAt,
        }),
      );
      const linkedExecution = await bodyOperationalStore.updateExecution(
        userId,
        execution.id,
        {
          status: "completed",
          actualStartAt,
          actualEndAt,
          domainRecordType: "activity_log",
          domainRecordId: log.id,
        },
      );

      let commitment = null;
      if (execution.commitmentId) {
        commitment = await bodyOperationalStore.updateCommitment(
          userId,
          execution.commitmentId,
          { status: "completed" },
        );
        await bodyOperationalStore.createReconciliation({
          userId,
          commitmentId: execution.commitmentId,
          executionId: execution.id,
          resolution: "fulfilled",
          confirmedByUser: true,
          reason: "Completed from Activity execution",
        });
        if (commitment?.plannerBlockId) {
          await storage.updateTimeBlock(commitment.plannerBlockId, {
            completed: true,
          });
        }
      }

      res.json({
        definition,
        execution: linkedExecution ?? completedExecution,
        commitment,
        activityLog: log,
      });
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Unable to complete activity",
      });
    }
  });

  app.post("/api/body/subjects", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const subject = await bodyOperationalStore.createSubject({
        ...coerceOperationalDates(req.body),
        userId: (req.user as any).id,
      });
      res.status(201).json(subject);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid Body subject",
      });
    }
  });

  const manualObservationSchema = z.object({
    umbrellaId: z.enum([
      "nutrition.caffeine",
      "nutrition.alcohol",
      "rest.perceived_stress",
      "rest.naps",
      "hygiene.cycle",
      "hygiene.skin_progress",
      "hygiene.appearance_progress",
      "hygiene.products",
      "hygiene.symptoms",
    ]),
    entityKey: z.string().trim().min(1).max(120).default("default"),
    label: z.string().trim().min(1).max(160),
    value: z.union([z.number().finite(), z.string().trim().max(500), z.boolean()]),
    unit: z.string().trim().max(40).nullable().optional(),
    scaleVersion: z.string().trim().max(80).nullable().optional(),
    confidence: z.enum(["exact", "estimated", "unknown"]).default("exact"),
    notes: z.string().trim().max(2000).nullable().optional(),
    attributes: z.record(z.unknown()).default({}),
    privacyClass: z.enum(["general_wellness", "sensitive_health"]).default("sensitive_health"),
    observedAt: z.coerce.date(),
    timezone: z.string().trim().min(1).max(80),
    clientRecordId: z.string().trim().min(8).max(160),
  });

  app.get("/api/body/manual-observations/:umbrellaId", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).id;
    const umbrellaId = req.params.umbrellaId;
    if (!manualObservationSchema.shape.umbrellaId.safeParse(umbrellaId).success) {
      return res.status(400).json({ message: "Unsupported observation umbrella" });
    }
    const subjects = await bodyOperationalStore.listSubjects(userId, "manual_observation");
    const matchingSubjects = subjects.filter((subject) =>
      subject.entityId.startsWith(`${umbrellaId}:`),
    );
    const histories = await Promise.all(
      matchingSubjects.map((subject) =>
        bodyOperationalStore.getSubjectHistory(userId, subject.id),
      ),
    );
    const observations = histories
      .flatMap((history) =>
        (history?.executions ?? []).map((execution) => ({
          ...execution,
          subject: history?.subject,
        })),
      )
      .sort(
        (left, right) =>
          (right.actualStartAt?.getTime() ?? 0) -
          (left.actualStartAt?.getTime() ?? 0),
      );
    res.json({ umbrellaId, observations });
  });

  app.post("/api/body/manual-observations", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).id;
      const input = manualObservationSchema.parse(req.body);
      const existing = await bodyOperationalStore.getExecutionByDomainRecord(
        userId,
        "manual_observation",
        input.clientRecordId,
      );
      if (existing) {
        return res.json({ execution: existing, alreadyRecorded: true });
      }
      const subject = await bodyOperationalStore.createSubject({
        userId,
        subjectType: "manual_observation",
        entityId: `${input.umbrellaId}:${input.entityKey}`,
        titleSnapshot: input.label,
        privacyClass: input.privacyClass,
        source: "manual",
      });
      const execution = await bodyOperationalStore.createExecution({
        userId,
        subjectId: subject.id,
        status: "completed",
        actualStartAt: input.observedAt,
        timezone: input.timezone,
        source: "manual",
        domainRecordType: "manual_observation",
        domainRecordId: input.clientRecordId || randomUUID(),
        evidence: {
          value: input.value,
          unit: input.unit ?? null,
          scaleVersion: input.scaleVersion ?? null,
          confidence: input.confidence,
          notes: input.notes ?? null,
          attributes: {
            umbrellaId: input.umbrellaId,
            entityKey: input.entityKey,
            ...input.attributes,
          },
        },
      });
      res.status(201).json({ subject, execution });
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid manual observation",
      });
    }
  });

  app.post("/api/body/commitments", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const commitment = await bodyOperationalStore.createCommitment({
        ...coerceOperationalDates(req.body),
        userId: (req.user as any).id,
      } as any);
      res.status(201).json(commitment);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid Body commitment",
      });
    }
  });

  app.post("/api/body/executions", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const execution = await bodyOperationalStore.createExecution({
        ...coerceOperationalDates(req.body),
        userId: (req.user as any).id,
      } as any);
      res.status(201).json(execution);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid Body execution",
      });
    }
  });

  app.patch("/api/body/executions/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const execution = await bodyOperationalStore.updateExecution(
        (req.user as any).id,
        req.params.id,
        coerceOperationalDates(req.body) as any,
      );
      if (!execution) {
        return res.status(404).json({ message: "Body execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid Body execution",
      });
    }
  });

  app.post("/api/body/reconciliations", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const reconciliation =
        await bodyOperationalStore.createReconciliation({
          ...req.body,
          userId: (req.user as any).id,
        });
      res.status(201).json(reconciliation);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Invalid Body reconciliation",
      });
    }
  });

  app.post("/api/body/goal-links", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const goal = await storage.getGoal(req.body.goalId);
      if (!goal) return res.status(404).json({ message: "Goal not found" });
      const link = await bodyOperationalStore.createGoalLink({
        ...coerceOperationalDates(req.body),
        userId: (req.user as any).id,
      } as any);
      res.status(201).json(link);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid Body goal link",
      });
    }
  });

  app.post("/api/body/goal-events", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const event = await bodyOperationalStore.createGoalEvent({
        ...coerceOperationalDates(req.body),
        userId: (req.user as any).id,
      } as any);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid Body goal event",
      });
    }
  });

  app.get("/api/body/goal-links/:id/progress", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const progress = await bodyOperationalStore.getGoalProgress(
      (req.user as any).id,
      req.params.id,
    );
    if (!progress) {
      return res.status(404).json({ message: "Body goal link not found" });
    }
    res.json(progress);
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
    const settings = await storage.getPrivacySettings((req.user as any).id);
    res.json(settings);
  });

  const httpServer = createServer(app);
  return httpServer;
}
