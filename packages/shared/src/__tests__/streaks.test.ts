import {
  canUseStreakFreeze,
  applyStreakFreeze,
  shouldOfferComebackQuest,
  calculateComebackXP,
  getOnboardingQuestLimit,
} from '../utils';
import {
  STREAK_FREEZE_CONFIG,
  COMEBACK_CONFIG,
  PROGRESSIVE_ONBOARDING,
} from '../constants';
import { StreakFreezeResult, ComebackQuest } from '../types';

// ==================== Constants Existence ====================

describe('Compassionate Streak Constants', () => {
  it('should export STREAK_FREEZE_CONFIG with correct shape', () => {
    expect(STREAK_FREEZE_CONFIG).toEqual({
      maxFreezes: 3,
      freezeEarnInterval: 7,
    });
  });

  it('should export COMEBACK_CONFIG with correct shape', () => {
    expect(COMEBACK_CONFIG).toEqual({
      bonusXPMultiplier: 1.5,
      maxMissedDays: 14,
    });
  });

  it('should export PROGRESSIVE_ONBOARDING with correct shape', () => {
    expect(PROGRESSIVE_ONBOARDING).toEqual({
      initialQuestLimit: 3,
      daysToUnlockMore: 3,
      maxQuestsPerUnlock: 2,
    });
  });
});

// ==================== canUseStreakFreeze ====================

describe('canUseStreakFreeze', () => {
  it('should return true when user has freezes and none used today', () => {
    const result = canUseStreakFreeze({ streakFreezes: 2 });
    expect(result).toBe(true);
  });

  it('should return false when user has no freezes', () => {
    const result = canUseStreakFreeze({ streakFreezes: 0 });
    expect(result).toBe(false);
  });

  it('should return false when freeze was already used today', () => {
    const today = new Date().toISOString();
    const result = canUseStreakFreeze({
      streakFreezes: 2,
      streakFreezeUsedAt: today,
    });
    expect(result).toBe(false);
  });

  it('should return true when freeze was used on a previous day', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = canUseStreakFreeze({
      streakFreezes: 1,
      streakFreezeUsedAt: yesterday.toISOString(),
    });
    expect(result).toBe(true);
  });

  it('should return false when streakFreezes is negative (edge case)', () => {
    const result = canUseStreakFreeze({ streakFreezes: -1 });
    expect(result).toBe(false);
  });
});

// ==================== applyStreakFreeze ====================

describe('applyStreakFreeze', () => {
  it('should decrement freezes and return preserved result', () => {
    const result: StreakFreezeResult = applyStreakFreeze({ streakFreezes: 3 });
    expect(result).toEqual({
      used: true,
      freezesRemaining: 2,
      streakPreserved: true,
    });
  });

  it('should return not-used result when no freezes available', () => {
    const result: StreakFreezeResult = applyStreakFreeze({ streakFreezes: 0 });
    expect(result).toEqual({
      used: false,
      freezesRemaining: 0,
      streakPreserved: false,
    });
  });

  it('should handle exactly 1 freeze remaining', () => {
    const result = applyStreakFreeze({ streakFreezes: 1 });
    expect(result.used).toBe(true);
    expect(result.freezesRemaining).toBe(0);
    expect(result.streakPreserved).toBe(true);
  });
});

// ==================== shouldOfferComebackQuest ====================

describe('shouldOfferComebackQuest', () => {
  const createDateDaysAgo = (days: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(12, 0, 0, 0); // Noon to avoid boundary issues
    return d;
  };

  it.each([
    [0, false, 'same day (0 days ago)'],
    [1, true, '1 day ago (boundary start)'],
    [3, true, '3 days ago (middle)'],
    [7, true, '7 days ago'],
    [14, true, '14 days ago (boundary end)'],
    [15, false, '15 days ago (beyond max)'],
    [30, false, '30 days ago (well beyond)'],
  ])(
    'given lastActive %i days ago, should return %s (%s)',
    (daysAgo, expected) => {
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      const lastActive = createDateDaysAgo(daysAgo);
      const result = shouldOfferComebackQuest(lastActive, now);
      expect(result).toBe(expected);
    }
  );

  it('should accept a string date for lastActiveDate', () => {
    const twoDaysAgo = createDateDaysAgo(2);
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const result = shouldOfferComebackQuest(twoDaysAgo.toISOString(), now);
    expect(result).toBe(true);
  });

  it('should use current date when now is not provided', () => {
    // 3 days ago should be eligible
    const threeDaysAgo = createDateDaysAgo(3);
    const result = shouldOfferComebackQuest(threeDaysAgo);
    expect(result).toBe(true);
  });
});

// ==================== calculateComebackXP ====================

describe('calculateComebackXP', () => {
  it('should apply 1.5x multiplier to base XP', () => {
    expect(calculateComebackXP(10)).toBe(15);
  });

  it('should floor non-integer results', () => {
    // 5 * 1.5 = 7.5 -> floor = 7
    expect(calculateComebackXP(5)).toBe(7);
  });

  it('should handle 0 base XP', () => {
    expect(calculateComebackXP(0)).toBe(0);
  });

  it('should handle 1 base XP', () => {
    // 1 * 1.5 = 1.5 -> floor = 1
    expect(calculateComebackXP(1)).toBe(1);
  });

  it('should handle large base XP', () => {
    expect(calculateComebackXP(100)).toBe(150);
  });
});

// ==================== getOnboardingQuestLimit ====================

describe('getOnboardingQuestLimit', () => {
  it.each([
    [0, 3, 'initial (0 active days)'],
    [1, 3, '1 active day (not yet unlocked)'],
    [2, 3, '2 active days (not yet unlocked)'],
    [3, 5, '3 active days (first unlock: 3 + 2)'],
    [5, 5, '5 active days (between unlocks)'],
    [6, 7, '6 active days (second unlock: 3 + 4)'],
    [9, 9, '9 active days (third unlock: 3 + 6)'],
    [30, 23, '30 active days (10 unlocks: 3 + 20)'],
  ])(
    'given %i active days, should return %i (%s)',
    (activeDays, expected) => {
      expect(getOnboardingQuestLimit(activeDays)).toBe(expected);
    }
  );
});

// ==================== Type existence checks ====================

describe('Type Exports', () => {
  it('StreakFreezeResult should have the correct shape', () => {
    const result: StreakFreezeResult = {
      used: true,
      freezesRemaining: 2,
      streakPreserved: true,
    };
    expect(result.used).toBe(true);
    expect(result.freezesRemaining).toBe(2);
    expect(result.streakPreserved).toBe(true);
  });

  it('ComebackQuest should extend Quest with bonus fields', () => {
    // Verify the type compiles with the required fields
    const quest: ComebackQuest = {
      id: 'test',
      name: 'Comeback',
      description: 'Welcome back',
      category: 'physical_health' as any,
      frequency: 'daily' as any,
      baseXP: 15,
      maxCompletionsPerPeriod: 1,
      isDefault: false,
      isCustom: false,
      iconName: 'star',
      createdAt: new Date(),
      bonusXPMultiplier: 1.5,
      isComeback: true,
    };
    expect(quest.bonusXPMultiplier).toBe(1.5);
    expect(quest.isComeback).toBe(true);
  });
});
