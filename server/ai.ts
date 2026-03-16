import { GoogleGenerativeAI } from "@google/generative-ai";

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
- Search for and analyze major university syllabi (Harvard, MIT, Stanford, etc.)
- Find well-known textbooks used for this subject and analyze their table of contents
- Check official certification frameworks (CEFR for languages, ACM for CS, etc.)
- Look at reputable online courses (Coursera, edX, Khan Academy, etc.)
- For languages, consult official institutions (Goethe, Institut Français, etc.)
- Reference actual curricula you find in your research

CRITICAL RULES:
1. The trajectory MUST be COMPLETE — missing any essential topic is a failure
2. Order MUST be logical — prerequisites always before advanced material
3. You CANNOT teach advanced concepts before foundational ones
4. Aim for 4–8 main chapters, each with 3–8 subchapters
5. Use sub-subchapters only when genuinely necessary (max 3 levels deep)
6. List ALL sources you actually consulted with their real URLs

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
