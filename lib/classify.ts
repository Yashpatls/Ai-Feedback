import { db } from "@/lib/db";
import { classifyFeedback, embedText } from "@/lib/ai";

const THEME_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6",
];

function randomColor() {
  return THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
}

export async function classifyAndEmbed(
  feedbackId: string,
  content: string,
  existingThemes: { id: string; name: string }[],
  workspaceId: string
) {
  try {
    const themeNames = existingThemes.map((t) => t.name);
    const result = await classifyFeedback(content, themeNames);

    // Upsert themes
    const themeIds: string[] = [];
    for (const themeName of result.themes) {
      let theme;
      try {
        theme = await db.theme.upsert({
          where: { workspaceId_name: { workspaceId, name: themeName } },
          create: {
            name: themeName,
            workspaceId,
            color: randomColor(),
          },
          update: {},
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          theme = await db.theme.findUnique({
            where: { workspaceId_name: { workspaceId, name: themeName } },
          });
        }
        if (!theme) throw err;
      }
      themeIds.push(theme.id);
    }

    // Update feedback with classification
    await db.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        featureArea: result.featureArea,
        classifiedAt: new Date(),
        themes: {
          createMany: {
            data: themeIds.map((themeId) => ({ themeId, confidence: 0.9 })),
            skipDuplicates: true,
          },
        },
      },
    });

    // Generate and store embedding
    const vector = await embedText(content);
    await db.embedding.upsert({
      where: { feedbackId },
      create: { feedbackId, vector },
      update: { vector },
    });
  } catch (err) {
    console.error("[classifyAndEmbed] Error:", err);
  }
}
