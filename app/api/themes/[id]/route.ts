import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const theme = await db.theme.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: {
        _count: { select: { feedback: true } },
        feedback: {
          include: { feedback: true },
          take: 50,
          orderBy: { feedback: { createdAt: "desc" } },
        },
      },
    });

    if (!theme) return apiError("Not Found", 404);
    return apiSuccess(theme);
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

    const theme = await db.theme.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!theme) return apiError("Not Found", 404);

    await db.theme.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
