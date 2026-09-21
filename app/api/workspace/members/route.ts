import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const members = await db.user.findMany({
      where: { workspaceId: user.workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(members);
  } catch (e) {
    return handleApiError(e);
  }
}

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") return apiError("Forbidden", 403);

    const body = await req.json();
    const data = inviteSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return apiError("Email already in use", 409);

    const passwordHash = await bcrypt.hash(data.password, 12);

    const member = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        workspaceId: user.workspaceId,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return apiSuccess(member, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
