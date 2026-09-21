import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { generateVoCReport } from "@/lib/ai";

const createReportSchema = z.object({
  title: z.string().min(1),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const reports = await db.report.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        generatedBy: { select: { name: true, email: true } },
      },
    });

    return apiSuccess(reports);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const data = createReportSchema.parse(body);

    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

    // Pre-compute stats
    const [totalItems, sentimentCounts, allFeedback] = await Promise.all([
      db.feedback.count({
        where: {
          workspaceId: user.workspaceId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      db.feedback.groupBy({
        by: ["sentiment"],
        where: {
          workspaceId: user.workspaceId,
          createdAt: { gte: periodStart, lte: periodEnd },
          sentiment: { not: null },
        },
        _count: { sentiment: true },
      }),
      db.feedback.findMany({
        where: {
          workspaceId: user.workspaceId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        include: { themes: { include: { theme: true } } },
        take: 500,
      }),
    ]);

    // Sentiment breakdown
    const sentimentMap: Record<string, number> = {
      POSITIVE: 0,
      NEUTRAL: 0,
      NEGATIVE: 0,
    };
    for (const s of sentimentCounts) {
      if (s.sentiment) sentimentMap[s.sentiment] = s._count.sentiment;
    }

    // Theme counts
    type FeedbackWithThemes = {
      content: string;
      sentiment: string | null;
      themes: { theme: { name: string } }[];
    };
    const themeCountMap: Record<string, { count: number; negCount: number; posCount: number }> = {};
    for (const f of allFeedback as FeedbackWithThemes[]) {
      for (const ft of f.themes) {
        const name = ft.theme.name;
        if (!themeCountMap[name]) themeCountMap[name] = { count: 0, negCount: 0, posCount: 0 };
        themeCountMap[name].count++;
        if (f.sentiment === "NEGATIVE") themeCountMap[name].negCount++;
        if (f.sentiment === "POSITIVE") themeCountMap[name].posCount++;
      }
    }

    type ThemeCount = { count: number; negCount: number; posCount: number };
    const topThemes = (Object.entries(themeCountMap) as [string, ThemeCount][])
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 7)
      .map(([name, v]) => ({
        name,
        count: v.count,
        sentiment:
          v.negCount > v.posCount
            ? "mostly negative"
            : v.posCount > v.negCount
            ? "mostly positive"
            : "mixed",
      }));

    // Notable quotes
    const notableQuotes = (allFeedback as FeedbackWithThemes[])
      .filter((f) => f.content.length > 40 && f.content.length < 200)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((f) => f.content);

    // Previous period delta
    const periodLen = periodEnd.getTime() - periodStart.getTime();
    const prevStart = new Date(periodStart.getTime() - periodLen);
    const prevEnd = new Date(periodStart.getTime() - 1);

    const prevSentiment = await db.feedback.groupBy({
      by: ["sentiment"],
      where: {
        workspaceId: user.workspaceId,
        createdAt: { gte: prevStart, lte: prevEnd },
        sentiment: { not: null },
      },
      _count: { sentiment: true },
    });
    const prevTotal = prevSentiment.reduce((s: number, x: { _count: { sentiment: number } }) => s + x._count.sentiment, 0);
    const prevMap: Record<string, number> = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
    for (const p of prevSentiment) {
      if (p.sentiment) prevMap[p.sentiment] = p._count.sentiment;
    }

    const total = (Object.values(sentimentMap) as number[]).reduce((s: number, v: number) => s + v, 0) || 1;
    const prevTotalSafe = prevTotal || 1;

    const delta = {
      positive: Math.round(
        (sentimentMap.POSITIVE / total) * 100 - (prevMap.POSITIVE / prevTotalSafe) * 100
      ),
      neutral: Math.round(
        (sentimentMap.NEUTRAL / total) * 100 - (prevMap.NEUTRAL / prevTotalSafe) * 100
      ),
      negative: Math.round(
        (sentimentMap.NEGATIVE / total) * 100 - (prevMap.NEGATIVE / prevTotalSafe) * 100
      ),
    };

    const narrative = await generateVoCReport({
      totalItems,
      sentimentBreakdown: {
        positive: sentimentMap.POSITIVE,
        neutral: sentimentMap.NEUTRAL,
        negative: sentimentMap.NEGATIVE,
      },
      topThemes,
      sentimentDelta: delta,
      notableQuotes,
      period: {
        start: periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        end: periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    });

    const contentJson = {
      narrative,
      stats: {
        totalItems,
        sentimentBreakdown: sentimentMap,
        topThemes,
        delta,
        notableQuotes,
      },
    };

    const report = await db.report.create({
      data: {
        title: data.title,
        periodStart,
        periodEnd,
        contentJson,
        workspaceId: user.workspaceId,
        generatedById: user.id,
      },
      include: {
        generatedBy: { select: { name: true, email: true } },
      },
    });

    return apiSuccess(report, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
