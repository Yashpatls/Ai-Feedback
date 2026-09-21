import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { classifyAndEmbed } from "@/lib/classify";

const VALID_CHANNELS = [
  "SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY",
  "SALES_CALL_NOTE", "SOCIAL_MENTION", "COMMUNITY_POST", "MANUAL",
] as const;
type ValidChannel = typeof VALID_CHANNELS[number];

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { rows } = body as { rows: Record<string, string>[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      return apiError("No rows provided", 400);
    }

    let imported = 0;
    const failures: { row: number; reason: string }[] = [];

    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, name: true },
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const content = row.content?.trim() || row.text?.trim() || row.feedback?.trim() || row.Content?.trim();

      if (!content) {
        failures.push({ row: i + 1, reason: "Missing content" });
        continue;
      }

      let channel: ValidChannel = "MANUAL";
      const rawChannel = (row.channel || row.Channel || "").toUpperCase().replace(/\s+/g, "_");
      if ((VALID_CHANNELS as readonly string[]).includes(rawChannel)) {
        channel = rawChannel as ValidChannel;
      }

      try {
        const feedback = await db.feedback.create({
          data: {
            content,
            channel,
            customerLabel: row.customer_label || row.customerLabel || row['Customer Label'] || undefined,
            sourceRef: row.source_ref || row.sourceRef || undefined,
            workspaceId: user.workspaceId,
            createdAt: (row.created_at || row['Created At']) ? new Date(row.created_at || row['Created At']) : undefined,
            createdById: user.id,
          },
        });

        classifyAndEmbed(
          feedback.id,
          content,
          existingThemes,
          user.workspaceId
        ).catch(console.error);

        imported++;
      } catch (err) {
        failures.push({ row: i + 1, reason: "Database error" });
      }
    }

    return apiSuccess({ imported, failed: failures.length, failures });
  } catch (e) {
    return handleApiError(e);
  }
}
