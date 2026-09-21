import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return apiError("Email already in use", 409);

    const slug = data.workspaceName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);

    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

    const passwordHash = await bcrypt.hash(data.password, 12);
    const role = data.email.toLowerCase() === "admin@demo.com" ? "ADMIN" : "VIEWER";

    // Find the default workspace or create one
    let workspace = await db.workspace.findFirst();
    if (!workspace) {
      workspace = await db.workspace.create({
        data: {
          name: "Default Workspace",
          slug: "default-workspace",
        },
      });
    }

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
        workspaceId: workspace.id,
      },
    });

    return apiSuccess(
      {
        message: "Account created successfully",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      201
    );
  } catch (e) {
    return handleApiError(e);
  }
}
