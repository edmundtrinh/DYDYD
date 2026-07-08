import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    questCompletion: {
      findMany: jest.fn(),
    },
  },
}));

import {
  checkAndAutoApplyFreeze,
  trackActiveDay,
  calculateFreezeAwareDayStreak,
  calculateOverallDayStreak,
} from '../../lib/streaks';

// Helper to create a Date at a fixed offset from today
const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
};

const USER_UUID = '00000000-0000-4000-a000-000000000300';

const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: USER_UUID,
  streakFreezes: 2,
  maxStreakFreezes: 3,
  streakFreezeUsedAt: null as Date | null,
  activeDaysCount: 5,
  lastActiveDate: daysAgo(1) as Date | null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================== checkAndAutoApplyFreeze ====================

describe('checkAndAutoApplyFreeze', () => {
  it('should apply freeze when user missed exactly 1 day (gap of 2)', async () => {
    const user = createMockUser({ lastActiveDate: daysAgo(2) });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...user,
      streakFreezes: 1,
    });

    const result = await checkAndAutoApplyFreeze(USER_UUID);

    expect(result.freezeApplied).toBe(true);
    expect(result.freezesRemaining).toBe(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_UUID },
      data: {
        streakFreezes: 1,
        streakFreezeUsedAt: expect.any(Date),
      },
    });
  });

  it('should not apply freeze when gap is 1 (yesterday was active)', async () => {
    const user = createMockUser({ lastActiveDate: daysAgo(1) });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    const result = await checkAndAutoApplyFreeze(USER_UUID);

    expect(result.freezeApplied).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should not apply freeze when gap is 3+ (missed too many days)', async () => {
    const user = createMockUser({ lastActiveDate: daysAgo(4) });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    const result = await checkAndAutoApplyFreeze(USER_UUID);

    expect(result.freezeApplied).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should not apply freeze when user has 0 freezes', async () => {
    const user = createMockUser({
      lastActiveDate: daysAgo(2),
      streakFreezes: 0,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    const result = await checkAndAutoApplyFreeze(USER_UUID);

    expect(result.freezeApplied).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should not apply freeze when already used today (idempotent)', async () => {
    const user = createMockUser({
      lastActiveDate: daysAgo(2),
      streakFreezeUsedAt: new Date(), // today
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    const result = await checkAndAutoApplyFreeze(USER_UUID);

    expect(result.freezeApplied).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should return zeros when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await checkAndAutoApplyFreeze(USER_UUID);

    expect(result.freezeApplied).toBe(false);
    expect(result.freezesRemaining).toBe(0);
  });

  it('should not apply freeze when no lastActiveDate', async () => {
    const user = createMockUser({ lastActiveDate: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    const result = await checkAndAutoApplyFreeze(USER_UUID);

    expect(result.freezeApplied).toBe(false);
    expect(result.freezesRemaining).toBe(2);
  });
});

// ==================== trackActiveDay ====================

describe('trackActiveDay', () => {
  it('should increment activeDaysCount and set lastActiveDate', async () => {
    const user = createMockUser({ activeDaysCount: 5, lastActiveDate: daysAgo(1) });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...user,
      activeDaysCount: 6,
    });

    const result = await trackActiveDay(USER_UUID);

    expect(result.activeDaysCount).toBe(6);
    expect(result.freezeAwarded).toBe(false);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_UUID },
      data: expect.objectContaining({
        activeDaysCount: 6,
        lastActiveDate: expect.any(Date),
      }),
    });
  });

  it('should be idempotent within a day (skip if already tracked today)', async () => {
    const user = createMockUser({
      activeDaysCount: 5,
      lastActiveDate: new Date(), // today
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    const result = await trackActiveDay(USER_UUID);

    expect(result.activeDaysCount).toBe(5);
    expect(result.freezeAwarded).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should award a freeze at every freezeEarnInterval (7 active days)', async () => {
    // activeDaysCount is 6, so after incrementing it becomes 7 (multiple of 7)
    const user = createMockUser({
      activeDaysCount: 6,
      streakFreezes: 1,
      lastActiveDate: daysAgo(1),
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...user,
      activeDaysCount: 7,
      streakFreezes: 2,
    });

    const result = await trackActiveDay(USER_UUID);

    expect(result.activeDaysCount).toBe(7);
    expect(result.freezeAwarded).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_UUID },
      data: expect.objectContaining({
        activeDaysCount: 7,
        streakFreezes: 2,
      }),
    });
  });

  it('should not award freeze when already at max', async () => {
    // activeDaysCount is 13, so 14 is a multiple of 7 — but already at max
    const user = createMockUser({
      activeDaysCount: 13,
      streakFreezes: 3,
      maxStreakFreezes: 3,
      lastActiveDate: daysAgo(1),
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...user,
      activeDaysCount: 14,
    });

    const result = await trackActiveDay(USER_UUID);

    expect(result.activeDaysCount).toBe(14);
    expect(result.freezeAwarded).toBe(false);
    // Update should NOT include streakFreezes increment
    const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.streakFreezes).toBeUndefined();
  });

  it('should return zeros when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await trackActiveDay(USER_UUID);

    expect(result.activeDaysCount).toBe(0);
    expect(result.freezeAwarded).toBe(false);
  });

  it('should not award freeze when not at interval boundary', async () => {
    // activeDaysCount is 4, so 5 is not a multiple of 7
    const user = createMockUser({
      activeDaysCount: 4,
      streakFreezes: 1,
      lastActiveDate: daysAgo(1),
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...user,
      activeDaysCount: 5,
    });

    const result = await trackActiveDay(USER_UUID);

    expect(result.activeDaysCount).toBe(5);
    expect(result.freezeAwarded).toBe(false);
  });
});

// ==================== calculateFreezeAwareDayStreak ====================

describe('calculateFreezeAwareDayStreak', () => {
  it('should return raw streak when no freeze used today', async () => {
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([
      { completedAt: new Date() },
    ]);

    const result = await calculateFreezeAwareDayStreak(USER_UUID, null);

    // At least 1 completion today, raw streak should be >= 1
    expect(result.currentDayStreak).toBeGreaterThanOrEqual(1);
  });

  it('should bump streak to 1 when freeze used today and raw streak is 0', async () => {
    // No completions => raw streak is 0
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([]);

    const result = await calculateFreezeAwareDayStreak(USER_UUID, new Date());

    expect(result.currentDayStreak).toBe(1);
  });

  it('should not bump streak when freeze used today but raw streak > 0', async () => {
    // Completion today => raw streak >= 1, freeze should not double-count
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([
      { completedAt: new Date() },
    ]);

    const result = await calculateFreezeAwareDayStreak(USER_UUID, new Date());

    // Should equal the raw value, not raw + 1
    const raw = await calculateOverallDayStreak(USER_UUID);
    expect(result.currentDayStreak).toBe(raw.currentDayStreak);
  });

  it('should not bump streak when freeze used yesterday (not today)', async () => {
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([]);

    const yesterday = daysAgo(1);
    const result = await calculateFreezeAwareDayStreak(USER_UUID, yesterday);

    expect(result.currentDayStreak).toBe(0);
  });
});
