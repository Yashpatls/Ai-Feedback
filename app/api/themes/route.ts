import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const sp = req.nextUrl.searchParams;
    const withTrends = sp.get("trends") === "true";

    const themes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        _count: { select: { feedback: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!withTrends) {
      return apiSuccess(themes);
    }

    // Compute weekly counts per theme for trends
    const now = new Date();
    const thisWeekStart = startOfDay(subDays(now, 7));
    const prevWeekStart = startOfDay(subDays(now, 14));

    type ThemeWithCount = {
      id: string;
      name: string;
      color: string;
      description: string | null;
      _count: { feedback: number };
    };

    const trendsData = await Promise.all(
      (themes as ThemeWithCount[]).map(async (theme) => {
        const [thisWeek, prevWeek] = await Promise.all([
          db.feedbackTheme.count({
            where: {
              themeId: theme.id,
              feedback: { createdAt: { gte: thisWeekStart } },
            },
          }),
          db.feedbackTheme.count({
            where: {
              themeId: theme.id,
              feedback: {
                createdAt: { gte: prevWeekStart, lt: thisWeekStart },
              },
            },
          }),
        ]);

        const spike =
          prevWeek > 0 ? ((thisWeek - prevWeek) / prevWeek) * 100 : 0;

        return {
          ...theme,
          totalCount: theme._count.feedback,
          thisWeekCount: thisWeek,
          prevWeekCount: prevWeek,
          spikePercent: Math.round(spike),
          isSpiking: spike > 50 && thisWeek >= 3,
        };
      })
    );

    return apiSuccess(
      trendsData.sort((a, b) => b.totalCount - a.totalCount)
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!["ADMIN", "ANALYST"].includes(user.role)) {
      return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const data = z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      })
      .parse(body) as { name: string; description?: string; color?: string };

    const theme = await db.theme.create({
      data: { ...data, workspaceId: user.workspaceId },
    });

    return apiSuccess(theme, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
