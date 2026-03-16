import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaterialSearchType = "youtube" | "website" | "pdf" | "custom";

export interface YoutubeResult {
  title: string;
  channel: string;
  url: string;
  videoId: string;
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
    prompt = `You are an expert educational resource curator.
Find 5 high-quality YouTube videos for this learning chapter.

CHAPTER: "${params.chapterTitle}"
${subtopicsBlock}
${contextBlock}
${userPromptBlock}

Search YouTube for real, currently available videos on this topic. Prefer:
- University lecture recordings (MIT OpenCourseWare, Stanford, etc.)
- Well-known educators with clear explanations
- Videos that are comprehensive yet accessible
- Channels with educational focus

For each video, analyze what subtopics it COVERS and what it MISSES compared to the chapter.

OUTPUT — return ONLY valid JSON array, no markdown:
[
  {
    "title": "Exact YouTube video title",
    "channel": "Channel name",
    "url": "https://www.youtube.com/watch?v=VIDEOID",
    "description": "Why this video is valuable for this chapter (2-3 sentences)",
    "covers": ["subtopic 1 it covers well", "subtopic 2"],
    "misses": ["subtopic it skips or covers poorly"]
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

  const result = await model.generateContent(prompt);
  const text = result.response.text();

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

  let parsed: any[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI material search response:", text.substring(0, 500));
    throw new Error("AI returned an invalid response. Please try again.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not an array of results.");
  }

  if (params.materialType === "youtube") {
    const results: YoutubeResult[] = parsed.map((r: any) => ({
      title: r.title || "Untitled",
      channel: r.channel || "",
      url: r.url || "",
      videoId: extractYoutubeId(r.url || "") || r.videoId || "",
      description: r.description || "",
      covers: Array.isArray(r.covers) ? r.covers : [],
      misses: Array.isArray(r.misses) ? r.misses : [],
    }));
    return { type: "youtube", results };
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
