/**
 * Mock Prisma client for unit tests.
 *
 * Usage in each test file:
 *   jest.mock('../../lib/prisma', () => ({ prisma: mockPrisma }));
 *
 * The `mockPrisma` name prefix is load-bearing — Jest's variable-hoisting
 * exempts identifiers starting with "mock", so the factory can reference it
 * before it is technically in scope.
 */
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  categoryPriority: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  questCompletion: {
    deleteMany: jest.fn(),
  },
  userQuest: {
    deleteMany: jest.fn(),
  },
  userBadge: {
    deleteMany: jest.fn(),
  },
  notification: {
    deleteMany: jest.fn(),
  },
  deviceToken: {
    deleteMany: jest.fn(),
  },
  // $transaction accepts an array of Prisma promises OR an interactive callback.
  // For unit tests, mock it to resolve to an empty array (callers don't
  // read the return value in these routes).
  $transaction: jest.fn().mockResolvedValue([]),
};
