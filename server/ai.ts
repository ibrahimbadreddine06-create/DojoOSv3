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
    prompt = `You are an expert educational resource curator. Use Google Search to find real YouTube educational videos.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${userPromptBlock}

TASK: Search on YouTube (site:youtube.com) and find 5 to 6 real, existing educational videos that are perfect study resources for this chapter. 

Search queries to use (search all of them):
- site:youtube.com "${params.chapterTitle}" tutorial
- site:youtube.com "${params.chapterTitle}" explained
- site:youtube.com "${params.chapterTitle}" lecture
- site:youtube.com "${params.chapterTitle}" course

Prioritize results from well-known educational channels: MIT OpenCourseWare, Stanford, Yale Open Courses, Khan Academy, 3Blue1Brown, Crash Course, Kurzgesagt, Numberphile, Computerphile, freeCodeCamp, Traversy Media, The Coding Train, Sentdex, or similar reputable channels.

CRITICAL RULES:
- Every URL you return MUST be a real YouTube video URL you found via Google Search
- The video ID in the URL must match a real video that actually exists
- Include the full watch URL format: https://www.youtube.com/watch?v=VIDEO_ID
- If you cannot find enough videos, return what you find — 2-3 real videos is better than 6 fake ones

For each video, analyze what subtopics it COVERS and what it MISSES from this chapter.

OUTPUT — return ONLY a valid JSON array (no markdown, no code fences, no extra text):
[
  {
    "title": "Exact video title as shown on YouTube",
    "channel": "Channel name",
    "url": "https://www.youtube.com/watch?v=REAL_VIDEO_ID",
    "description": "Why this video is valuable for this chapter (2-3 sentences)",
    "covers": ["subtopic A", "subtopic B"],
    "misses": ["subtopic C"]
  }
]`;
  } else if (params.materialType === "website") {
    prompt = `You are an expert educational resource curator.
Find 5 high-quality explanatory websites, articles, or tutorials for this learning chapter.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${userPromptBlock}

Search for real, currently accessible resources. Prefer:
- University pages, academic wikis, official documentation
- Well-structured tutorials (MDN, Khan Academy, Coursera articles, etc.)
- Comprehensive guides from reputable sources
- Interactive or visual resources where relevant

OUTPUT — return ONLY valid JSON array, no markdown:
[
  {
    "title": "Page/article title",
    "url": "https://exact-url.com/page",
    "description": "Why this resource is excellent for this chapter (2-3 sentences)"
  }
]`;
  } else if (params.materialType === "pdf") {
    prompt = `You are an expert educational resource curator.
Find 5 high-quality free PDFs, papers, or textbook chapters for this learning chapter.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${userPromptBlock}

Search for real, freely accessible PDFs. Prefer:
- University lecture notes (MIT OCW, Stanford, etc.)
- ArXiv preprints for technical topics
- Freely available textbook chapters (Open Textbook Library, etc.)
- Official standards documents, specifications, or reference manuals

Only include PDFs that are genuinely free to download (no paywall).

OUTPUT — return ONLY valid JSON array, no markdown:
[
  {
    "title": "PDF/document title",
    "url": "https://exact-url.com/file.pdf",
    "description": "Why this document is valuable (2-3 sentences)",
    "author": "Author or institution (optional)"
  }
]`;
  } else {
    // custom
    prompt = `You are an expert educational resource curator.
Find the best learning resources for this chapter based on the learner's specific request.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}

LEARNER'S SPECIFIC REQUEST: ${params.userPrompt || "Find the most useful mixed resources"}

Search for real, currently accessible resources of any type (videos, articles, PDFs, tools, interactive demos). Return the 5 most relevant results.

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
    // ── Step 1: collect candidates ──────────────────────────────────────────
    // Grounding chunks = real URLs from Google Search (trusted, soft fallback)
    // Parsed JSON = AI-generated (untrusted, hard-filter via oEmbed)
    const groundingIds = new Set<string>();
    const groundingCandidates: any[] = [];
    const parsedCandidates: any[] = [];

    const groundingMeta = (result.response.candidates?.[0]?.groundingMetadata as any);
    const chunkCount = groundingMeta?.groundingChunks?.length || 0;
    console.log(`YouTube search: ${chunkCount} grounding chunks found, ${parsed.length} parsed results`);
    
    if (groundingMeta?.groundingChunks) {
      for (const chunk of groundingMeta.groundingChunks) {
        // Try multiple ways to access the URI (API structure can vary)
        const uri = chunk.web?.uri || chunk.uri || chunk.url || "";
        const title = chunk.web?.title || chunk.title || "";
        
        if (uri.includes("youtube.com/watch") || uri.includes("youtu.be/")) {
          const vid = extractYoutubeId(uri);
          if (vid && !groundingIds.has(vid)) {
            groundingIds.add(vid);
            const match = parsed.find(
              (r: any) => extractYoutubeId(r.url || "") === vid
            );
            groundingCandidates.push({
              url: uri,
              title: title || match?.title || "YouTube Video",
              channel: match?.channel || "",
              description: match?.description || title || "",
              covers: match?.covers || [],
              misses: match?.misses || [],
            });
          }
        }
      }
      console.log(`Extracted ${groundingCandidates.length} YouTube videos from ${chunkCount} grounding chunks`);
    }

    // Parsed JSON results not already covered by grounding
    for (const r of parsed) {
      const vid = extractYoutubeId(r.url || "");
      if (vid && !groundingIds.has(vid)) {
        parsedCandidates.push(r);
      }
    }

    // ── Step 2: enrich with oEmbed ───────────────────────────────────────────
    // Grounding: mustVerify=false (soft fallback — real Google Search URLs)
    // Parsed JSON: mustVerify=true (drop if oEmbed 404 — likely fabricated)
    const [groundingEnriched, parsedEnriched] = await Promise.all([
      Promise.all(groundingCandidates.map(c => enrichYoutubeVideo(c, false))),
      Promise.all(parsedCandidates.map(c => enrichYoutubeVideo(c, true))),
    ]);

    const allEnriched = [
      ...groundingEnriched.filter((r): r is YoutubeResult => r !== null),
      ...parsedEnriched.filter((r): r is YoutubeResult => r !== null),
    ];

    // Deduplicate by videoId
    const seen = new Set<string>();
    const deduped = allEnriched.filter(r => {
      if (!r.videoId) return false;
      if (seen.has(r.videoId)) return false;
      seen.add(r.videoId);
      return true;
    });

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
