const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
  if (!admin) return;
  const adminWorkspaceId = admin.workspaceId;

  // Find all themes that belong to other workspaces but are linked to feedback in this workspace
  const orphanedThemes = await prisma.theme.findMany({
    where: {
      workspaceId: { not: adminWorkspaceId },
      feedback: { some: { feedback: { workspaceId: adminWorkspaceId } } }
    }
  });

  for (const oldTheme of orphanedThemes) {
    // Find the equivalent theme in the admin workspace
    let newTheme = await prisma.theme.findUnique({
      where: { workspaceId_name: { workspaceId: adminWorkspaceId, name: oldTheme.name } }
    });

    if (!newTheme) {
      newTheme = await prisma.theme.create({
        data: {
          name: oldTheme.name,
          color: oldTheme.color,
          workspaceId: adminWorkspaceId
        }
      });
    }

    // Update all feedbackTheme links from oldTheme to newTheme
    const links = await prisma.feedbackTheme.findMany({
      where: { themeId: oldTheme.id }
    });

    for (const link of links) {
      try {
        await prisma.feedbackTheme.update({
          where: { feedbackId_themeId: { feedbackId: link.feedbackId, themeId: oldTheme.id } },
          data: { themeId: newTheme.id }
        });
      } catch (err) {
        if (err.code === 'P2002') {
          // If the feedback already has the new theme, just delete the old link
          await prisma.feedbackTheme.delete({
            where: { feedbackId_themeId: { feedbackId: link.feedbackId, themeId: oldTheme.id } }
          });
        }
      }
    }
    console.log(`Merged theme '${oldTheme.name}' into admin workspace.`);
  }
}
main().finally(() => prisma.$disconnect());
