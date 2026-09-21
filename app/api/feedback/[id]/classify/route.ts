import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { classifyAndEmbed } from "@/lib/classify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    if (!["ADMIN", "ANALYST"].includes(user.role)) {
      return apiError("Forbidden", 403);
    }

    const feedback = await db.feedback.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!feedback) return apiError("Not Found", 404);

    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, name: true },
    });

    // Remove old theme connections
    await db.feedbackTheme.deleteMany({ where: { feedbackId: id } });

    await classifyAndEmbed(
      feedback.id,
      feedback.content,
      existingThemes,
      user.workspaceId
    );

    const updated = await db.feedback.findFirst({
      where: { id },
      include: { themes: { include: { theme: true } } },
    });

    return apiSuccess({ message: "Re-classified", feedback: updated });
  } catch (e) {
    return handleApiError(e);
  }
}
