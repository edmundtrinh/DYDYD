import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://test:test@localhost:5433/dydyd_test';

const prisma = new PrismaClient({
  datasources: {
    db: { url: TEST_DATABASE_URL },
  },
});

export async function setupTestDB(): Promise<PrismaClient> {
  await cleanDatabase();
  return prisma;
}

export async function teardownTestDB(): Promise<void> {
  await prisma.$disconnect();
}

// FK-safe deletion order: children first, then parents
async function cleanDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.questCompletion.deleteMany(),
    prisma.userQuest.deleteMany(),
    prisma.userBadge.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.deviceToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.categoryPriority.deleteMany(),
    prisma.userSettings.deleteMany(),
    prisma.quest.deleteMany(),
    prisma.badge.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export { prisma };
