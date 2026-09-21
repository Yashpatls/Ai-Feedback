"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { classifyAndEmbed } from "@/lib/classify";

export async function submitPublicFeedback(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Must be logged in to submit feedback");
  }

  const content = formData.get("content") as string;
  if (!content || content.trim().length === 0) {
    throw new Error("Content is required");
  }

  // Create feedback in user's workspace
  const feedback = await db.feedback.create({
    data: {
      content: content.trim(),
      channel: "MANUAL",
      workspaceId: user.workspaceId,
      customerLabel: user.name || user.email,
      createdById: user.id,
    },
  });

  const existingThemes = await db.theme.findMany({
    where: { workspaceId: user.workspaceId },
    select: { id: true, name: true },
  });

  classifyAndEmbed(
    feedback.id,
    content.trim(),
    existingThemes,
    user.workspaceId
  ).catch(console.error);

  revalidatePath("/");
  return { success: true };
}
