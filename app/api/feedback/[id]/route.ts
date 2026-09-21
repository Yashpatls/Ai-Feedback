import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const updateSchema = z.object({
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]).optional(),
  customerLabel: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const feedback = await db.feedback.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: { themes: { include: { theme: true } } },
    });

    if (!feedback) return apiError("Not Found", 404);
    return apiSuccess(feedback);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    if (!["ADMIN", "ANALYST"].includes(user.role)) {
      return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await db.feedback.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!existing) return apiError("Not Found", 404);

    const updated = await db.feedback.update({
      where: { id },
      data,
      include: { themes: { include: { theme: true } } },
    });

    return apiSuccess(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    if (!["ADMIN"].includes(user.role)) {
      return apiError("Forbidden", 403);
    }

    const existing = await db.feedback.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!existing) return apiError("Not Found", 404);

    await db.feedback.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
