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

    const report = await db.report.findFirst({
      where: { id, workspaceId: user.workspaceId },
      include: {
        generatedBy: { select: { name: true, email: true } },
      },
    });

    if (!report) return apiError("Not Found", 404);
    return apiSuccess(report);
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

    const report = await db.report.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });
    if (!report) return apiError("Not Found", 404);

    await db.report.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
