import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { subDays, format, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

type DayBucket = {
  date: string;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
};

type ThemeRef = {
  id: string;
  name: string;
  color: string;
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const wid = user.workspaceId;
    const sp = req.nextUrl.searchParams;
    const days = parseInt(sp.get("days") || "30");

    const since = subDays(new Date(), days);

    const baseWhere = user.role === "ADMIN" 
      ? { workspaceId: wid } 
      : { workspaceId: wid, createdById: user.id };

    const [
      totalFeedback,
      thisWeekCount,
      sentimentGroups,
      themeGroups,
      dailyCounts,
      negativeCount,
    ] = await Promise.all([
      db.feedback.count({ where: baseWhere }),
      db.feedback.count({
        where: { ...baseWhere, createdAt: { gte: subDays(new Date(), 7) } },
      }),
      db.feedback.groupBy({
        by: ["sentiment"],
        where: { ...baseWhere, createdAt: { gte: since } },
        _count: { sentiment: true },
      }),
      db.feedbackTheme.groupBy({
        by: ["themeId"],
        where: { feedback: { ...baseWhere, createdAt: { gte: since } } },
        _count: { themeId: true },
        orderBy: { _count: { themeId: "desc" } },
        take: 8,
      }),
      db.feedback.findMany({
        where: { ...baseWhere, createdAt: { gte: since } },
        select: { createdAt: true, sentiment: true },
        orderBy: { createdAt: "asc" },
      }),
      db.feedback.count({
        where: {
          ...baseWhere,
          sentiment: "NEGATIVE",
          createdAt: { gte: since },
        },
      }),
    ]);

    // Volume-over-time data
    const dateMap: Record<string, DayBucket> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(startOfDay(subDays(new Date(), i)), "MMM d");
      dateMap[d] = { date: d, count: 0, positive: 0, negative: 0, neutral: 0 };
    }
    for (const f of dailyCounts) {
      const d = format(startOfDay(f.createdAt), "MMM d");
      const bucket = dateMap[d];
      if (bucket) {
        bucket.count++;
        if (f.sentiment === "POSITIVE") bucket.positive++;
        else if (f.sentiment === "NEGATIVE") bucket.negative++;
        else bucket.neutral++;
      }
    }

    // Sentiment breakdown
    const sentimentData = [
      { name: "Positive", value: 0, color: "#22c55e" },
      { name: "Neutral", value: 0, color: "#94a3b8" },
      { name: "Negative", value: 0, color: "#f43f5e" },
    ];
    for (const sg of sentimentGroups) {
      if (sg.sentiment === "POSITIVE") sentimentData[0].value = sg._count.sentiment;
      else if (sg.sentiment === "NEUTRAL") sentimentData[1].value = sg._count.sentiment;
      else if (sg.sentiment === "NEGATIVE") sentimentData[2].value = sg._count.sentiment;
    }

    // Top themes with names
    const themeIds: string[] = [];
    for (const tg of themeGroups) themeIds.push(tg.themeId);

    const themes = await db.theme.findMany({
      where: { id: { in: themeIds } },
      select: { id: true, name: true, color: true },
    });
    const themeMap: Record<string, ThemeRef> = {};
    for (const t of themes) {
      themeMap[t.id] = t;
    }

    const topThemes: { name: string; count: number; color: string }[] = [];
    for (const tg of themeGroups) {
      topThemes.push({
        name: themeMap[tg.themeId]?.name ?? "Unknown",
        count: tg._count.themeId,
        color: themeMap[tg.themeId]?.color ?? "#6366f1",
      });
    }

    let totalInPeriod = 0;
    for (const sg of sentimentGroups) {
      totalInPeriod += sg._count.sentiment;
    }

    let posCount = 0;
    for (const sg of sentimentGroups) {
      if (sg.sentiment === "POSITIVE") { posCount = sg._count.sentiment; break; }
    }

    return apiSuccess({
      stats: {
        total: totalFeedback,
        thisWeek: thisWeekCount,
        negativePercent:
          totalInPeriod > 0 ? Math.round((negativeCount / totalInPeriod) * 100) : 0,
        positivePercent:
          totalInPeriod > 0 ? Math.round((posCount / totalInPeriod) * 100) : 0,
      },
      volumeData: Object.values(dateMap),
      sentimentData: sentimentData.filter((sd) => sd.value > 0),
      topThemes,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
