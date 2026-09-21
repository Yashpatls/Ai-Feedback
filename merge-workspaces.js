const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const firstWorkspace = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!firstWorkspace) return;
  await prisma.user.updateMany({ data: { workspaceId: firstWorkspace.id } });
  await prisma.feedback.updateMany({ data: { workspaceId: firstWorkspace.id } });
  await prisma.theme.updateMany({ data: { workspaceId: firstWorkspace.id } });
  console.log('Merged all users and feedback into the first workspace:', firstWorkspace.name);
}
main().finally(() => prisma.$disconnect());
