import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const updateSchema = z.object({
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    if (user.role !== "ADMIN") return apiError("Forbidden", 403);

    const target = await db.user.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!target) return apiError("Not Found", 404);
    if (target.id === user.id) return apiError("Cannot change your own role", 400);

    const body = await req.json();
    const { role } = updateSchema.parse(body);

    const updated = await db.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
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
    if (user.role !== "ADMIN") return apiError("Forbidden", 403);

    const target = await db.user.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!target) return apiError("Not Found", 404);
    if (target.id === user.id) return apiError("Cannot remove yourself", 400);

    await db.user.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
