import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { classifyAndEmbed } from "@/lib/classify";
import type { Channel } from "@prisma/client";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  content: z.string().min(1, "Content is required"),
  channel: z.string().default("MANUAL"),
  customerLabel: z.string().optional(),
  sourceRef: z.string().optional(),
});

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  channel: z.string().optional(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]).optional(),
  themeId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const sp = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = listSchema.parse(sp) as {
      page: number; limit: number; search?: string; channel?: string;
      sentiment?: string; status?: string; themeId?: string;
      dateFrom?: string; dateTo?: string;
    };
    const { page, limit, search, channel, sentiment, status, themeId, dateFrom, dateTo } = parsed;

    const where: Record<string, unknown> = user.role === "ADMIN" 
      ? { workspaceId: user.workspaceId } 
      : { workspaceId: user.workspaceId, createdById: user.id };

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }
    if (channel) where.channel = channel;
    if (sentiment) where.sentiment = sentiment;
    if (status) where.status = status;
    if (themeId) {
      where.themes = { some: { themeId } };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [total, items] = await Promise.all([
      db.feedback.count({ where }),
      db.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          themes: { include: { theme: true } },
        },
      }),
    ]);

    return apiSuccess({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const data = createSchema.parse(body) as {
      content: string;
      channel: string;
      customerLabel?: string;
      sourceRef?: string;
    };

    // Get existing themes for classification context
    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, name: true },
    });

    const feedback = await db.feedback.create({
      data: {
        content: data.content,
        channel: data.channel as Channel,
        customerLabel: data.customerLabel,
        sourceRef: data.sourceRef,
        workspaceId: user.workspaceId,
        createdById: user.id,
      },
    });

    // Run AI classification and embedding asynchronously (fire-and-forget)
    classifyAndEmbed(
      feedback.id,
      data.content,
      existingThemes,
      user.workspaceId
    ).catch(console.error);

    return apiSuccess(feedback, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
