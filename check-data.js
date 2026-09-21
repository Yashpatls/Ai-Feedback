const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
  if (!admin) {
    console.log("No admin@demo.com found");
    return;
  }
  const allFeedback = await prisma.feedback.count({ where: { workspaceId: admin.workspaceId } });
  const allUsers = await prisma.user.findMany({ where: { workspaceId: admin.workspaceId }, select: { name: true, email: true, role: true } });
  console.log("Admin workspace ID:", admin.workspaceId);
  console.log("Total Feedback in Admin Workspace:", allFeedback);
  console.log("Users in Admin Workspace:", allUsers);
}
main();
