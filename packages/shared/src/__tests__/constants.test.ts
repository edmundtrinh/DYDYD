import {
  XP_PER_LEVEL_BASE,
  XP_GROWTH_RATE,
  calculateXPForLevel,
  calculateTotalXPForLevel,
  getLevelFromXP,
  LEVEL_TITLES,
  getLevelTitle,
  PREDEFINED_QUESTS,
  PREDEFINED_BADGES,
  CATEGORY_METADATA,
  APP_CONSTANTS,
} from '../constants';
import { QuestCategory, QuestFrequency, BadgeType } from '../types';

// ==================== XP Constants ====================

describe('XP Constants', () => {
  it('should have base XP of 100', () => {
    expect(XP_PER_LEVEL_BASE).toBe(100);
  });

  it('should have growth rate of 1.15', () => {
    expect(XP_GROWTH_RATE).toBe(1.15);
  });
});

// ==================== XP Calculation Functions ====================

describe('XP Calculation Functions', () => {
  describe('calculateXPForLevel', () => {
    it('should match formula: baseXP * growthRate^(level-1)', () => {
      for (let level = 1; level <= 10; level++) {
        const expected = Math.floor(
          XP_PER_LEVEL_BASE * Math.pow(XP_GROWTH_RATE, level - 1)
        );
        expect(calculateXPForLevel(level)).toBe(expected);
      }
    });

    it('should return increasing values for higher levels', () => {
      let previousXP = 0;
      for (let level = 1; level <= 50; level++) {
        const currentXP = calculateXPForLevel(level);
        expect(currentXP).toBeGreaterThan(previousXP);
        previousXP = currentXP;
      }
    });
  });

  describe('calculateTotalXPForLevel', () => {
    it('should return 0 for level 1 (no XP needed to be level 1)', () => {
      expect(calculateTotalXPForLevel(1)).toBe(0);
    });

    it('should return sum of XP for all previous levels', () => {
      // Level 4 = XP for levels 1 + 2 + 3
      const level4Total =
        calculateXPForLevel(1) + calculateXPForLevel(2) + calculateXPForLevel(3);
      expect(calculateTotalXPForLevel(4)).toBe(level4Total);
    });
  });

  describe('getLevelFromXP', () => {
    it('should be inverse of calculateTotalXPForLevel', () => {
      for (let level = 1; level <= 20; level++) {
        const totalXP = calculateTotalXPForLevel(level);
        expect(getLevelFromXP(totalXP)).toBe(level);
      }
    });

    it('should handle XP values between levels', () => {
      // 150 XP should still be level 2 (needs 215 for level 3)
      expect(getLevelFromXP(150)).toBe(2);
    });
  });
});

// ==================== Level Titles ====================

describe('Level Titles', () => {
  describe('LEVEL_TITLES', () => {
    it('should have title for level 1', () => {
      expect(LEVEL_TITLES[1]).toBe('Novice Adventurer');
    });

    it('should have title for max level 100', () => {
      expect(LEVEL_TITLES[100]).toBe('Immortal');
    });

    it('should have all milestone titles', () => {
      expect(LEVEL_TITLES[5]).toBe('Apprentice Hero');
      expect(LEVEL_TITLES[10]).toBe('Journeyman Champion');
      expect(LEVEL_TITLES[15]).toBe('Skilled Warrior');
      expect(LEVEL_TITLES[20]).toBe('Expert Achiever');
      expect(LEVEL_TITLES[25]).toBe('Master of Habits');
      expect(LEVEL_TITLES[30]).toBe('Grandmaster');
      expect(LEVEL_TITLES[40]).toBe('Legend');
      expect(LEVEL_TITLES[50]).toBe('Mythic Hero');
      expect(LEVEL_TITLES[75]).toBe('Transcendent');
    });
  });

  describe('getLevelTitle', () => {
    it('should return correct title for exact milestone levels', () => {
      expect(getLevelTitle(1)).toBe('Novice Adventurer');
      expect(getLevelTitle(10)).toBe('Journeyman Champion');
      expect(getLevelTitle(100)).toBe('Immortal');
    });

    it('should return previous milestone title for in-between levels', () => {
      expect(getLevelTitle(3)).toBe('Novice Adventurer');
      expect(getLevelTitle(7)).toBe('Apprentice Hero');
      expect(getLevelTitle(12)).toBe('Journeyman Champion');
    });

    it('should return highest applicable title', () => {
      expect(getLevelTitle(99)).toBe('Transcendent');
      expect(getLevelTitle(100)).toBe('Immortal');
    });
  });
});

// ==================== Predefined Quests ====================

describe('Predefined Quests', () => {
  it('should have at least 25 quests', () => {
    expect(PREDEFINED_QUESTS.length).toBeGreaterThanOrEqual(25);
  });

  it('should have quests in all 5 categories', () => {
    const categories = new Set(PREDEFINED_QUESTS.map((q) => q.category));
    expect(categories.size).toBe(5);
    expect(categories.has(QuestCategory.PHYSICAL_HEALTH)).toBe(true);
    expect(categories.has(QuestCategory.MENTAL_WELLNESS)).toBe(true);
    expect(categories.has(QuestCategory.CAREER_PRODUCTIVITY)).toBe(true);
    expect(categories.has(QuestCategory.RELATIONSHIPS_SOCIAL)).toBe(true);
    expect(categories.has(QuestCategory.HOME_CHORES)).toBe(true);
  });

  it('should have required fields on all quests', () => {
    PREDEFINED_QUESTS.forEach((quest, index) => {
      expect(quest.name).toBeTruthy();
      expect(quest.description).toBeTruthy();
      expect(Object.values(QuestCategory)).toContain(quest.category);
      expect(Object.values(QuestFrequency)).toContain(quest.frequency);
      expect(typeof quest.baseXP).toBe('number');
      expect(quest.baseXP).toBeGreaterThan(0);
      expect(typeof quest.maxCompletionsPerPeriod).toBe('number');
      expect(quest.maxCompletionsPerPeriod).toBeGreaterThan(0);
      expect(typeof quest.isDefault).toBe('boolean');
      expect(typeof quest.isCustom).toBe('boolean');
      expect(quest.iconName).toBeTruthy();
    });
  });

  it('should mark all predefined quests as default and not custom', () => {
    PREDEFINED_QUESTS.forEach((quest) => {
      expect(quest.isDefault).toBe(true);
      expect(quest.isCustom).toBe(false);
    });
  });

  it('should have valid XP values within app limits', () => {
    PREDEFINED_QUESTS.forEach((quest) => {
      expect(quest.baseXP).toBeGreaterThanOrEqual(APP_CONSTANTS.MIN_CUSTOM_QUEST_XP);
      expect(quest.baseXP).toBeLessThanOrEqual(APP_CONSTANTS.MAX_CUSTOM_QUEST_XP);
    });
  });

  it('should have health data type only on trackable quests', () => {
    const trackableQuests = PREDEFINED_QUESTS.filter((q) => q.healthDataType);
    trackableQuests.forEach((quest) => {
      expect(quest.targetValue).toBeDefined();
      expect(quest.targetValue).toBeGreaterThan(0);
    });
  });

  describe('Physical Health quests', () => {
    const physicalQuests = PREDEFINED_QUESTS.filter(
      (q) => q.category === QuestCategory.PHYSICAL_HEALTH
    );

    it('should have multiple physical health quests', () => {
      expect(physicalQuests.length).toBeGreaterThanOrEqual(5);
    });

    it('should include steps quest with 10000 target', () => {
      const stepsQuest = physicalQuests.find((q) => q.healthDataType === 'steps');
      expect(stepsQuest).toBeDefined();
      expect(stepsQuest?.targetValue).toBe(10000);
    });

    it('should include sleep quest with 8 hour target', () => {
      const sleepQuest = physicalQuests.find((q) => q.healthDataType === 'sleep_hours');
      expect(sleepQuest).toBeDefined();
      expect(sleepQuest?.targetValue).toBe(8);
    });
  });

  describe('Quest frequency distribution', () => {
    it('should have both daily and weekly quests', () => {
      const dailyQuests = PREDEFINED_QUESTS.filter(
        (q) => q.frequency === QuestFrequency.DAILY
      );
      const weeklyQuests = PREDEFINED_QUESTS.filter(
        (q) => q.frequency === QuestFrequency.WEEKLY
      );

      expect(dailyQuests.length).toBeGreaterThan(0);
      expect(weeklyQuests.length).toBeGreaterThan(0);
    });
  });
});

// ==================== Predefined Badges ====================

describe('Predefined Badges', () => {
  it('should have at least 15 badges', () => {
    expect(PREDEFINED_BADGES.length).toBeGreaterThanOrEqual(15);
  });

  it('should have badges of all types', () => {
    const types = new Set(PREDEFINED_BADGES.map((b) => b.type));
    expect(types.has(BadgeType.STREAK)).toBe(true);
    expect(types.has(BadgeType.MILESTONE)).toBe(true);
    expect(types.has(BadgeType.CATEGORY)).toBe(true);
    expect(types.has(BadgeType.SPECIAL)).toBe(true);
  });

  it('should have unique badge names', () => {
    const names = PREDEFINED_BADGES.map((b) => b.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('should have required fields on all badges', () => {
    PREDEFINED_BADGES.forEach((badge) => {
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.iconName).toBeTruthy();
      expect(Object.values(BadgeType)).toContain(badge.type);
      expect(badge.requirement).toBeDefined();
      expect(typeof badge.requirement.type).toBe('string');
      expect(typeof badge.requirement.value).toBe('number');
      expect(typeof badge.xpBonus).toBe('number');
      expect(badge.xpBonus).toBeGreaterThan(0);
      expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity);
    });
  });

  describe('Streak badges', () => {
    const streakBadges = PREDEFINED_BADGES.filter((b) => b.type === BadgeType.STREAK);

    it('should have streak badges for key milestones', () => {
      const streakValues = streakBadges.map((b) => b.requirement.value);
      expect(streakValues).toContain(7); // Week Warrior
      expect(streakValues).toContain(30); // Month Master
      expect(streakValues).toContain(100); // Century Club
      expect(streakValues).toContain(365); // Year of Dedication
    });

    it('should have increasing XP bonuses for longer streaks', () => {
      const sortedByStreak = [...streakBadges].sort(
        (a, b) => a.requirement.value - b.requirement.value
      );

      for (let i = 1; i < sortedByStreak.length; i++) {
        expect(sortedByStreak[i].xpBonus).toBeGreaterThan(
          sortedByStreak[i - 1].xpBonus
        );
      }
    });
  });

  describe('Category badges', () => {
    const categoryBadges = PREDEFINED_BADGES.filter((b) => b.type === BadgeType.CATEGORY);

    it('should have a badge for each category', () => {
      const categories = categoryBadges.map((b) => b.requirement.category);
      expect(categories).toContain(QuestCategory.PHYSICAL_HEALTH);
      expect(categories).toContain(QuestCategory.MENTAL_WELLNESS);
      expect(categories).toContain(QuestCategory.CAREER_PRODUCTIVITY);
      expect(categories).toContain(QuestCategory.RELATIONSHIPS_SOCIAL);
      expect(categories).toContain(QuestCategory.HOME_CHORES);
    });

    it('should require 100 completions for category badges', () => {
      categoryBadges.forEach((badge) => {
        expect(badge.requirement.value).toBe(100);
      });
    });
  });

  describe('Rarity distribution', () => {
    it('should have more common badges than legendary', () => {
      const commonCount = PREDEFINED_BADGES.filter((b) => b.rarity === 'common').length;
      const legendaryCount = PREDEFINED_BADGES.filter(
        (b) => b.rarity === 'legendary'
      ).length;
      expect(commonCount).toBeGreaterThan(legendaryCount);
    });

    it('should have higher XP bonuses for rarer badges on average', () => {
      const avgByRarity = (rarity: string) => {
        const badges = PREDEFINED_BADGES.filter((b) => b.rarity === rarity);
        if (badges.length === 0) return 0;
        return badges.reduce((sum, b) => sum + b.xpBonus, 0) / badges.length;
      };

      expect(avgByRarity('legendary')).toBeGreaterThan(avgByRarity('epic'));
      expect(avgByRarity('epic')).toBeGreaterThan(avgByRarity('rare'));
      expect(avgByRarity('rare')).toBeGreaterThan(avgByRarity('common'));
    });
  });
});

// ==================== Category Metadata ====================

describe('Category Metadata', () => {
  it('should have metadata for all 5 categories', () => {
    expect(Object.keys(CATEGORY_METADATA).length).toBe(5);
    expect(CATEGORY_METADATA[QuestCategory.PHYSICAL_HEALTH]).toBeDefined();
    expect(CATEGORY_METADATA[QuestCategory.MENTAL_WELLNESS]).toBeDefined();
    expect(CATEGORY_METADATA[QuestCategory.CAREER_PRODUCTIVITY]).toBeDefined();
    expect(CATEGORY_METADATA[QuestCategory.RELATIONSHIPS_SOCIAL]).toBeDefined();
    expect(CATEGORY_METADATA[QuestCategory.HOME_CHORES]).toBeDefined();
  });

  it('should have required fields for each category', () => {
    Object.values(CATEGORY_METADATA).forEach((meta) => {
      expect(meta.name).toBeTruthy();
      expect(meta.icon).toBeTruthy();
      expect(meta.color).toBeTruthy();
      expect(meta.description).toBeTruthy();
    });
  });

  it('should have valid hex color codes', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.values(CATEGORY_METADATA).forEach((meta) => {
      expect(meta.color).toMatch(hexColorRegex);
    });
  });

  it('should have unique colors for each category', () => {
    const colors = Object.values(CATEGORY_METADATA).map((m) => m.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });
});

// ==================== App Constants ====================

describe('App Constants', () => {
  it('should have valid XP limits', () => {
    expect(APP_CONSTANTS.MAX_CUSTOM_QUEST_XP).toBe(10);
    expect(APP_CONSTANTS.MIN_CUSTOM_QUEST_XP).toBe(1);
    expect(APP_CONSTANTS.MAX_CUSTOM_QUEST_XP).toBeGreaterThan(
      APP_CONSTANTS.MIN_CUSTOM_QUEST_XP
    );
  });

  it('should have valid weekly reset day', () => {
    expect(APP_CONSTANTS.WEEKLY_RESET_DAY).toBeGreaterThanOrEqual(0);
    expect(APP_CONSTANTS.WEEKLY_RESET_DAY).toBeLessThanOrEqual(6);
  });

  it('should have valid daily reset hour', () => {
    expect(APP_CONSTANTS.DAILY_RESET_HOUR).toBeGreaterThanOrEqual(0);
    expect(APP_CONSTANTS.DAILY_RESET_HOUR).toBeLessThanOrEqual(23);
  });

  it('should have reasonable quest limits', () => {
    expect(APP_CONSTANTS.MAX_ACTIVE_QUESTS).toBe(50);
    expect(APP_CONSTANTS.FREE_CUSTOM_QUESTS).toBe(3);
    expect(APP_CONSTANTS.PREMIUM_CUSTOM_QUESTS).toBe(50);
    expect(APP_CONSTANTS.PREMIUM_CUSTOM_QUESTS).toBeGreaterThan(
      APP_CONSTANTS.FREE_CUSTOM_QUESTS
    );
  });

  it('should have valid daily goal XP values', () => {
    expect(APP_CONSTANTS.DEFAULT_DAILY_GOAL_XP).toBe(25);
    expect(APP_CONSTANTS.MAX_DAILY_GOAL_XP).toBe(100);
    expect(APP_CONSTANTS.MAX_DAILY_GOAL_XP).toBeGreaterThan(
      APP_CONSTANTS.DEFAULT_DAILY_GOAL_XP
    );
  });

  it('should have reasonable streak grace period', () => {
    expect(APP_CONSTANTS.STREAK_GRACE_PERIOD_HOURS).toBe(4);
    expect(APP_CONSTANTS.STREAK_GRACE_PERIOD_HOURS).toBeGreaterThan(0);
    expect(APP_CONSTANTS.STREAK_GRACE_PERIOD_HOURS).toBeLessThan(12);
  });
});
