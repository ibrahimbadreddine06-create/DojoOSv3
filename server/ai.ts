import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaterialSearchType = "youtube" | "website" | "pdf" | "custom";

export interface YoutubeResult {
  title: string;
  channel: string;
  url: string;
  videoId: string;
  thumbnailUrl: string;
  description: string;
  covers: string[];
  misses: string[];
}

export interface WebsiteResult {
  title: string;
  url: string;
  description: string;
}

export interface PdfResult {
  title: string;
  url: string;
  description: string;
  author?: string;
}

export interface CustomResult {
  title: string;
  url: string;
  description: string;
  suggestedType: "video" | "link" | "pdf";
}

export interface FindMaterialsParams {
  chapterTitle: string;
  chapterContext: string;
  learningObjectives?: string; // Fixed directive: what exactly must be learned
  materialType: MaterialSearchType;
  userPrompt?: string;
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleType: string;
    submoduleName: string;
  };
}

export interface GenerateLearningObjectivesParams {
  chapterTitle: string;
  chapterContext?: string;
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleType: string;
    submoduleName: string;
  };
}

export type FindMaterialsResult =
  | { type: "youtube"; results: YoutubeResult[] }
  | { type: "website"; results: WebsiteResult[] }
  | { type: "pdf"; results: PdfResult[] }
  | { type: "custom"; results: CustomResult[] };

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ChapterNode {
  title: string;
  learningObjectives?: string[]; // Bullets of what must be mastered
  children: ChapterNode[];
}

export interface TrajectorySource {
  name: string;
  url: string;
  type: "university" | "book" | "course" | "institution" | "website";
}

export interface GeneratedTrajectory {
  chapters: ChapterNode[];
  sources: TrajectorySource[];
}

export interface TrajectoryParams {
  submoduleType: "second_brain" | "languages" | "studies" | "disciplines";
  submoduleName: string;
  goal: string;
  context: string;
  structurePreference: "academic" | "thematic";
  tableOfContents?: string;
}

const TYPE_LABELS: Record<string, string> = {
  second_brain: "Knowledge Topic (Second Brain)",
  languages: "Language Learning",
  studies: "Academic Course / University Study",
  disciplines: "Skill or Discipline to Master",
};

/**
 * Helper to retry AI operations with exponential backoff on 429 (Rate Limit) errors.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429;
    if (isRateLimit && retries > 0) {
      console.log(`[AI] Rate limited (429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function generateLearningTrajectory(
  params: TrajectoryParams
): Promise<GeneratedTrajectory> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as any],
  });

  const typeLabel = TYPE_LABELS[params.submoduleType] || params.submoduleType;

  const structureLabel =
    params.structurePreference === "academic"
      ? "Academic progression (e.g. A1→A2→B1→B2 for languages, or numbered chapters like 1, 2, 3 for courses)"
      : "Thematic grouping (chapters are topic clusters, e.g. 'Grammar', 'Vocabulary', 'Culture')";

  const tocSection = params.tableOfContents
    ? `\n\nEXISTING TABLE OF CONTENTS TO BASE THE TRAJECTORY ON:\n${params.tableOfContents}\n`
    : "";

  const prompt = `You are a world-class educational curriculum designer. Your task is to build a complete, professionally structured learning trajectory.

SUBJECT: ${params.submoduleName}
TYPE: ${typeLabel}
LEARNER GOAL: ${params.goal}
CURRENT LEVEL / CONTEXT: ${params.context}
STRUCTURE PREFERENCE: ${structureLabel}
${tocSection}

RESEARCH REQUIREMENTS:
- PRIORITY: Search for and analyze major university syllabi (Harvard, MIT, Stanford, Oxford, Cambridge, etc.)
- Find official university course pages and lecture materials for this subject
- Analyze well-known textbooks used in universities and provide their actual URLs
- Check official certification frameworks (CEFR for languages, ACM for CS, IB curricula, etc.)
- For languages, prioritize official institutions (Goethe Institute, Institut Français, British Council, etc.)
- Include reputable academic sources: university presses, academic journals, educational institutions
- Avoid generic websites — prioritize .edu, .org, and official academic domains
- Reference only ACTUAL curricula and resources you find through research

CRITICAL RULES:
1. The trajectory MUST be COMPLETE — missing any essential topic is a failure
2. Order MUST be logical — prerequisites always before advanced material
3. You CANNOT teach advanced concepts before foundational ones
4. Aim for 4–8 main chapters, each with 3–8 subchapters
5. Use sub-subchapters only when genuinely necessary (max 3 levels deep)
6. List sources in order of importance: UNIVERSITY SOURCES FIRST, then textbooks, then official institutions, then courses
7. Include ONLY sources you actually consulted — real URLs that are actually relevant

OUTPUT FORMAT — return ONLY valid JSON, no markdown, no extra text:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "learningObjectives": ["bullet 1", "bullet 2"],
      "children": [
        {
          "title": "Subchapter Title",
          "learningObjectives": ["bullet 1", "bullet 2"],
          "children": []
        }
      ]
    }
  ],
  "sources": [
    {
      "name": "Source Name",
      "url": "https://exact-url.com",
      "type": "university"
    }
  ]
}

Source type values: "university", "book", "course", "institution", "website"`;

  const result = await withRetry(() => model.generateContent(prompt));
  const response = result.response;
  const text = response.text();

  // Parse JSON — Gemini sometimes wraps in markdown code blocks
  let jsonStr = text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  } else {
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
  }

  let parsed: GeneratedTrajectory;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response:", text.substring(0, 500));
    throw new Error("AI returned an invalid response. Please try again.");
  }

  if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
    throw new Error("AI response missing chapters array.");
  }
  if (!parsed.sources) parsed.sources = [];

  // Supplement with grounding metadata sources
  const candidates = response.candidates;
  const groundingMeta = candidates?.[0]?.groundingMetadata as any;
  if (groundingMeta?.groundingChunks) {
    const existingUrls = new Set(parsed.sources.map((s) => s.url));
    for (const chunk of groundingMeta.groundingChunks) {
      if (chunk.web?.uri && !existingUrls.has(chunk.web.uri)) {
        try {
          new URL(chunk.web.uri); // validate
          parsed.sources.push({
            name: chunk.web.title || new URL(chunk.web.uri).hostname,
            url: chunk.web.uri,
            type: "website",
          });
          existingUrls.add(chunk.web.uri);
        } catch {
          // skip invalid URLs
        }
      }
    }
  }

  return parsed;
}

// ─── Learning Objectives Generator ───────────────────────────────────────────

export async function generateLearningObjectives(
  params: GenerateLearningObjectivesParams
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextBlock = params.trajectoryContext
    ? `Subject: ${params.trajectoryContext.submoduleName}\nGoal: ${params.trajectoryContext.goal}\nLevel: ${params.trajectoryContext.context}`
    : "";

  const prompt = `You are a curriculum expert. Generate a concise, structured learning directive for a chapter.

CHAPTER: "${params.chapterTitle}"
${contextBlock}
${params.chapterContext ? `EXISTING NOTES:\n${params.chapterContext}` : ""}

Create a bullet-pointed list of exactly what a learner must understand after completing this chapter.
Be specific and concrete — list the key concepts, skills, formulas, or techniques that must be mastered.
This directive will be used to evaluate whether study materials cover the right content.

OUTPUT: Plain text bullet list (use • bullets), no markdown headers, max 10 bullets, each bullet is a specific learning objective.`;

  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text().trim();
}

// ─── AI Material Finder ───────────────────────────────────────────────────────

// Search YouTube using the YouTube Data API v3 — returns real results, no AI hallucination.
async function searchYouTubeAPI(query: string, maxResults = 10): Promise<YoutubeResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YouTube API key not configured (missing YOUTUBE_API_KEY)");

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    relevanceLanguage: "en",
    key: apiKey,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${errBody.substring(0, 200)}`);
  }

  const data = await res.json() as { items?: any[] };

  return (data.items || [])
    .filter((item: any) => item.id?.videoId)
    .map((item: any) => {
      const videoId: string = item.id.videoId;
      const snippet = item.snippet || {};
      return {
        title: snippet.title || "YouTube Video",
        channel: snippet.channelTitle || "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        thumbnailUrl:
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        description: snippet.description || "",
        covers: [] as string[],
        misses: [] as string[],
      } satisfies YoutubeResult;
    });
}

// Analyze a YouTube video's content against the learning directive using Gemini's knowledge.
// Uses text-only analysis (knowledge-based) — more reliable than fileData YouTube processing.
// Analyze multiple YouTube videos in ONE call to Gemini to save API quota.
async function analyzeVideosBulk(
  videos: { videoId: string; title: string; channel: string }[],
  directive: string,
  chapterTitle: string
): Promise<Record<string, { covers: string[]; misses: string[]; score: number; description: string }>> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const videosList = videos.map((v, i) => 
    `VIDEO #${i + 1}: "${v.title}" by ${v.channel} (ID: ${v.videoId})`
  ).join("\n");

  const prompt = `You are evaluating YouTube videos for a learner studying: "${chapterTitle}".

LEARNING DIRECTIVE — what the learner must master:
${directive}

CANDIDATE VIDEOS:
${videosList}

TASK: For each video above, determine:
1. Which specific learning objectives from the directive are clearly covered?
2. Which specific learning objectives are NOT adequately covered?
3. Alignment score (0-10): how well does this video serve this EXACT directive?
4. Write a 1-2 sentence description of what the video teaches.

OUTPUT — return a JSON object where keys are the video IDs:
{
  "videoId1": {
    "covers": ["objective A", "objective B"],
    "misses": ["objective C"],
    "score": 8,
    "description": "..."
  },
  ...
}`;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Bulk video analysis failed:", err);
    return {};
  }
}

export async function findMaterialsForChapter(
  params: FindMaterialsParams
): Promise<FindMaterialsResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextBlock = params.trajectoryContext
    ? `LEARNER CONTEXT:
- Subject: ${params.trajectoryContext.submoduleName}
- Learner goal: ${params.trajectoryContext.goal}
- Current level: ${params.trajectoryContext.context}
- Module type: ${params.trajectoryContext.submoduleType}`
    : "";

  const subtopicsBlock = params.chapterContext
    ? `SUBTOPICS IN THIS CHAPTER:\n${params.chapterContext}`
    : "";

  const userPromptBlock = params.userPrompt
    ? `ADDITIONAL INSTRUCTIONS FROM LEARNER:\n${params.userPrompt}`
    : "";

  let prompt = "";

  // Build the directive: prefer explicit learningObjectives, fall back to chapterContext
  const directive = params.learningObjectives || params.chapterContext || params.chapterTitle;

  if (params.materialType === "youtube") {
    // ── YouTube: search via YouTube Data API v3 (real results, no AI hallucination) ──
    const searchQuery = [
      params.chapterTitle,
      params.trajectoryContext?.submoduleName,
      "tutorial",
    ].filter(Boolean).join(" ");

    console.log(`YouTube API search: "${searchQuery}"`);

    let candidates: YoutubeResult[] = [];
    try {
      candidates = await searchYouTubeAPI(searchQuery, 10);
    } catch (err: any) {
      console.error("YouTube API search failed:", err.message);
      throw new Error(`YouTube search failed: ${err.message}`);
    }

    console.log(`YouTube API: ${candidates.length} results found`);

    // Deduplicate by videoId
    const seen = new Set<string>();
    const deduped = candidates.filter(v => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });

    // Analyze the top candidates in ONE bulk call to save API quota
    const candidateSubset = deduped.slice(0, 8);
    const analysisMap = await analyzeVideosBulk(candidateSubset, directive, params.chapterTitle);

    const analyzed: (YoutubeResult & { _score: number })[] = candidateSubset
      .map(video => {
        const analysis = analysisMap[video.videoId];
        if (!analysis) return { ...video, _score: -1 };
        return {
          ...video,
          covers: analysis.covers,
          misses: analysis.misses,
          description: analysis.description || video.description,
          _score: analysis.score,
        };
      })
      .filter((v): v is YoutubeResult & { _score: number } => v !== null);

    analyzed.sort((a, b) => b._score - a._score);
    const top4 = analyzed.slice(0, 4).map(({ _score: _, ...v }) => v);
    console.log(`YouTube search: returning ${top4.length} videos after content analysis`);
    return { type: "youtube", results: top4 };
  } else if (params.materialType === "website") {
    prompt = `You are an expert educational resource curator. Use Google Search to find real, currently accessible websites for this learning need.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${userPromptBlock}

TASK: Search Google for 3-5 websites, articles, or documentation pages that DIRECTLY HELP someone learn this chapter with these subtopics and goals.

SEARCH INSTRUCTIONS:
- Actively search Google for pages matching this chapter's topics
- Prioritize: Wikipedia, Khan Academy, MIT OpenCourseWare, Stanford, official documentation, expert blogs
- Prefer .edu, .org, and official domains
- Only include pages that are currently accessible

OUTPUT — ONLY valid JSON array:
[
  {
    "title": "Article/page title",
    "url": "https://example.com/page",
    "description": "How it helps (2-3 sentences)"
  }
]`;
  } else if (params.materialType === "pdf") {
    prompt = `You are an expert educational resource curator. Use Google Search to find real, freely accessible PDFs for this learning need.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${userPromptBlock}

TASK: Search Google for 3-5 free PDFs, papers, or lecture notes that DIRECTLY HELP someone master this chapter's subtopics and goals.

SEARCH INSTRUCTIONS:
- Actively search Google for free academic PDFs on these topics
- Prioritize: MIT OpenCourseWare lecture notes, Stanford materials, ArXiv papers, open textbooks, official specs
- Only include PDFs with direct, working URLs that are currently accessible

OUTPUT — ONLY valid JSON array:
[
  {
    "title": "PDF/document title",
    "url": "https://example.com/file.pdf",
    "description": "How it helps (2-3 sentences)",
    "author": "Author or institution (optional)"
  }
]`;
  } else {
    // custom
    prompt = `You are an expert educational resource curator. Use Google Search to find the best learning resources for this specific request.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}

LEARNER'S SPECIFIC REQUEST: ${params.userPrompt || "Find the most useful mixed resources"}

SEARCH INSTRUCTIONS:
- Actively search Google for real, currently accessible resources matching this request
- Include any type: videos, articles, PDFs, tools, interactive demos
- Return the 5 most relevant and useful results

OUTPUT — return ONLY valid JSON array, no markdown:
[
  {
    "title": "Resource title",
    "url": "https://exact-url.com",
    "description": "Why this resource matches the request (2-3 sentences)",
    "suggestedType": "video" | "link" | "pdf"
  }
]`;
  }

  // Website, PDF, and custom types: use Gemini with Google Search grounding
  let result;
  try {
    result = await withRetry(() => model.generateContent(prompt));
  } catch (err: any) {
    console.error("AI find-materials error:", err.message);
    return { type: params.materialType as "website" | "pdf" | "custom", results: [] };
  }

  let text = "";
  try {
    text = result.response.text();
  } catch {
    text = "";
  }

  let jsonStr = text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  } else {
    const firstBracket = jsonStr.indexOf("[");
    const lastBracket = jsonStr.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
    }
  }

  let parsed: any[] = [];
  try {
    const attempt = JSON.parse(jsonStr);
    if (Array.isArray(attempt)) parsed = attempt;
  } catch {
    console.error("Failed to parse AI material search response:", text.substring(0, 500));
    throw new Error("AI returned an invalid response. Please try again.");
  }

  if (params.materialType === "website") {
    const results: WebsiteResult[] = parsed.map((r: any) => ({
      title: r.title || "Untitled",
      url: r.url || "",
      description: r.description || "",
    }));
    return { type: "website", results };
  } else if (params.materialType === "pdf") {
    const results: PdfResult[] = parsed.map((r: any) => ({
      title: r.title || "Untitled",
      url: r.url || "",
      description: r.description || "",
      author: r.author,
    }));
    return { type: "pdf", results };
  } else {
    const results: CustomResult[] = parsed.map((r: any) => ({
      title: r.title || "Untitled",
      url: r.url || "",
      description: r.description || "",
      suggestedType: (["video", "link", "pdf"].includes(r.suggestedType) ? r.suggestedType : "link") as "video" | "link" | "pdf",
    }));
    return { type: "custom", results };
  }
}

// ─── Types for AI Notes ───────────────────────────────────────────────────────

export interface GenerateNotesParams {
  chapterTitle: string;
  chapterContext: string;
  materials: { title: string; url?: string; type?: string }[];
  userPrompt?: string;
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleName: string;
    submoduleType: string;
  };
}

export interface GeneratedNote {
  title: string;
  content: string;
}

// ─── AI Notes Generation ──────────────────────────────────────────────────────

export async function generateNotes(params: GenerateNotesParams): Promise<GeneratedNote> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as any],
  });

  const contextBlock = params.trajectoryContext
    ? `LEARNER CONTEXT:
- Subject: ${params.trajectoryContext.submoduleName}
- Learner goal: ${params.trajectoryContext.goal}
- Background: ${params.trajectoryContext.context}
- Module type: ${params.trajectoryContext.submoduleType}`
    : "";

  const materialsBlock = params.materials.length > 0
    ? `SELECTED MATERIALS TO ANALYZE:\n${params.materials.map((m, i) =>
      `${i + 1}. ${m.title}${m.url ? ` — ${m.url}` : ""}${m.type ? ` (${m.type})` : ""}`
    ).join("\n")}`
    : "";

  const subtopicsBlock = params.chapterContext
    ? `CHAPTER SUBTOPICS:\n${params.chapterContext}`
    : "";

  const userPromptBlock = params.userPrompt
    ? `SPECIFIC INSTRUCTION FROM LEARNER:\n${params.userPrompt}`
    : "Produce comprehensive structured notes that summarize and explain the chapter clearly.";

  const prompt = `You are an expert learning coach and educator. Your task is to generate high-quality, structured study notes for a learner.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${materialsBlock}
${userPromptBlock}

TASK: Create detailed, well-organized study notes for this chapter.
${params.materials.length > 0 ? "Use the selected materials as your primary sources — access and analyze their content via web search if possible." : "Draw on your knowledge of this topic."}

REQUIREMENTS FOR THE NOTES:
- Start with a concise chapter overview (2-3 sentences)
- Organize content with clear headings and subheadings
- Include key concepts, definitions, and explanations
- Add concrete examples and analogies where helpful
- Highlight key takeaways or insights
- End with a brief summary of the most important points
- Write for the learner's level and goal

OUTPUT FORMAT: Return a JSON object with "title" and "content" fields.
- "title": A descriptive title for these notes (e.g., "Notes on X: Key Concepts & Insights")
- "content": The notes as HTML (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags for rich formatting)

Return ONLY the JSON object, no markdown fences:
{"title": "...", "content": "<h2>...</h2><p>...</p>..."}`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text().trim();

  let jsonStr = text;
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) jsonStr = fenceMatch[1];
  const objStart = jsonStr.indexOf("{");
  const objEnd = jsonStr.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1) jsonStr = jsonStr.substring(objStart, objEnd + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      title: parsed.title || `Notes: ${params.chapterTitle}`,
      content: parsed.content || text,
    };
  } catch {
    return {
      title: `Notes: ${params.chapterTitle}`,
      content: `<p>${text}</p>`,
    };
  }
}

// ─── Types for AI Flashcards ──────────────────────────────────────────────────

export type FlashcardStyle = "basic" | "cloze" | "concept" | "feynman" | "scenario" | "custom";

export interface GenerateFlashcardsParams {
  chapterTitle: string;
  chapterContext: string;
  materials: { title: string; url?: string; type?: string }[];
  userPrompt?: string;
  style: FlashcardStyle;
  customStyle?: string;
  trajectoryContext?: {
    goal: string;
    context: string;
    submoduleName: string;
    submoduleType: string;
  };
  previousCards?: { front: string; back: string }[];
  feedback?: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

// ─── AI Flashcard Generation ──────────────────────────────────────────────────

const STYLE_DESCRIPTIONS: Record<FlashcardStyle, string> = {
  basic: "Basic Q&A: Ask a direct question on the front, give a clear answer on the back. Example front: 'What is X?' | back: 'X is...'",
  cloze: "Cloze deletion: Front shows a sentence with a key term blanked out (use ___ for the blank). Back shows the missing term plus a brief explanation. Example front: '___ is the process of...' | back: 'Osmosis — ...'",
  concept: "Concept flashcards: Front shows a concept/term. Back gives a precise definition + one concrete example. Example front: 'Neural Network' | back: 'Definition: ... | Example: ...'",
  feynman: "Feynman technique: Front asks 'Explain X as if I have no background in it.' Back gives a simple, analogy-rich explanation that a curious teenager could understand.",
  scenario: "Scenario-based: Front describes a realistic situation/problem. Back explains what approach/concept applies and why. Focuses on application, not just memorization.",
  custom: "Custom style as specified by the learner.",
};

export async function generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as any],
  });

  const contextBlock = params.trajectoryContext
    ? `LEARNER CONTEXT:
- Subject: ${params.trajectoryContext.submoduleName}
- Goal: ${params.trajectoryContext.goal}
- Background: ${params.trajectoryContext.context}`
    : "";

  const materialsBlock = params.materials.length > 0
    ? `SELECTED MATERIALS TO BASE FLASHCARDS ON:\n${params.materials.map((m, i) =>
      `${i + 1}. ${m.title}${m.url ? ` — ${m.url}` : ""}${m.type ? ` (${m.type})` : ""}`
    ).join("\n")}`
    : "";

  const subtopicsBlock = params.chapterContext
    ? `CHAPTER SUBTOPICS:\n${params.chapterContext}`
    : "";

  const styleInstruction = params.style === "custom"
    ? `FLASHCARD STYLE (custom, as requested by learner): ${params.customStyle || "Mixed styles, learner's preference"}`
    : `FLASHCARD STYLE: ${STYLE_DESCRIPTIONS[params.style]}`;

  const userPromptBlock = params.userPrompt ? `ADDITIONAL INSTRUCTIONS: ${params.userPrompt}` : "";

  let prompt = "";

  if (params.previousCards && params.previousCards.length > 0 && params.feedback) {
    // Regeneration mode — improve based on feedback
    const prevCardsJson = JSON.stringify(params.previousCards, null, 2);
    prompt = `You are an expert flashcard creator. Improve the following flashcard set based on the learner's feedback.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${materialsBlock}

${styleInstruction}
${userPromptBlock}

PREVIOUS FLASHCARDS (to improve upon):
${prevCardsJson}

LEARNER FEEDBACK (what was wrong / what to change):
${params.feedback}

TASK: Rewrite and improve the full flashcard set addressing every point in the feedback. Keep what was good, fix what was wrong. Maintain comprehensive coverage of the chapter.

OUTPUT — return ONLY a valid JSON array (no markdown, no extra text):
[{"front": "question or prompt", "back": "answer or explanation"}, ...]`;
  } else {
    // Initial generation mode
    prompt = `You are an expert flashcard creator. Create a comprehensive flashcard set for a learning chapter.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${materialsBlock}
${userPromptBlock}

${styleInstruction}

TASK: Create 12-18 flashcards that comprehensively cover all key concepts of this chapter.
${params.materials.length > 0 ? "Access and analyze the listed materials via web search to base your flashcards on their actual content." : "Draw on your knowledge of this topic."}

REQUIREMENTS:
- Cover all important concepts, terms, and ideas from the chapter
- Make each flashcard focused on ONE clear concept (no info overload per card)
- Vary the difficulty: include foundational, intermediate, and advanced cards
- Ensure full coverage — every major subtopic should have at least one card
- Follow the specified flashcard style consistently throughout

OUTPUT — return ONLY a valid JSON array (no markdown, no extra text):
[{"front": "question or prompt", "back": "answer or explanation"}, ...]`;
  }

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text().trim();

  let jsonStr = text;
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) jsonStr = fenceMatch[1];
  const arrStart = jsonStr.indexOf("[");
  const arrEnd = jsonStr.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1) jsonStr = jsonStr.substring(arrStart, arrEnd + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed.map((c: any) => ({
      front: String(c.front || c.question || c.front_text || ""),
      back: String(c.back || c.answer || c.back_text || ""),
    })).filter(c => c.front && c.back);
  } catch {
    throw new Error("AI returned an invalid flashcard response. Please try again.");
  }
}

// ─── Activity Brief ──────────────────────────────────────────────────────────

export async function generateActivityBrief(dailyData: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "No activity logged yet today. Tap '+ Log activity' to get started.";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const dataStr = JSON.stringify(dailyData || {});
  const prompt = `In 1-2 sentences, summarize the user's activity status for today. Data: ${dataStr}. Keep it conversational and motivating. No markdown. If there's no meaningful data, say something encouraging about getting started.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  return text.trim();
}

// ─── Nutrition Brief ─────────────────────────────────────────────────────────

export async function generateNutritionBrief(intakeLogs: any[], bodyProfile: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "No intake logged yet today. Tap '+ Log intake' to get started.";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const totals = intakeLogs.reduce((acc: any, log: any) => {
    acc.calories = (acc.calories || 0) + (parseFloat(log.calories) || 0);
    acc.protein = (acc.protein || 0) + (parseFloat(log.protein) || 0);
    acc.carbs = (acc.carbs || 0) + (parseFloat(log.carbs) || 0);
    acc.fat = (acc.fat || 0) + (parseFloat(log.fats) || 0);
    return acc;
  }, {});

  const goals = {
    calories: bodyProfile?.dailyCalorieGoal || 2500,
    protein: bodyProfile?.dailyProteinGoal || 150,
  };

  const dataStr = JSON.stringify({ totals, goals, logs: intakeLogs.map(l => ({ name: l.mealName, cals: l.calories })) });
  const prompt = `You are a nutrition data analyst. In 1-2 sentences, summarize the user's intake compared to their goals.
    Be factual, specific, and concise. 
    Use this data: ${dataStr}.
    Focus on Calories and Protein first. If they have logged specific meals, you can mention them if relevant to the balance.
    Example: "Protein on track — 142g of 188g consumed. 860 kcal remaining toward your 2500 kcal goal."
    No motivational language. No markdown. No conversational filler.`;

  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text().trim();
}

// ─── Rest Brief ─────────────────────────────────────────────────────────────

export async function generateRestBrief(dailyState: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Rest & recovery analysis currently unavailable.";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const dataStr = JSON.stringify(dailyState || {});
  const prompt = `You are a sleep and recovery coach. In 1-2 sentences, summarize the user's recovery status.
    Data: ${dataStr}.
    Focus on readiness, sleep quality, and wind-down adherence.
    Keep it conversational and professional. No markdown.`;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    return result.response.text().trim();
  } catch (e) {
    return "Your recovery data is looking stable. Focus on a consistent wind-down routine tonight.";
  }
}

// ─── Fuel Category Classification ────────────────────────────────────────────

export async function classifyFuelCategory(foodName: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Classify this food into one or more of these categories: plants, quality-protein, complex-carbs, healthy-fats, ultra-processed, high-sodium, added-sugars, red-processed-meat. Food: "${foodName}". Return ONLY a JSON array of strings. Example: ["plants","quality-protein"]`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text().trim();
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.filter((s: any) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// ─── AI Meal Analysis ─────────────────────────────────────────────────────────

export async function analyzeMealDescription(description: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyze this meal description for the DojoOS Nutrition module. 
    Meal: "${description}"
    
    Return ONLY a JSON object with: 
    - mealName (string)
    - calories (number)
    - protein (number, grams)
    - carbs (number, grams)
    - fats (number, grams)
    - fiber (number, grams)
    - fuelCategories (string array matching: plants, quality-protein, complex-carbs, healthy-fats, ultra-processed, high-sodium, added-sugars, red-processed-meat)
    
    Rules for fuelCategories:
    - "plants": vegetables, fruits, whole grains
    - "quality-protein": lean meats, fish, tofu, legumes
    - "complex-carbs": whole grains, sweet potatoes, legumes
    - "healthy-fats": avocado, nuts, olive oil, seeds
    - "ultra-processed": packaged snacks, sodas, fast food
    - "high-sodium": processed meats, canned soups, salty snacks
    - "added-sugars": candies, sugary drinks, desserts
    - "red-processed-meat": bacon, sausage, salami, red meat
    
    Example: {"mealName": "Chicken Salad", "calories": 350, "protein": 30, "carbs": 10, "fats": 20, "fiber": 5, "fuelCategories": ["plants", "quality-protein"]}
    If you cannot estimate, return null.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text().trim();
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function analyzeMealPhoto(base64Image: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyze this meal photo for the DojoOS Nutrition module. 
    
    Return ONLY a JSON object with: 
    - mealName (string)
    - calories (number)
    - protein (number, grams)
    - carbs (number, grams)
    - fats (number, grams)
    - fiber (number, grams)
    - fuelCategories (string array matching: plants, quality-protein, complex-carbs, healthy-fats, ultra-processed, high-sodium, added-sugars, red-processed-meat)
    
    Rules for fuelCategories:
    - "plants": vegetables, fruits, whole grains
    - "quality-protein": lean meats, fish, tofu, legumes
    - "complex-carbs": whole grains, sweet potatoes, legumes
    - "healthy-fats": avocado, nuts, olive oil, seeds
    - "ultra-processed": packaged snacks, sodas, fast food
    - "high-sodium": processed meats, canned soups, salty snacks
    - "added-sugars": candies, sugary drinks, desserts
    - "red-processed-meat": bacon, sausage, salami, red meat
    
    Example: {"mealName": "Steak and Veggies", "calories": 500, "protein": 40, "carbs": 15, "fats": 30, "fiber": 8, "fuelCategories": ["quality-protein", "plants"]}
    If you cannot identify the food, return null.`;

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1] || base64Image,
      mimeType: "image/jpeg",
    },
  };

  const result = await withRetry(() => model.generateContent([prompt, imagePart]));
  const text = result.response.text().trim();
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ─── Sensei AI Chat ────────────────────────────────────────────────────────────

export interface SenseiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SenseiChatParams {
  message: string;
  history: SenseiChatMessage[];
  context: {
    submoduleType: string;
    submoduleName: string;
    submoduleDescription?: string;
    trajectoryContext?: {
      goal: string;
      context: string;
      structure: string;
    };
    chapters: Array<{
      title: string;
      completed: boolean;
      importance: number;
      notes?: string;
      children: any[];
    }>;
    flashcards: Array<{
      front: string;
      back: string;
      mastery: number;
    }>;
    chapterNotes: Array<{
      title: string;
      content: string;
    }>;
    materials: Array<{
      title: string;
      type: string;
      url?: string;
    }>;
    metrics?: {
      completion: number;
      readiness: number;
    };
    todaysSessions?: Array<{
      title: string;
      startTime: string;
      duration: number;
    }>;
    disciplineLevel?: number;
    disciplineXp?: number;
  };
}

function renderChapterTree(chapters: any[], depth = 0): string {
  return chapters.map(ch => {
    const indent = "  ".repeat(depth);
    const status = ch.completed ? "✓" : "○";
    const importance = ch.importance ? ` (importance ${ch.importance}/5)` : "";
    const noteSnippet = ch.notes ? ` — ${String(ch.notes).slice(0, 80)}` : "";
    const line = `${indent}${status} ${ch.title}${importance}${noteSnippet}`;
    const children = ch.children?.length > 0
      ? "\n" + renderChapterTree(ch.children, depth + 1)
      : "";
    return line + children;
  }).join("\n");
}

export async function chatWithSensei(params: SenseiChatParams): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const { context, message, history } = params;
  const masteryLabels = ["new", "needs work", "okay", "good", "mastered"];

  // Cap flashcards to 100 least-mastered to avoid token limits
  const sortedFlashcards = [...context.flashcards]
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 100);

  const flashcardsSection = sortedFlashcards.length > 0
    ? `=== FLASHCARDS (${sortedFlashcards.length} of ${context.flashcards.length} shown — least mastered first) ===\n` +
      sortedFlashcards.map(f =>
        `Q: ${f.front}\nA: ${f.back}\nMastery: ${masteryLabels[f.mastery] ?? f.mastery}`
      ).join("\n---\n")
    : "";

  const notesSection = context.chapterNotes.length > 0
    ? `=== NOTES (${context.chapterNotes.length} notes) ===\n` +
      context.chapterNotes.map(n => {
        const plain = (n.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return `[${n.title}]\n${plain.slice(0, 400)}`;
      }).join("\n\n")
    : "";

  const materialsSection = context.materials.length > 0
    ? `=== MATERIALS (${context.materials.length} resources) ===\n` +
      context.materials.map(m => `• ${m.title} (${m.type})${m.url ? " — " + m.url : ""}`).join("\n")
    : "";

  const metricsSection = context.metrics
    ? `=== KNOWLEDGE METRICS ===\nCompletion: ${context.metrics.completion}%\nRetention/Readiness: ${context.metrics.readiness}%`
    : "";

  const sessionsSection = context.todaysSessions && context.todaysSessions.length > 0
    ? `=== TODAY'S PLANNED SESSIONS ===\n` +
      context.todaysSessions.map(s => `• ${s.title} at ${s.startTime} (${s.duration} min)`).join("\n")
    : "";

  const disciplineSection = context.disciplineLevel !== undefined
    ? `=== DISCIPLINE PROGRESS ===\nLevel: ${context.disciplineLevel} | XP: ${context.disciplineXp ?? 0}`
    : "";

  const trajectorySection = context.trajectoryContext
    ? `=== LEARNING TRAJECTORY ===\nGoal: ${context.trajectoryContext.goal}\nBackground: ${context.trajectoryContext.context}\nStructure: ${context.trajectoryContext.structure}`
    : "";

  const systemPrompt = `You are Sensei AI, an intelligent personal learning coach embedded in DojoOS — a personal mastery operating system. You have complete, real-time access to the learner's study module and use it to give specific, context-aware guidance.

=== LEARNER'S MODULE ===
Subject: ${context.submoduleName}
Type: ${context.submoduleType}${context.submoduleDescription ? `\nDescription: ${context.submoduleDescription}` : ""}

${trajectorySection}

=== CHAPTERS (${context.chapters.length} total) ===
${renderChapterTree(context.chapters)}

${flashcardsSection}

${notesSection}

${materialsSection}

${metricsSection}

${sessionsSection}

${disciplineSection}

=== YOUR ROLE ===
- Be a concise, direct Sensei. No filler. Answer questions, explain concepts, quiz the learner, or help them plan.
- Reference their actual chapters, flashcards, and notes when relevant.
- If asked to quiz them, use their real flashcard questions.
- Keep responses focused and actionable.
- Use plain text only — no markdown headers or excessive bullet lists unless the learner asks.`;

  const conversationHistory = history.map(m =>
    `${m.role === "user" ? "Learner" : "Sensei"}: ${m.content}`
  ).join("\n");

  const fullPrompt = `${systemPrompt}

=== CONVERSATION ===
${conversationHistory ? conversationHistory + "\n" : ""}Learner: ${message}
Sensei:`;

  const result = await withRetry(() => model.generateContent(fullPrompt));
  return result.response.text().trim();
}

