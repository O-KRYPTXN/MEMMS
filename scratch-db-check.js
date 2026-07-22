import prisma from './backend/prisma/prisma.js';

async function main() {
  const users = await prisma.user.findMany({ select: { name: true, phone: true } });
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
