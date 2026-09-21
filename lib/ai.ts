import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// ─── AI Wrapper ──────────────────────────────────────────────────────────────

async function generateText(prompt: string): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });
      return result.text || "";
    } catch (err: any) {
      if (err.status === 429 || err.status === 503) {
        console.log("gemini-3.6-flash rate limited/overloaded, falling back to gemini-3.8-flash");
        const fallbackResult = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt
        });
        return fallbackResult.text || "";
      }
      throw err;
    }
  } else if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    });
    // Claude SDK returns an array of content blocks, usually the first one is the text
    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock && textBlock.type === 'text' ? textBlock.text : "";
  }
  throw new Error("No API key configured");
}

// ─── Classification ──────────────────────────────────────────────────────────

const ClassificationSchema = z.object({
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(z.string()).min(1).max(5),
  featureArea: z.string(),
  rationale: z.string(),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export async function classifyFeedback(
  content: string,
  existingThemes: string[]
): Promise<ClassificationResult> {
  const themeList =
    existingThemes.length > 0
      ? `Existing themes (reuse if appropriate): ${existingThemes.join(", ")}`
      : "No existing themes yet — invent appropriate ones.";

  const prompt = `You are a product feedback analyst. Classify the following customer feedback item.

${themeList}

Feedback: "${content}"

Return ONLY valid JSON with this exact schema (no markdown, no explanation):
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": number between -1.0 (most negative) and 1.0 (most positive),
  "themes": array of 1-3 theme names (strings, reuse from existing list where fitting),
  "featureArea": "short label like Onboarding, Billing, Performance, etc.",
  "rationale": "one sentence explaining the classification"
}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await generateText(prompt);
      const raw = text
        .trim()
        .replace(/^```json?[\s\S]*?\n/i, "")
        .replace(/```\s*$/, "")
        .trim();

      const parsed = JSON.parse(raw);
      return ClassificationSchema.parse(parsed);
    } catch {
      if (attempt === 1) {
        return {
          sentiment: "NEUTRAL",
          sentimentScore: 0,
          themes: ["Uncategorized"],
          featureArea: "General",
          rationale: "Classification failed — manual review needed.",
        };
      }
    }
  }

  // unreachable but TS wants it
  return {
    sentiment: "NEUTRAL",
    sentimentScore: 0,
    themes: ["Uncategorized"],
    featureArea: "General",
    rationale: "Classification failed.",
  };
}

// ─── Ask LOOP (RAG Q&A) ───────────────────────────────────────────────────────

export interface FeedbackContext {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  createdAt: string;
}

export async function answerQuestion(
  question: string,
  feedbackItems: FeedbackContext[]
): Promise<{ answer: string; citedIds: string[] }> {
  if (feedbackItems.length === 0) {
    return {
      answer:
        "I couldn't find any relevant feedback to answer your question. Try adding more feedback first.",
      citedIds: [],
    };
  }

  const context = feedbackItems
    .map(
      (f, i) =>
        `[${i + 1}] ID:${f.id} | ${f.channel} | ${f.sentiment ?? "unknown"} | ${f.createdAt}\n"${f.content}"`
    )
    .join("\n\n");

  const prompt = `You are LOOP, an AI assistant that answers questions about customer feedback.
You MUST answer only from the provided feedback items. If the answer is not in the data, say so explicitly.
Never invent feedback or statistics that are not present.

Question: "${question}"

Retrieved feedback items:
${context}

Instructions:
1. Answer the question based ONLY on the feedback items above.
2. Reference specific item numbers [1], [2], etc. to ground your answer.
3. If the data doesn't contain enough info to answer, say "The available feedback doesn't clearly address this question."
4. Keep the answer concise (3-5 sentences max).

Also return a JSON block at the end in this exact format (after your text answer):
CITED_IDS: ["id1", "id2", ...]`;

  const full = await generateText(prompt);
  const citedMatch = full.match(/CITED_IDS:\s*(\[[\s\S]*?\])/);
  let citedIds: string[] = [];

  if (citedMatch) {
    try {
      citedIds = JSON.parse(citedMatch[1]);
    } catch {
      citedIds = feedbackItems.slice(0, 3).map((f) => f.id);
    }
  }

  const answer = full.replace(/CITED_IDS:[\s\S]*$/, "").trim();

  return { answer, citedIds };
}

// ─── Voice-of-Customer Report ─────────────────────────────────────────────────

export interface ReportStats {
  totalItems: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topThemes: { name: string; count: number; sentiment: string }[];
  sentimentDelta: { positive: number; neutral: number; negative: number };
  notableQuotes: string[];
  period: { start: string; end: string };
}

export async function generateVoCReport(stats: ReportStats): Promise<string> {
  const prompt = `You are a product analyst writing a Voice-of-Customer (VoC) report for a leadership team.
Write a professional, concise report (400-600 words) based on the following data. Use the exact numbers provided.

Period: ${stats.period.start} to ${stats.period.end}
Total feedback items: ${stats.totalItems}
Sentiment: ${stats.sentimentBreakdown.positive} positive, ${stats.sentimentBreakdown.neutral} neutral, ${stats.sentimentBreakdown.negative} negative
Sentiment change vs prior period: ${stats.sentimentDelta.positive > 0 ? "+" : ""}${stats.sentimentDelta.positive}% positive, ${stats.sentimentDelta.negative > 0 ? "+" : ""}${stats.sentimentDelta.negative}% negative

Top themes:
${stats.topThemes.map((t) => `- ${t.name}: ${t.count} mentions (${t.sentiment} sentiment)`).join("\n")}

Notable customer quotes:
${stats.notableQuotes.map((q) => `"${q}"`).join("\n")}

Structure the report with these sections:
1. Executive Summary (2-3 sentences)
2. Key Trends This Period
3. Areas Needing Attention (negative sentiment themes)
4. Wins & Positive Signals
5. Recommended Actions (3 bullet points max)

Use professional language suitable for a product team leadership meeting. Do NOT invent data not provided above.`;

  return await generateText(prompt);
}

// ─── Simple text embedding (cosine similarity via dot product) ────────────────
// We use a deterministic hashing approach since we don't have a paid embeddings
// endpoint in this demo — in production swap this for OpenAI or Cohere embeddings.

export async function embedText(text: string): Promise<number[]> {
  // Lightweight TF-IDF-style pseudo-embedding using char n-grams
  // 128-dimensional vector sufficient for demo similarity search
  const dim = 128;
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const code = word.charCodeAt(j);
      const idx = (code * 31 + i * 7 + j * 13) % dim;
      vec[idx] += 1 / (1 + Math.log(i + 1));
    }
  }

  // Normalize
  const magnitude = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // already normalized
}
