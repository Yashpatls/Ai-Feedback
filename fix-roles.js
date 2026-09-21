const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    where: { email: { not: 'admin@demo.com' } },
    data: { role: 'VIEWER' }
  });
  console.log("Updated non-admins to VIEWER");
}
main();
