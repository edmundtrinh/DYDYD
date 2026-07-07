// ============================================
// DYDYD - Shared Constants
// ============================================

import {
  Quest,
  QuestCategory,
  QuestFrequency,
  LevelInfo,
  Badge,
  BadgeType,
} from './types';

// -------------------- XP & Level Constants --------------------

export const XP_PER_LEVEL_BASE = 100;
export const XP_GROWTH_RATE = 1.15; // Each level requires 15% more XP

export const calculateXPForLevel = (level: number): number => {
  return Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_GROWTH_RATE, level - 1));
};

export const calculateTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
};

export const getLevelFromXP = (totalXP: number): number => {
  let level = 1;
  let xpRequired = 0;
  while (xpRequired + calculateXPForLevel(level) <= totalXP) {
    xpRequired += calculateXPForLevel(level);
    level++;
  }
  return level;
};

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Novice Adventurer',
  5: 'Apprentice Hero',
  10: 'Journeyman Champion',
  15: 'Skilled Warrior',
  20: 'Expert Achiever',
  25: 'Master of Habits',
  30: 'Grandmaster',
  40: 'Legend',
  50: 'Mythic Hero',
  75: 'Transcendent',
  100: 'Immortal',
};

export const getLevelTitle = (level: number): string => {
  const titles = Object.entries(LEVEL_TITLES)
    .map(([lvl, title]) => ({ level: parseInt(lvl), title }))
    .sort((a, b) => b.level - a.level);
  
  for (const { level: reqLevel, title } of titles) {
    if (level >= reqLevel) return title;
  }
  return 'Novice Adventurer';
};

// -------------------- Predefined Quest Library --------------------

export const PREDEFINED_QUESTS: Omit<Quest, 'id' | 'createdAt'>[] = [
  // Physical Health
  {
    name: 'Walk 10,000 Steps',
    description: 'Get your daily steps in for better cardiovascular health',
    category: QuestCategory.PHYSICAL_HEALTH,
    frequency: QuestFrequency.DAILY,
    baseXP: 10,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'walk',
    healthDataType: 'steps',
    targetValue: 10000,
    unit: 'steps',
  },
  {
    name: 'Drink Water',
    description: 'Stay hydrated by drinking water throughout the day',
    category: QuestCategory.PHYSICAL_HEALTH,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 8,
    isDefault: true,
    isCustom: false,
    iconName: 'water',
    healthDataType: 'water_cups',
    targetValue: 1,
    unit: 'cups',
  },
  {
    name: 'Get 8 Hours of Sleep',
    description: 'Quality sleep is essential for health and productivity',
    category: QuestCategory.PHYSICAL_HEALTH,
    frequency: QuestFrequency.DAILY,
    baseXP: 8,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'moon',
    healthDataType: 'sleep_hours',
    targetValue: 8,
    unit: 'hours',
  },
  {
    name: 'Exercise Session',
    description: 'Complete a workout or exercise routine',
    category: QuestCategory.PHYSICAL_HEALTH,
    frequency: QuestFrequency.DAILY,
    baseXP: 5,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'dumbbell',
    healthDataType: 'workout_minutes',
    targetValue: 30,
    unit: 'minutes',
  },
  {
    name: 'Brush Teeth',
    description: 'Maintain dental hygiene morning and night',
    category: QuestCategory.PHYSICAL_HEALTH,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'tooth',
  },
  {
    name: 'Take a Shower',
    description: 'Start or end your day feeling refreshed',
    category: QuestCategory.PHYSICAL_HEALTH,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'shower',
  },
  {
    name: 'Eat a Healthy Meal',
    description: 'Fuel your body with nutritious food',
    category: QuestCategory.PHYSICAL_HEALTH,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 3,
    isDefault: true,
    isCustom: false,
    iconName: 'salad',
  },

  // Mental Wellness
  {
    name: 'Meditate',
    description: 'Practice mindfulness for 10+ minutes',
    category: QuestCategory.MENTAL_WELLNESS,
    frequency: QuestFrequency.DAILY,
    baseXP: 3,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'meditation',
    healthDataType: 'mindful_minutes',
    targetValue: 10,
    unit: 'minutes',
  },
  {
    name: 'Journal Entry',
    description: 'Write in your journal to process thoughts and feelings',
    category: QuestCategory.MENTAL_WELLNESS,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'book-open',
  },
  {
    name: 'Read for Pleasure',
    description: 'Read a book for at least 30 minutes',
    category: QuestCategory.MENTAL_WELLNESS,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'book',
    targetValue: 30,
    unit: 'minutes',
  },
  {
    name: 'Practice a Hobby',
    description: 'Spend time on a creative or enjoyable activity',
    category: QuestCategory.MENTAL_WELLNESS,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'palette',
  },
  {
    name: 'Take a Break',
    description: 'Step away from work for a mental reset',
    category: QuestCategory.MENTAL_WELLNESS,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 3,
    isDefault: true,
    isCustom: false,
    iconName: 'coffee',
  },

  // Career & Productivity
  {
    name: 'Apply to Jobs',
    description: 'Submit job applications to advance your career',
    category: QuestCategory.CAREER_PRODUCTIVITY,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 10,
    isDefault: true,
    isCustom: false,
    iconName: 'briefcase',
    unit: 'applications',
  },
  {
    name: 'Study or Learn',
    description: 'Spend 30 minutes learning a new skill',
    category: QuestCategory.CAREER_PRODUCTIVITY,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'graduation-cap',
    targetValue: 30,
    unit: 'minutes',
  },
  {
    name: 'Network',
    description: 'Reach out to a professional contact',
    category: QuestCategory.CAREER_PRODUCTIVITY,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'users',
  },
  {
    name: 'Work on Personal Project',
    description: 'Make progress on a side project or portfolio piece',
    category: QuestCategory.CAREER_PRODUCTIVITY,
    frequency: QuestFrequency.DAILY,
    baseXP: 3,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'code',
  },
  {
    name: 'Complete Online Course Lesson',
    description: 'Finish a lesson from an online course',
    category: QuestCategory.CAREER_PRODUCTIVITY,
    frequency: QuestFrequency.WEEKLY,
    baseXP: 5,
    maxCompletionsPerPeriod: 5,
    isDefault: true,
    isCustom: false,
    iconName: 'video',
  },

  // Relationships & Social
  {
    name: 'Call or Text a Loved One',
    description: 'Stay connected with family and friends',
    category: QuestCategory.RELATIONSHIPS_SOCIAL,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 3,
    isDefault: true,
    isCustom: false,
    iconName: 'phone',
  },
  {
    name: 'Quality Time with Family',
    description: 'Spend at least an hour with family without distractions',
    category: QuestCategory.RELATIONSHIPS_SOCIAL,
    frequency: QuestFrequency.DAILY,
    baseXP: 3,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'heart',
    targetValue: 60,
    unit: 'minutes',
  },
  {
    name: 'Social Outing',
    description: 'Go out and socialize with friends',
    category: QuestCategory.RELATIONSHIPS_SOCIAL,
    frequency: QuestFrequency.DAILY,
    baseXP: 3,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'users-round',
  },
  {
    name: 'Help Someone',
    description: 'Do a kind act or help someone in need',
    category: QuestCategory.RELATIONSHIPS_SOCIAL,
    frequency: QuestFrequency.DAILY,
    baseXP: 2,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'hand-helping',
  },

  // Home & Chores
  {
    name: 'Make Your Bed',
    description: 'Start the day with a small win',
    category: QuestCategory.HOME_CHORES,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'bed',
  },
  {
    name: 'Do the Dishes',
    description: 'Keep the kitchen clean',
    category: QuestCategory.HOME_CHORES,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'utensils',
  },
  {
    name: 'Tidy Up',
    description: 'Quick cleanup of your living space',
    category: QuestCategory.HOME_CHORES,
    frequency: QuestFrequency.DAILY,
    baseXP: 1,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'sparkles',
  },
  {
    name: 'Do Laundry',
    description: 'Wash, dry, and fold your clothes',
    category: QuestCategory.HOME_CHORES,
    frequency: QuestFrequency.WEEKLY,
    baseXP: 5,
    maxCompletionsPerPeriod: 2,
    isDefault: true,
    isCustom: false,
    iconName: 'shirt',
  },
  {
    name: 'Deep Clean House',
    description: 'Thorough cleaning of your home',
    category: QuestCategory.HOME_CHORES,
    frequency: QuestFrequency.WEEKLY,
    baseXP: 10,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'home',
  },
  {
    name: 'Meal Prep',
    description: 'Prepare meals for the week ahead',
    category: QuestCategory.HOME_CHORES,
    frequency: QuestFrequency.WEEKLY,
    baseXP: 5,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'chef-hat',
  },
  {
    name: 'Grocery Shopping',
    description: 'Stock up on food and essentials',
    category: QuestCategory.HOME_CHORES,
    frequency: QuestFrequency.WEEKLY,
    baseXP: 3,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'shopping-cart',
  },
];

// -------------------- Predefined Badges --------------------

export const PREDEFINED_BADGES: Omit<Badge, 'id'>[] = [
  // Streak Badges
  {
    name: 'First Steps',
    description: 'Complete your first quest',
    iconName: 'footprints',
    type: BadgeType.MILESTONE,
    requirement: { type: 'total_completions', value: 1 },
    xpBonus: 5,
    rarity: 'common',
  },
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak on any quest',
    iconName: 'flame',
    type: BadgeType.STREAK,
    requirement: { type: 'streak', value: 7 },
    xpBonus: 25,
    rarity: 'common',
  },
  {
    name: 'Month Master',
    description: 'Maintain a 30-day streak on any quest',
    iconName: 'fire',
    type: BadgeType.STREAK,
    requirement: { type: 'streak', value: 30 },
    xpBonus: 100,
    rarity: 'rare',
  },
  {
    name: 'Century Club',
    description: 'Maintain a 100-day streak on any quest',
    iconName: 'trophy',
    type: BadgeType.STREAK,
    requirement: { type: 'streak', value: 100 },
    xpBonus: 500,
    rarity: 'epic',
  },
  {
    name: 'Year of Dedication',
    description: 'Maintain a 365-day streak on any quest',
    iconName: 'crown',
    type: BadgeType.STREAK,
    requirement: { type: 'streak', value: 365 },
    xpBonus: 2000,
    rarity: 'legendary',
  },

  // Category Badges
  {
    name: 'Health Enthusiast',
    description: 'Complete 100 Physical Health quests',
    iconName: 'heart-pulse',
    type: BadgeType.CATEGORY,
    requirement: {
      type: 'category_completions',
      value: 100,
      category: QuestCategory.PHYSICAL_HEALTH,
    },
    xpBonus: 50,
    rarity: 'common',
  },
  {
    name: 'Mindful Master',
    description: 'Complete 100 Mental Wellness quests',
    iconName: 'brain',
    type: BadgeType.CATEGORY,
    requirement: {
      type: 'category_completions',
      value: 100,
      category: QuestCategory.MENTAL_WELLNESS,
    },
    xpBonus: 50,
    rarity: 'common',
  },
  {
    name: 'Career Climber',
    description: 'Complete 100 Career & Productivity quests',
    iconName: 'trending-up',
    type: BadgeType.CATEGORY,
    requirement: {
      type: 'category_completions',
      value: 100,
      category: QuestCategory.CAREER_PRODUCTIVITY,
    },
    xpBonus: 50,
    rarity: 'common',
  },
  {
    name: 'Social Butterfly',
    description: 'Complete 100 Relationships & Social quests',
    iconName: 'users',
    type: BadgeType.CATEGORY,
    requirement: {
      type: 'category_completions',
      value: 100,
      category: QuestCategory.RELATIONSHIPS_SOCIAL,
    },
    xpBonus: 50,
    rarity: 'common',
  },
  {
    name: 'Home Hero',
    description: 'Complete 100 Home & Chores quests',
    iconName: 'home-heart',
    type: BadgeType.CATEGORY,
    requirement: {
      type: 'category_completions',
      value: 100,
      category: QuestCategory.HOME_CHORES,
    },
    xpBonus: 50,
    rarity: 'common',
  },

  // Milestone Badges
  {
    name: 'Rising Star',
    description: 'Reach Level 10',
    iconName: 'star',
    type: BadgeType.MILESTONE,
    requirement: { type: 'xp_threshold', value: 1000 },
    xpBonus: 100,
    rarity: 'common',
  },
  {
    name: 'Thousand Club',
    description: 'Earn 1,000 total XP',
    iconName: 'gem',
    type: BadgeType.MILESTONE,
    requirement: { type: 'xp_threshold', value: 1000 },
    xpBonus: 50,
    rarity: 'common',
  },
  {
    name: 'XP Elite',
    description: 'Earn 10,000 total XP',
    iconName: 'diamond',
    type: BadgeType.MILESTONE,
    requirement: { type: 'xp_threshold', value: 10000 },
    xpBonus: 500,
    rarity: 'epic',
  },

  // Special Badges
  {
    name: 'Early Bird',
    description: 'Complete 7 days of getting 8+ hours of sleep',
    iconName: 'sun',
    type: BadgeType.SPECIAL,
    requirement: { type: 'special', value: 7 },
    xpBonus: 25,
    rarity: 'common',
  },
  {
    name: 'Hydration Hero',
    description: 'Drink 50 cups of water in a week',
    iconName: 'droplet',
    type: BadgeType.SPECIAL,
    requirement: { type: 'special', value: 50 },
    xpBonus: 25,
    rarity: 'common',
  },
  {
    name: 'Consistency King',
    description: 'Complete all daily quests for 30 days straight',
    iconName: 'crown',
    type: BadgeType.SPECIAL,
    requirement: { type: 'special', value: 30 },
    xpBonus: 200,
    rarity: 'rare',
  },
];

// -------------------- Category Metadata --------------------

export const CATEGORY_METADATA: Record<
  QuestCategory,
  { name: string; icon: string; color: string; description: string }
> = {
  [QuestCategory.PHYSICAL_HEALTH]: {
    name: 'Physical Health',
    icon: 'heart-pulse',
    color: '#EF4444', // Red
    description: 'Exercise, sleep, hydration, and body care',
  },
  [QuestCategory.MENTAL_WELLNESS]: {
    name: 'Mental Wellness',
    icon: 'brain',
    color: '#8B5CF6', // Purple
    description: 'Meditation, journaling, hobbies, and self-care',
  },
  [QuestCategory.CAREER_PRODUCTIVITY]: {
    name: 'Career & Productivity',
    icon: 'briefcase',
    color: '#3B82F6', // Blue
    description: 'Work, learning, networking, and personal projects',
  },
  [QuestCategory.RELATIONSHIPS_SOCIAL]: {
    name: 'Relationships & Social',
    icon: 'users',
    color: '#F59E0B', // Amber
    description: 'Family, friends, and social connections',
  },
  [QuestCategory.HOME_CHORES]: {
    name: 'Home & Chores',
    icon: 'home',
    color: '#10B981', // Green
    description: 'Cleaning, organizing, and household tasks',
  },
};

// -------------------- Compassionate Streak Constants --------------------

export const STREAK_FREEZE_CONFIG = {
  maxFreezes: 3,
  freezeEarnInterval: 7, // Earn 1 freeze every 7 active days
} as const;

export const COMEBACK_CONFIG = {
  bonusXPMultiplier: 1.5,
  maxMissedDays: 7, // Comeback quest available if missed <= 7 days
} as const;

export const PROGRESSIVE_ONBOARDING = {
  initialQuestLimit: 1,
  daysToUnlockMore: 3, // Unlock more quests every 3 active days
  maxQuestsPerUnlock: 2, // Unlock 2 more quests each time
} as const;

export const MINIMUM_QUEST_DURATION_MINUTES = 2;

// -------------------- App Constants --------------------

export const APP_CONSTANTS = {
  MAX_CUSTOM_QUEST_XP: 10,
  MIN_CUSTOM_QUEST_XP: 1,
  WEEKLY_RESET_DAY: 0, // Sunday
  DAILY_RESET_HOUR: 0, // Midnight
  MAX_ACTIVE_QUESTS: 50,
  FREE_CUSTOM_QUESTS: 3,
  PREMIUM_CUSTOM_QUESTS: 50,
  DEFAULT_DAILY_GOAL_XP: 25,
  MAX_DAILY_GOAL_XP: 100,
  STREAK_GRACE_PERIOD_HOURS: 4, // Hours past midnight where streak is preserved
};
