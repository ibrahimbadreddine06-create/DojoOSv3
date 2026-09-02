import { bodyPresentationResponse } from "@/lib/body-presentation-data";

const MODE_KEY = "dojo-sample-workspace-mode";
const LEGACY_MODE_KEY = "dojo-body-presentation-mode";
type Row = Record<string, any>;

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const dateAt = (offset: number) => {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + offset);
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
};

const topics = {
  second_brain: [
    { id: "sample-systems", type: "second_brain", name: "Systems Thinking", description: "Feedback loops, leverage points and better decisions", readiness: 74, learnPlanCount: 9, materialsCount: 14 },
    { id: "sample-behavior", type: "second_brain", name: "Behavioral Economics", description: "Biases, incentives and choice architecture", readiness: 61, learnPlanCount: 7, materialsCount: 11 },
    { id: "sample-writing-notes", type: "second_brain", name: "Writing Notes", description: "Ideas being shaped into durable essays", readiness: 48, learnPlanCount: 6, materialsCount: 19 },
  ],
  language: [
    { id: "sample-japanese", type: "language", name: "Japanese", description: "Conversational Japanese and daily reading", readiness: 68, learnPlanCount: 12, materialsCount: 8 },
    { id: "sample-french", type: "language", name: "French", description: "Professional fluency and richer vocabulary", readiness: 82, learnPlanCount: 8, materialsCount: 6 },
  ],
} satisfies Record<string, Row[]>;

const courses = [
  { id: "sample-neuroscience", name: "Cognitive Neuroscience", description: "Attention, memory and neural systems", semester: "Fall 2026", archived: false, averageGrade: "84", lessons: [
    { id: "neuro-1", completed: true }, { id: "neuro-2", completed: true }, { id: "neuro-3", completed: false }, { id: "neuro-4", completed: false },
  ] },
  { id: "sample-statistics", name: "Applied Statistics", description: "Inference, regression and experimental design", semester: "Fall 2026", archived: false, averageGrade: "79", lessons: [
    { id: "stats-1", completed: true }, { id: "stats-2", completed: true }, { id: "stats-3", completed: true }, { id: "stats-4", completed: false }, { id: "stats-5", completed: false },
  ] },
  { id: "sample-ethics", name: "Technology & Ethics", description: "Completed seminar and final paper", semester: "Spring 2026", archived: true, averageGrade: "88", lessons: [
    { id: "ethics-1", completed: true }, { id: "ethics-2", completed: true }, { id: "ethics-3", completed: true },
  ] },
];

const disciplines = [
  { id: "sample-writing", name: "Writing", description: "Clear thinking through deliberate writing", level: 7, currentXp: 420, maxXp: 700, color: "text-orange-600", icon: "PenLine" },
  { id: "sample-strength", name: "Strength Training", description: "Technique, consistency and progressive overload", level: 9, currentXp: 610, maxXp: 900, color: "text-orange-600", icon: "Dumbbell" },
  { id: "sample-chess", name: "Chess", description: "Calculation and positional pattern recognition", level: 4, currentXp: 245, maxXp: 400, color: "text-orange-600", icon: "Crown" },
];

const goals: Row[] = [
  { id: "goal-health", title: "Build a durable health baseline", description: "Consistent sleep, movement and strength without burnout.", year: new Date().getFullYear(), quarter: 3, priority: "high", completed: false, associatedModules: ["body", "planner"], subgoals: [
    { id: "goal-health-sleep", parentId: "goal-health", title: "Average 7h 30m sleep", priority: "high", completed: true, associatedModules: ["body"] },
    { id: "goal-health-strength", parentId: "goal-health", title: "Three strength sessions weekly", priority: "medium", completed: false, associatedModules: ["body", "disciplines"] },
    { id: "goal-health-walk", parentId: "goal-health", title: "8,000 daily steps", priority: "medium", completed: true, associatedModules: ["body"] },
  ] },
  { id: "goal-japanese", title: "Hold a 20-minute Japanese conversation", description: "Daily exposure plus two focused sessions each week.", year: new Date().getFullYear(), quarter: 4, priority: "high", completed: false, associatedModules: ["languages", "planner"], subgoals: [
    { id: "goal-japanese-kanji", parentId: "goal-japanese", title: "Review 500 core kanji", priority: "medium", completed: false, associatedModules: ["languages"] },
    { id: "goal-japanese-talk", parentId: "goal-japanese", title: "Complete 8 tutor sessions", priority: "high", completed: false, associatedModules: ["languages"] },
  ] },
  { id: "goal-course", title: "Finish the semester above 80%", description: "Protect deep-work blocks and review weekly.", year: new Date().getFullYear(), quarter: 4, priority: "medium", completed: false, associatedModules: ["studies", "planner"], subgoals: [
    { id: "goal-course-neuro", parentId: "goal-course", title: "Complete neuroscience notes", priority: "medium", completed: true, associatedModules: ["studies", "second_brain"] },
    { id: "goal-course-stats", parentId: "goal-course", title: "Finish regression project", priority: "high", completed: false, associatedModules: ["studies"] },
  ] },
];

const task = (id: string, text: string, completed: boolean, order: number) => ({ id, text, completed, importance: 3, order });
function plannerBlocks(date: string) {
  const delta = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${dateAt(0)}T12:00:00`).getTime()) / 86400000);
  const past = delta < 0;
  const future = delta > 0;
  const suffix = date.replaceAll("-", "");
  return [
    { id: `plan-${suffix}-morning`, parentId: null, date, startTime: "07:30", endTime: "08:00", title: "Morning reset", completed: past, order: 0, linkedModule: "body", linkedItemId: null, linkedSubItemId: null, tasks: [
      task(`${suffix}-water`, "Water and morning routine", past, 0),
      task(`${suffix}-walk`, "Short outdoor walk", past, 1),
    ] },
    { id: `plan-${suffix}-study`, parentId: null, date, startTime: "09:00", endTime: "11:00", title: future ? "Statistics deep work" : "Neuroscience deep work", completed: past && delta !== -1, order: 1, linkedModule: "studies", linkedItemId: future ? "sample-statistics" : "sample-neuroscience", linkedSubItemId: null, tasks: [
      task(`${suffix}-review`, "Review previous notes", past, 0),
      task(`${suffix}-chapter`, future ? "Regression exercises" : "Attention systems chapter", past && delta !== -1, 1),
    ] },
    { id: `plan-${suffix}-language`, parentId: null, date, startTime: "13:00", endTime: "13:35", title: "Japanese practice", completed: past, order: 2, linkedModule: "languages", linkedItemId: "sample-japanese", linkedSubItemId: null, tasks: [
      task(`${suffix}-kanji`, "Kanji review", past, 0),
      task(`${suffix}-shadow`, "Ten minutes shadowing", past, 1),
    ] },
    { id: `plan-${suffix}-train`, parentId: null, date, startTime: "18:00", endTime: "19:00", title: delta % 2 === 0 ? "Strength session" : "Recovery walk", completed: past && delta !== -2, order: 3, linkedModule: delta % 2 === 0 ? "disciplines" : "body", linkedItemId: delta % 2 === 0 ? "sample-strength" : null, linkedSubItemId: null, tasks: [
      task(`${suffix}-warmup`, "Warm-up", past, 0),
      task(`${suffix}-session`, delta % 2 === 0 ? "Main lifts" : "45 minute walk", past && delta !== -2, 1),
    ] },
    { id: `plan-${suffix}-notes`, parentId: null, date, startTime: "20:30", endTime: "21:00", title: "Capture and connect notes", completed: past, order: 4, linkedModule: "second_brain", linkedItemId: "sample-systems", linkedSubItemId: null, tasks: [
      task(`${suffix}-capture`, "Process reading notes", past, 0),
    ] },
  ];
}

const presets = [
  { id: "preset-focus", name: "Deep work day", blocks: [
    { startTime: "09:00", endTime: "11:00", title: "Primary deep work", linkedModule: "studies", linkedItemId: "sample-neuroscience", tasks: [{ text: "Define one concrete outcome", importance: 4 }] },
    { startTime: "13:00", endTime: "13:35", title: "Japanese practice", linkedModule: "languages", linkedItemId: "sample-japanese", tasks: [{ text: "Review and shadow", importance: 3 }] },
    { startTime: "18:00", endTime: "19:00", title: "Training", linkedModule: "disciplines", linkedItemId: "sample-strength", tasks: [{ text: "Complete planned session", importance: 3 }] },
  ] },
  { id: "preset-recovery", name: "Recovery day", blocks: [
    { startTime: "08:00", endTime: "08:45", title: "Long walk", linkedModule: "body", tasks: [{ text: "Easy outdoor movement", importance: 2 }] },
    { startTime: "20:30", endTime: "21:00", title: "Weekly reflection", linkedModule: "second_brain", linkedItemId: "sample-systems", tasks: [{ text: "Capture lessons", importance: 3 }] },
  ] },
];

const history = (items: Row[], names: (item: Row) => string, idKey: "topicId" | "courseId") =>
  Array.from({ length: 30 }, (_, day) => {
    const offset = day - 29;
    return items.map((item, index) => ({
      id: `metric-${item.id}-${day}`,
      [idKey]: item.id,
      topicName: names(item),
      courseName: names(item),
      date: dateAt(offset),
      completion: String(Math.min(100, 22 + index * 8 + day * (1.35 + index * 0.15))),
    }));
  }).flat();

const topicMetrics = {
  second_brain: history(topics.second_brain, (item) => item.name, "topicId"),
  language: history(topics.language, (item) => item.name, "topicId"),
};
const courseMetrics = history(courses, (item) => item.name, "courseId");
const disciplineMetrics = history(disciplines, (item) => item.name, "topicId");

function learningItems(entityId: string) {
  return [
    { id: `${entityId}-plan-1`, topicId: entityId, courseId: entityId, disciplineId: entityId, parentId: null, title: "Foundations", completed: true, order: 0 },
    { id: `${entityId}-plan-2`, topicId: entityId, courseId: entityId, disciplineId: entityId, parentId: null, title: "Applied practice", completed: false, order: 1 },
    { id: `${entityId}-plan-3`, topicId: entityId, courseId: entityId, disciplineId: entityId, parentId: null, title: "Review and synthesis", completed: false, order: 2 },
  ];
}

export function isSampleWorkspaceMode() {
  return import.meta.env.DEV && typeof window !== "undefined" &&
    (window.sessionStorage.getItem(MODE_KEY) === "true" || window.sessionStorage.getItem(LEGACY_MODE_KEY) === "true");
}

export function setSampleWorkspaceMode(enabled: boolean) {
  if (enabled) {
    window.sessionStorage.setItem(MODE_KEY, "true");
    window.sessionStorage.setItem(LEGACY_MODE_KEY, "true");
  } else {
    window.sessionStorage.removeItem(MODE_KEY);
    window.sessionStorage.removeItem(LEGACY_MODE_KEY);
  }
}

export async function sampleWorkspaceResponse(method: string, input: string, data?: any): Promise<Response | null> {
  if (!isSampleWorkspaceMode()) return null;
  const url = new URL(input, window.location.origin);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const verb = method.toUpperCase();

  const bodyResponse = await bodyPresentationResponse(method, input, data);
  if (bodyResponse) return bodyResponse;

  if (verb === "GET" && path === "/api/goals") return json(goals);
  if (verb === "GET" && path === "/api/day-presets") return json(presets);
  if (verb === "GET" && path === "/api/daily-metrics") return json(Array.from({ length: 30 }, (_, i) => ({ date: dateAt(i - 29), plannerCompletion: String(68 + (i % 6) * 5) })));
  if (verb === "GET" && path.startsWith("/api/daily-metrics/")) return json({ date: path.split("/").at(-1), plannerCompletion: "82" });
  if (verb === "GET" && path.startsWith("/api/time-blocks/linked")) {
    const date = url.searchParams.get("date") ?? dateAt(0);
    const module = url.searchParams.get("module");
    const itemId = url.searchParams.get("itemId");
    return json(plannerBlocks(date).filter((block) => (!module || block.linkedModule === module) && (!itemId || block.linkedItemId === itemId)));
  }
  if (verb === "GET" && /^\/api\/time-blocks\/\d{4}-\d{2}-\d{2}$/.test(path)) return json(plannerBlocks(path.split("/").at(-1)!));

  if (verb === "GET" && path === "/api/knowledge-topics/second_brain") return json(topics.second_brain);
  if (verb === "GET" && path === "/api/knowledge-topics/language") return json(topics.language);
  if (verb === "GET" && path === "/api/courses") return json(courses);
  if (verb === "GET" && path === "/api/disciplines") return json(disciplines);
  if (verb === "GET" && path === "/api/knowledge-metrics-all/second_brain") return json(topicMetrics.second_brain);
  if (verb === "GET" && path === "/api/knowledge-metrics-all/language") return json(topicMetrics.language);
  if (verb === "GET" && path === "/api/course-metrics-all") return json(courseMetrics);
  if (verb === "GET" && path === "/api/discipline-metrics-all") return json(disciplineMetrics);
  if (verb === "GET" && path === "/api/page-settings") return json([]);
  if (verb === "GET" && path.startsWith("/api/linkable-items/")) {
    const module = path.split("/").at(-1);
    if (module === "studies") return json(courses.map(({ id, name }) => ({ id, name })));
    if (module === "disciplines") return json(disciplines.map(({ id, name }) => ({ id, name })));
    if (module === "languages" || module === "language") return json(topics.language.map(({ id, name }) => ({ id, name })));
    if (module === "second_brain") return json(topics.second_brain.map(({ id, name }) => ({ id, name })));
    return json([]);
  }
  if (verb === "GET" && path.startsWith("/api/linkable-sub-items/")) return json(learningItems(path.split("/").at(-1)!).map(({ id, title }) => ({ id, name: title, title })));

  const id = decodeURIComponent(path.split("/").at(-1) ?? "");
  const allTopics = [...topics.second_brain, ...topics.language];
  const topic = allTopics.find((item) => item.id === id);
  const course = courses.find((item) => item.id === id);
  const discipline = disciplines.find((item) => item.id === id);
  if (verb === "GET" && path.startsWith("/api/knowledge-topics/detail/")) return json(topic ? { ...topic, learnPlanItems: learningItems(id), materials: [], flashcards: [] } : null);
  if (verb === "GET" && /^\/api\/courses\/[^/]+$/.test(path)) return json(course ?? null);
  if (verb === "GET" && /^\/api\/disciplines\/[^/]+$/.test(path)) return json(discipline ?? null);
  if (verb === "GET" && path.startsWith("/api/learn-plan-items")) return json(learningItems(id));
  if (verb === "GET" && path.startsWith("/api/flashcards/")) return json([
    { id: `${id}-card-1`, front: "Core concept", back: "A concise explanation", mastered: true },
    { id: `${id}-card-2`, front: "Applied question", back: "Use the concept in context", mastered: false },
  ]);
  if (verb === "GET" && path.startsWith("/api/materials/chapter/")) return json([
    { id: `${id}-material-1`, chapterId: id, title: "Core reading", type: "article", url: "https://example.com", completed: true },
    { id: `${id}-material-2`, chapterId: id, title: "Applied walkthrough", type: "video", url: "https://example.com", completed: false },
  ]);
  if (verb === "GET" && path.startsWith("/api/notes/chapter/")) return json([
    { id: `${id}-note-1`, chapterId: id, title: "Key connections", content: "The central idea connects evidence, practice and reflection.", updatedAt: new Date().toISOString() },
  ]);
  if (verb === "GET" && path.startsWith("/api/knowledge-metrics/")) {
    return json([...topicMetrics.second_brain, ...topicMetrics.language, ...courseMetrics].filter((metric) => metric.topicId === id || metric.courseId === id));
  }
  if (verb === "GET" && path.endsWith("/logs") && path.startsWith("/api/disciplines/")) {
    return json(Array.from({ length: 12 }, (_, index) => ({ id: `${id}-log-${index}`, disciplineId: id, date: new Date(`${dateAt(index - 11)}T18:00:00`).toISOString(), durationMinutes: 35 + (index % 4) * 10, notes: "Focused practice", xpGained: 18 + index })));
  }

  if (["POST", "PATCH", "DELETE"].includes(verb) && ["/api/goals", "/api/time-blocks", "/api/day-presets", "/api/knowledge-topics", "/api/courses", "/api/disciplines"].some((prefix) => path.startsWith(prefix))) {
    return json({ id: data?.id ?? `sample-${crypto.randomUUID()}`, ...data }, verb === "POST" ? 201 : 200);
  }
  return null;
}
