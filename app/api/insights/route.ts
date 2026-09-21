import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { answerQuestion, embedText, cosineSimilarity, FeedbackContext } from "@/lib/ai";

const askSchema = z.object({
  question: z.string().min(3, "Question is too short"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { question } = askSchema.parse(body);

    // Check API key is configured
    if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return apiError("GEMINI_API_KEY is not configured. Add it to your .env file.", 503);
    }

    // Check if there is any feedback at all
    const feedbackCount = await db.feedback.count({
      where: { workspaceId: user.workspaceId },
    });
    if (feedbackCount === 0) {
      return apiError("No feedback in your workspace yet. Add some feedback first.", 400);
    }

    interface EmbeddingRow {
      vector: number[];
      feedback: {
        id: string;
        content: string;
        channel: string;
        sentiment: string | null;
        createdAt: Date;
      };
    }

    // Try embedding-based retrieval first
    let contextItems: FeedbackContext[] = [];

    const allEmbeddings = await db.embedding.findMany({
      where: { feedback: { workspaceId: user.workspaceId } },
      include: {
        feedback: {
          select: {
            id: true,
            content: true,
            channel: true,
            sentiment: true,
            createdAt: true,
          },
        },
      },
    });

    if (allEmbeddings.length > 0) {
      // Semantic search via cosine similarity
      const qVec = await embedText(question);

      interface ScoredItem {
        feedback: EmbeddingRow["feedback"];
        score: number;
      }
      const scored: ScoredItem[] = [];
      for (const e of allEmbeddings as EmbeddingRow[]) {
        scored.push({ feedback: e.feedback, score: cosineSimilarity(qVec, e.vector) });
      }
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 10);

      contextItems = top.map((s) => ({
        id: s.feedback.id,
        content: s.feedback.content,
        channel: s.feedback.channel,
        sentiment: s.feedback.sentiment,
        createdAt: s.feedback.createdAt.toISOString().split("T")[0],
      }));
    } else {
      // Fallback: no embeddings yet — use the 20 most recent feedback items directly
      const recentFeedback = await db.feedback.findMany({
        where: { workspaceId: user.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          content: true,
          channel: true,
          sentiment: true,
          createdAt: true,
        },
      });

      contextItems = recentFeedback.map((f) => ({
        id: f.id,
        content: f.content,
        channel: f.channel,
        sentiment: f.sentiment,
        createdAt: f.createdAt.toISOString().split("T")[0],
      }));
    }

    const { answer, citedIds } = await answerQuestion(question, contextItems);

    // Fetch full cited feedback items for display
    const cited = citedIds.length > 0
      ? await db.feedback.findMany({
          where: { id: { in: citedIds }, workspaceId: user.workspaceId },
          include: { themes: { include: { theme: true } } },
        })
      : [];

    return apiSuccess({ answer, cited, question });
  } catch (e) {
    console.error("[Ask LOOP error]", e);
    return handleApiError(e);
  }
}
