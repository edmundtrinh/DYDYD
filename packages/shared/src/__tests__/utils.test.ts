import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  isSameDay,
  isSameWeek,
  getDaysBetween,
  formatDate,
  getPeriodStart,
  getPeriodEnd,
  calculateLevelProgress,
  calculateStreak,
  calculateDailyProgress,
  isValidEmail,
  isValidPassword,
  sanitizeString,
  generateId,
  groupBy,
  sortBy,
} from '../utils';
import { QuestFrequency, QuestCategory } from '../types';
import {
  calculateXPForLevel,
  getLevelFromXP,
  calculateTotalXPForLevel,
} from '../constants';

// ==================== Date Utilities ====================

describe('Date Utilities', () => {
  describe('getStartOfDay', () => {
    it('should return midnight for the given date', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = getStartOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should use current date when no date provided', () => {
      const result = getStartOfDay();
      const now = new Date();
      expect(result.getDate()).toBe(now.getDate());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getFullYear()).toBe(now.getFullYear());
    });

    it('should not mutate the original date', () => {
      const original = new Date('2024-03-15T14:30:00');
      const originalTime = original.getTime();
      getStartOfDay(original);
      expect(original.getTime()).toBe(originalTime);
    });
  });

  describe('getEndOfDay', () => {
    it('should return 23:59:59.999 for the given date', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = getEndOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('getStartOfWeek', () => {
    it('should return Sunday by default (weekStartDay = 0)', () => {
      // Wednesday March 13, 2024
      const date = new Date('2024-03-13T14:30:00');
      const result = getStartOfWeek(date, 0);
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(10); // March 10, 2024
    });

    it('should return Monday when weekStartDay = 1', () => {
      // Wednesday March 13, 2024
      const date = new Date('2024-03-13T14:30:00');
      const result = getStartOfWeek(date, 1);
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(11); // March 11, 2024
    });

    it('should handle when date is already the start of week', () => {
      // Sunday March 10, 2024
      const date = new Date('2024-03-10T14:30:00');
      const result = getStartOfWeek(date, 0);
      expect(result.getDay()).toBe(0);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('getEndOfWeek', () => {
    it('should return Saturday end when weekStartDay = 0', () => {
      const date = new Date('2024-03-13T14:30:00');
      const result = getEndOfWeek(date, 0);
      expect(result.getDay()).toBe(6); // Saturday
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day different times', () => {
      const date1 = new Date('2024-03-15T08:00:00');
      const date2 = new Date('2024-03-15T20:00:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-03-15T08:00:00');
      const date2 = new Date('2024-03-16T08:00:00');
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for different months', () => {
      const date1 = new Date('2024-03-15T08:00:00');
      const date2 = new Date('2024-04-15T08:00:00');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isSameWeek', () => {
    it('should return true for dates in same week', () => {
      const monday = new Date('2024-03-11T08:00:00');
      const wednesday = new Date('2024-03-13T08:00:00');
      expect(isSameWeek(monday, wednesday, 0)).toBe(true);
    });

    it('should return false for dates in different weeks', () => {
      const week1 = new Date('2024-03-10T08:00:00');
      const week2 = new Date('2024-03-17T08:00:00');
      expect(isSameWeek(week1, week2, 0)).toBe(false);
    });
  });

  describe('getDaysBetween', () => {
    it('should return 0 for same day', () => {
      const date1 = new Date('2024-03-15T08:00:00');
      const date2 = new Date('2024-03-15T20:00:00');
      expect(getDaysBetween(date1, date2)).toBe(0);
    });

    it('should return correct number of days', () => {
      const date1 = new Date('2024-03-15T08:00:00');
      const date2 = new Date('2024-03-20T08:00:00');
      expect(getDaysBetween(date1, date2)).toBe(5);
    });

    it('should handle dates in reverse order', () => {
      const date1 = new Date('2024-03-20T08:00:00');
      const date2 = new Date('2024-03-15T08:00:00');
      expect(getDaysBetween(date1, date2)).toBe(5);
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD by default', () => {
      const date = new Date('2024-03-15T14:30:00');
      expect(formatDate(date)).toBe('2024-03-15');
    });

    it('should handle custom formats', () => {
      const date = new Date('2024-03-15T14:30:00');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('03/15/2024');
    });

    it('should handle time format', () => {
      const date = new Date('2024-03-15T14:30:00');
      expect(formatDate(date, 'HH:mm')).toBe('14:30');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-01-05T09:05:00');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2024-01-05 09:05');
    });
  });

  describe('getPeriodStart', () => {
    it('should return start of day for DAILY frequency', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = getPeriodStart(QuestFrequency.DAILY, date);
      expect(result.getHours()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should return start of week for WEEKLY frequency', () => {
      const date = new Date('2024-03-13T14:30:00'); // Wednesday
      const result = getPeriodStart(QuestFrequency.WEEKLY, date, 0);
      expect(result.getDay()).toBe(0); // Sunday
    });

    it('should return start of month for MONTHLY frequency', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = getPeriodStart(QuestFrequency.MONTHLY, date);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(2); // March
    });
  });

  describe('getPeriodEnd', () => {
    it('should return end of day for DAILY frequency', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = getPeriodEnd(QuestFrequency.DAILY, date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });

    it('should return end of week for WEEKLY frequency', () => {
      const date = new Date('2024-03-13T14:30:00');
      const result = getPeriodEnd(QuestFrequency.WEEKLY, date, 0);
      expect(result.getDay()).toBe(6); // Saturday
    });

    it('should return end of month for MONTHLY frequency', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = getPeriodEnd(QuestFrequency.MONTHLY, date);
      expect(result.getDate()).toBe(31); // March has 31 days
      expect(result.getHours()).toBe(23);
    });

    it('should handle February correctly', () => {
      const date = new Date('2024-02-15T14:30:00'); // 2024 is leap year
      const result = getPeriodEnd(QuestFrequency.MONTHLY, date);
      expect(result.getDate()).toBe(29);
    });
  });
});

// ==================== XP & Level Utilities ====================

describe('XP & Level Utilities', () => {
  describe('calculateXPForLevel', () => {
    it('should return base XP (100) for level 1', () => {
      expect(calculateXPForLevel(1)).toBe(100);
    });

    it('should apply growth rate for higher levels', () => {
      // Level 2: floor(100 * 1.15^1) = floor(115) = 114
      expect(calculateXPForLevel(2)).toBe(114);
      // Level 3: floor(100 * 1.15^2) = floor(132.25) = 132
      expect(calculateXPForLevel(3)).toBe(132);
    });

    it('should increase XP required for each level', () => {
      const level5 = calculateXPForLevel(5);
      const level10 = calculateXPForLevel(10);
      const level20 = calculateXPForLevel(20);
      expect(level10).toBeGreaterThan(level5);
      expect(level20).toBeGreaterThan(level10);
    });
  });

  describe('calculateTotalXPForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(calculateTotalXPForLevel(1)).toBe(0);
    });

    it('should return 100 for level 2', () => {
      expect(calculateTotalXPForLevel(2)).toBe(100);
    });

    it('should accumulate XP from previous levels', () => {
      // Level 3: 100 (lvl 1) + 114 (lvl 2) = 214
      expect(calculateTotalXPForLevel(3)).toBe(214);
    });
  });

  describe('getLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXP(0)).toBe(1);
    });

    it('should return level 1 for 99 XP', () => {
      expect(getLevelFromXP(99)).toBe(1);
    });

    it('should return level 2 for 100 XP', () => {
      expect(getLevelFromXP(100)).toBe(2);
    });

    it('should return level 2 for 213 XP', () => {
      expect(getLevelFromXP(213)).toBe(2);
    });

    it('should return level 3 for 214 XP', () => {
      expect(getLevelFromXP(214)).toBe(3);
    });

    it('should handle large XP values', () => {
      const level = getLevelFromXP(10000);
      expect(level).toBeGreaterThan(10);
    });
  });

  describe('calculateLevelProgress', () => {
    it('should return correct progress for level 1 with 0 XP', () => {
      const result = calculateLevelProgress(0);
      expect(result.currentLevel).toBe(1);
      expect(result.currentXP).toBe(0);
      expect(result.xpInCurrentLevel).toBe(0);
      expect(result.xpForNextLevel).toBe(100);
      expect(result.progressPercent).toBe(0);
    });

    it('should return 50% progress at half XP', () => {
      const result = calculateLevelProgress(50);
      expect(result.currentLevel).toBe(1);
      expect(result.progressPercent).toBe(50);
    });

    it('should show new level after threshold', () => {
      const result = calculateLevelProgress(100);
      expect(result.currentLevel).toBe(2);
      expect(result.xpInCurrentLevel).toBe(0);
    });

    it('should cap progress at 100%', () => {
      // Edge case: exactly at threshold
      const result = calculateLevelProgress(99);
      expect(result.progressPercent).toBeLessThanOrEqual(100);
    });
  });
});

// ==================== Streak Utilities ====================

describe('Streak Utilities', () => {
  describe('calculateStreak', () => {
    it('should return 0 for empty completions array', () => {
      expect(calculateStreak([], QuestFrequency.DAILY)).toBe(0);
    });

    it('should return 1 for single completion today', () => {
      const today = new Date();
      expect(calculateStreak([today], QuestFrequency.DAILY, today)).toBe(1);
    });

    it('should count consecutive daily completions', () => {
      const today = new Date('2024-03-15T10:00:00');
      const yesterday = new Date('2024-03-14T10:00:00');
      const dayBefore = new Date('2024-03-13T10:00:00');

      const streak = calculateStreak(
        [today, yesterday, dayBefore],
        QuestFrequency.DAILY,
        today
      );
      expect(streak).toBe(3);
    });

    it('should break streak when day is missed', () => {
      const today = new Date('2024-03-15T10:00:00');
      const twoDaysAgo = new Date('2024-03-13T10:00:00');

      const streak = calculateStreak(
        [today, twoDaysAgo],
        QuestFrequency.DAILY,
        today
      );
      expect(streak).toBe(1);
    });

    it('should handle weekly frequency', () => {
      const thisWeek = new Date('2024-03-15T10:00:00');
      const lastWeek = new Date('2024-03-08T10:00:00');
      const twoWeeksAgo = new Date('2024-03-01T10:00:00');

      const streak = calculateStreak(
        [thisWeek, lastWeek, twoWeeksAgo],
        QuestFrequency.WEEKLY,
        thisWeek
      );
      expect(streak).toBe(3);
    });

    it('should handle unsorted completion dates', () => {
      const today = new Date('2024-03-15T10:00:00');
      const yesterday = new Date('2024-03-14T10:00:00');
      const dayBefore = new Date('2024-03-13T10:00:00');

      // Pass dates out of order
      const streak = calculateStreak(
        [dayBefore, today, yesterday],
        QuestFrequency.DAILY,
        today
      );
      expect(streak).toBe(3);
    });

    it('should handle multiple completions on same day', () => {
      const today1 = new Date('2024-03-15T08:00:00');
      const today2 = new Date('2024-03-15T14:00:00');
      const yesterday = new Date('2024-03-14T10:00:00');

      const streak = calculateStreak(
        [today1, today2, yesterday],
        QuestFrequency.DAILY,
        today1
      );
      expect(streak).toBe(2);
    });
  });
});

// ==================== Progress Calculation ====================

describe('Progress Calculation', () => {
  describe('calculateDailyProgress', () => {
    it('should return zeros for empty completions', () => {
      const result = calculateDailyProgress([], 5);
      expect(result.totalXP).toBe(0);
      expect(result.questsCompleted).toBe(0);
      expect(result.questsTotal).toBe(5);
    });

    it('should sum XP from all completions', () => {
      const completions = [
        { xpEarned: 10, category: QuestCategory.PHYSICAL_HEALTH },
        { xpEarned: 5, category: QuestCategory.MENTAL_WELLNESS },
        { xpEarned: 3, category: QuestCategory.HOME_CHORES },
      ];
      const result = calculateDailyProgress(completions, 10);
      expect(result.totalXP).toBe(18);
      expect(result.questsCompleted).toBe(3);
    });

    it('should track XP by category', () => {
      const completions = [
        { xpEarned: 10, category: QuestCategory.PHYSICAL_HEALTH },
        { xpEarned: 5, category: QuestCategory.PHYSICAL_HEALTH },
        { xpEarned: 3, category: QuestCategory.MENTAL_WELLNESS },
      ];
      const result = calculateDailyProgress(completions, 10);
      expect(result.categoryBreakdown[QuestCategory.PHYSICAL_HEALTH]).toBe(15);
      expect(result.categoryBreakdown[QuestCategory.MENTAL_WELLNESS]).toBe(3);
      expect(result.categoryBreakdown[QuestCategory.HOME_CHORES]).toBe(0);
    });

    it('should initialize all categories to 0', () => {
      const result = calculateDailyProgress([], 5);
      expect(result.categoryBreakdown[QuestCategory.PHYSICAL_HEALTH]).toBe(0);
      expect(result.categoryBreakdown[QuestCategory.MENTAL_WELLNESS]).toBe(0);
      expect(result.categoryBreakdown[QuestCategory.CAREER_PRODUCTIVITY]).toBe(0);
      expect(result.categoryBreakdown[QuestCategory.RELATIONSHIPS_SOCIAL]).toBe(0);
      expect(result.categoryBreakdown[QuestCategory.HOME_CHORES]).toBe(0);
    });
  });
});

// ==================== Validation Utilities ====================

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('Password1')).toBe(true);
      expect(isValidPassword('MySecure123')).toBe(true);
      expect(isValidPassword('Test1234')).toBe(true);
    });

    it('should return false for passwords without uppercase', () => {
      expect(isValidPassword('password1')).toBe(false);
    });

    it('should return false for passwords without lowercase', () => {
      expect(isValidPassword('PASSWORD1')).toBe(false);
    });

    it('should return false for passwords without numbers', () => {
      expect(isValidPassword('Password')).toBe(false);
    });

    it('should return false for short passwords', () => {
      expect(isValidPassword('Pass1')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove < and > characters', () => {
      expect(sanitizeString('<script>alert()</script>')).toBe('scriptalert()/script');
    });

    it('should preserve normal text', () => {
      expect(sanitizeString('Hello World!')).toBe('Hello World!');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });
  });
});

// ==================== ID Generation ====================

describe('ID Generation', () => {
  describe('generateId', () => {
    it('should return a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should return UUID v4 format', () => {
      const id = generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });
});

// ==================== Array Utilities ====================

describe('Array Utilities', () => {
  describe('groupBy', () => {
    it('should group items by key function', () => {
      const items = [
        { name: 'apple', type: 'fruit' },
        { name: 'banana', type: 'fruit' },
        { name: 'carrot', type: 'vegetable' },
      ];
      const result = groupBy(items, (item) => item.type);
      expect(result['fruit']).toHaveLength(2);
      expect(result['vegetable']).toHaveLength(1);
    });

    it('should return empty object for empty array', () => {
      const result = groupBy([], (item: any) => item.type);
      expect(result).toEqual({});
    });

    it('should handle numeric keys', () => {
      const items = [
        { name: 'a', score: 10 },
        { name: 'b', score: 20 },
        { name: 'c', score: 10 },
      ];
      const result = groupBy(items, (item) => item.score);
      expect(result[10]).toHaveLength(2);
      expect(result[20]).toHaveLength(1);
    });
  });

  describe('sortBy', () => {
    it('should sort by key function ascending', () => {
      const items = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
      const result = sortBy(items, (item) => item.name, 'asc');
      expect(result.map((i) => i.name)).toEqual(['a', 'b', 'c']);
    });

    it('should sort by key function descending', () => {
      const items = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
      const result = sortBy(items, (item) => item.name, 'desc');
      expect(result.map((i) => i.name)).toEqual(['c', 'b', 'a']);
    });

    it('should sort numbers correctly', () => {
      const items = [{ score: 30 }, { score: 10 }, { score: 20 }];
      const result = sortBy(items, (item) => item.score, 'asc');
      expect(result.map((i) => i.score)).toEqual([10, 20, 30]);
    });

    it('should not mutate original array', () => {
      const items = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
      sortBy(items, (item) => item.name, 'asc');
      expect(items.map((i) => i.name)).toEqual(['c', 'a', 'b']);
    });

    it('should default to ascending order', () => {
      const items = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
      const result = sortBy(items, (item) => item.name);
      expect(result.map((i) => i.name)).toEqual(['a', 'b', 'c']);
    });
  });
});
