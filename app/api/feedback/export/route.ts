import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      return new Response("Forbidden", { status: 403 });
    }

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search");
    const channel = sp.get("channel");
    const sentiment = sp.get("sentiment");
    const status = sp.get("status");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");

    const where: Record<string, unknown> = { workspaceId: user.workspaceId };

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }
    if (channel) where.channel = channel;
    if (sentiment) where.sentiment = sentiment;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const items = await db.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "ID",
      "Content",
      "Channel",
      "Customer Label",
      "Sentiment",
      "Sentiment Score",
      "Feature Area",
      "Status",
      "Created At"
    ];

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return "";
      const s = String(str).replace(/"/g, '""');
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s}"`;
      }
      return s;
    };

    const rows = items.map((item) => [
      escapeCsv(item.id),
      escapeCsv(item.content),
      escapeCsv(item.channel),
      escapeCsv(item.customerLabel),
      escapeCsv(item.sentiment),
      item.sentimentScore?.toString() || "",
      escapeCsv(item.featureArea),
      escapeCsv(item.status),
      item.createdAt.toISOString()
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");

    const dateString = new Date().toISOString().split('T')[0];
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="feedback-export-${dateString}.csv"`,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
