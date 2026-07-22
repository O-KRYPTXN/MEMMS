import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: { role: 'TECHNICIAN' },
    data: { phone: '01012345678' }
  });
  console.log('Updated technicians:', updated.count);
}

main().finally(() => prisma.$disconnect());
