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
  materialType: MaterialSearchType;
  userPrompt?: string;
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
      "children": [
        {
          "title": "Subchapter Title",
          "children": [
            {
              "title": "Sub-subchapter (only if needed)",
              "children": []
            }
          ]
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

  const result = await model.generateContent(prompt);
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

// ─── AI Material Finder ───────────────────────────────────────────────────────

function extractYoutubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

// Enrich a YouTube result via oEmbed.
// mustVerify=true → returns null if oEmbed fails (hard filter for AI-fabricated IDs).
// mustVerify=false → returns soft fallback if oEmbed fails (trusted grounding URLs).
async function enrichYoutubeVideo(rawResult: any, mustVerify: boolean): Promise<YoutubeResult | null> {
  const url = rawResult.url || "";
  const videoId = extractYoutubeId(url);

  if (videoId) {
    try {
      const canonical = `https://www.youtube.com/watch?v=${videoId}`;
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json() as { title: string; author_name: string; thumbnail_url: string };
        return {
          title: data.title || rawResult.title || "YouTube Video",
          channel: data.author_name || rawResult.channel || "",
          url: canonical,
          videoId,
          thumbnailUrl: data.thumbnail_url,
          description: rawResult.description || "",
          covers: Array.isArray(rawResult.covers) ? rawResult.covers : [],
          misses: Array.isArray(rawResult.misses) ? rawResult.misses : [],
        };
      }
    } catch { /* fall through */ }
  }

  // oEmbed failed — if this result needs verification, discard it (it's fake)
  if (mustVerify) return null;

  // Grounding-sourced URLs: keep with soft fallback (real Google Search result)
  return {
    title: rawResult.title || "YouTube Video",
    channel: rawResult.channel || "",
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : url,
    videoId: videoId || "",
    thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "",
    description: rawResult.description || "",
    covers: Array.isArray(rawResult.covers) ? rawResult.covers : [],
    misses: Array.isArray(rawResult.misses) ? rawResult.misses : [],
  };
}

export async function findMaterialsForChapter(
  params: FindMaterialsParams
): Promise<FindMaterialsResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as any],
  });

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

  if (params.materialType === "youtube") {
    prompt = `You are an expert educational resource curator. Use Google Search to find real, currently available YouTube videos for this learning need.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${userPromptBlock}

TASK: Search Google for 5-6 YouTube educational videos that DIRECTLY HELP someone learn this chapter with these subtopics and goals.

SEARCH INSTRUCTIONS:
- Actively search YouTube/Google for videos matching this chapter's topics
- Prefer trustworthy educational creators: Khan Academy, MIT OpenCourseWare, 3Blue1Brown, Crash Course, freeCodeCamp, Kurzgesagt, CrashCourse, Sentdex, etc.
- Find videos that match the learner's level and goals
- Only include videos that actually exist and are publicly available right now

OUTPUT — return ONLY valid JSON array:
[
  {
    "title": "Exact video title from YouTube",
    "channel": "Channel name",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "description": "How this helps (2-3 sentences)",
    "covers": ["subtopic covered"],
    "misses": ["subtopic not in video"]
  }
]`;
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

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err: any) {
    console.error("AI find-materials error:", err.message);
    // For non-YouTube, Gemini failure = can't get results
    if (params.materialType !== "youtube") {
      return { type: params.materialType, results: [] };
    }
    // YouTube: if Gemini fails, return empty (no grounding without response)
    return { type: "youtube", results: [] };
  }

  let text = "";
  try {
    text = result.response.text();
  } catch {
    // Gemini may throw if the response was blocked or contains no text parts
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

  // Gemini sometimes returns an empty text body when it relies entirely on
  // grounding metadata (no JSON array in the response text). For YouTube we
  // can still recover from grounding chunks alone, so treat parse failures as
  // an empty parsed array rather than a hard error.
  let parsed: any[] = [];
  try {
    const attempt = JSON.parse(jsonStr);
    if (Array.isArray(attempt)) parsed = attempt;
  } catch {
    if (params.materialType !== "youtube") {
      console.error("Failed to parse AI material search response:", text.substring(0, 500));
      throw new Error("AI returned an invalid response. Please try again.");
    }
    // For YouTube: proceed with empty parsed array; grounding chunks will provide candidates
    console.warn("YouTube search: could not parse JSON from AI response, relying on grounding chunks only.");
  }

  if (params.materialType === "youtube") {
    // ── Step 1: enrich AI-suggested videos with oEmbed ───────────────────────
    console.log(`YouTube search: ${parsed.length} videos found from AI response`);

    const enriched = await Promise.all(
      parsed.map(c => enrichYoutubeVideo(c, true))
    );
    const verified = enriched.filter((r): r is YoutubeResult => r !== null);

    // ── Step 2: extract YouTube URLs from Google Search grounding chunks ──────
    const candidates = result.response.candidates;
    const groundingMeta = candidates?.[0]?.groundingMetadata as any;
    const groundingYoutube: YoutubeResult[] = [];
    if (groundingMeta?.groundingChunks) {
      const groundingEnriched = await Promise.all(
        groundingMeta.groundingChunks
          .filter((chunk: any) => {
            const uri: string = chunk.web?.uri || "";
            return uri.includes("youtube.com/watch") || uri.includes("youtu.be/");
          })
          .map((chunk: any) => enrichYoutubeVideo({ url: chunk.web.uri, title: chunk.web.title || "", channel: "", description: "", covers: [], misses: [] }, false))
      );
      groundingYoutube.push(...groundingEnriched.filter((r): r is YoutubeResult => r !== null));
    }

    // ── Step 3: merge, deduplicate, return top 6 ─────────────────────────────
    const seen = new Set<string>();
    const deduped = [...verified, ...groundingYoutube].filter(r => {
      if (!r.videoId) return false;
      if (seen.has(r.videoId)) return false;
      seen.add(r.videoId);
      return true;
    });

    console.log(`YouTube search: ${verified.length} AI-verified + ${groundingYoutube.length} grounding = ${deduped.length} total`);
    return { type: "youtube", results: deduped.slice(0, 6) };
  } else if (params.materialType === "website") {
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

  const result = await model.generateContent(prompt);
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

  const result = await model.generateContent(prompt);
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
