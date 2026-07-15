import {
  checkEarlyRiserBadge,
  checkNightOwlBadge,
  checkSteadyEddieBadge,
  checkDawnPatrolBadge,
  TimeBadgeCompletion,
} from '../utils';
import { TimeBucket } from '../types';

// Helper: create a completion on a given date with a given bucket.
// Uses local-time construction to avoid UTC/local-time mismatch in CI.
const makeCompletion = (
  year: number,
  month: number,
  day: number,
  hour: number,
  bucket: string
): TimeBadgeCompletion => ({
  completedAt: new Date(year, month - 1, day, hour, 0, 0),
  timeBucket: bucket,
});

// Helper: create N consecutive days of completions in a given bucket,
// ending on the given date (going backwards).
const makeConsecutiveDays = (
  count: number,
  bucket: string,
  hour: number = 6,
  endYear: number = 2026,
  endMonth: number = 7,
  endDay: number = 10
): TimeBadgeCompletion[] => {
  const completions: TimeBadgeCompletion[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(endYear, endMonth - 1, endDay - i, hour, 0, 0);
    completions.push({
      completedAt: d,
      timeBucket: bucket,
    });
  }
  return completions;
};

// ==================== Early Riser Badge ====================

describe('checkEarlyRiserBadge', () => {
  it('should return true for 5 consecutive days with EARLY_MORNING completions', () => {
    const completions = makeConsecutiveDays(5, TimeBucket.EARLY_MORNING, 5);
    expect(checkEarlyRiserBadge(completions)).toBe(true);
  });

  it('should return true for more than 5 consecutive days', () => {
    const completions = makeConsecutiveDays(7, TimeBucket.EARLY_MORNING, 5);
    expect(checkEarlyRiserBadge(completions)).toBe(true);
  });

  it('should return false for 4 consecutive days (below threshold)', () => {
    const completions = makeConsecutiveDays(4, TimeBucket.EARLY_MORNING, 5);
    expect(checkEarlyRiserBadge(completions)).toBe(false);
  });

  it('should return false for non-consecutive days', () => {
    const completions = [
      makeCompletion(2026, 7, 10, 5, TimeBucket.EARLY_MORNING),
      makeCompletion(2026, 7, 9, 5, TimeBucket.EARLY_MORNING),
      makeCompletion(2026, 7, 8, 5, TimeBucket.EARLY_MORNING),
      // gap: day 7 missing
      makeCompletion(2026, 7, 6, 5, TimeBucket.EARLY_MORNING),
      makeCompletion(2026, 7, 5, 5, TimeBucket.EARLY_MORNING),
    ];
    expect(checkEarlyRiserBadge(completions)).toBe(false);
  });

  it('should return false for empty completions', () => {
    expect(checkEarlyRiserBadge([])).toBe(false);
  });

  it('should ignore completions in other buckets', () => {
    const completions = makeConsecutiveDays(5, TimeBucket.MORNING, 9);
    expect(checkEarlyRiserBadge(completions)).toBe(false);
  });

  it('should handle multiple completions on the same day', () => {
    const completions = [
      ...makeConsecutiveDays(5, TimeBucket.EARLY_MORNING, 5),
      // Extra completion on day 10 in the same bucket
      makeCompletion(2026, 7, 10, 6, TimeBucket.EARLY_MORNING),
    ];
    expect(checkEarlyRiserBadge(completions)).toBe(true);
  });
});

// ==================== Night Owl Badge ====================

describe('checkNightOwlBadge', () => {
  it.each([
    ['EVENING only', TimeBucket.EVENING, 19],
    ['NIGHT only', TimeBucket.NIGHT, 23],
  ])(
    'should return true for 5 consecutive days with %s completions',
    (_label, bucket, hour) => {
      const completions = makeConsecutiveDays(5, bucket, hour);
      expect(checkNightOwlBadge(completions)).toBe(true);
    }
  );

  it('should return true when mixing EVENING and NIGHT across days', () => {
    const completions = [
      makeCompletion(2026, 7, 10, 22, TimeBucket.NIGHT),
      makeCompletion(2026, 7, 9, 19, TimeBucket.EVENING),
      makeCompletion(2026, 7, 8, 23, TimeBucket.NIGHT),
      makeCompletion(2026, 7, 7, 20, TimeBucket.EVENING),
      makeCompletion(2026, 7, 6, 21, TimeBucket.EVENING),
    ];
    expect(checkNightOwlBadge(completions)).toBe(true);
  });

  it('should return false for 4 consecutive days', () => {
    const completions = makeConsecutiveDays(4, TimeBucket.EVENING, 19);
    expect(checkNightOwlBadge(completions)).toBe(false);
  });

  it('should return false for MORNING bucket completions', () => {
    const completions = makeConsecutiveDays(5, TimeBucket.MORNING, 9);
    expect(checkNightOwlBadge(completions)).toBe(false);
  });

  it('should return false for empty completions', () => {
    expect(checkNightOwlBadge([])).toBe(false);
  });
});

// ==================== Steady Eddie Badge ====================

describe('checkSteadyEddieBadge', () => {
  it.each([
    ['EARLY_MORNING', TimeBucket.EARLY_MORNING, 5],
    ['MORNING', TimeBucket.MORNING, 9],
    ['AFTERNOON', TimeBucket.AFTERNOON, 14],
    ['EVENING', TimeBucket.EVENING, 19],
    ['NIGHT', TimeBucket.NIGHT, 23],
  ])(
    'should return true for 7 consecutive days in %s bucket',
    (_label, bucket, hour) => {
      const completions = makeConsecutiveDays(7, bucket, hour);
      expect(checkSteadyEddieBadge(completions)).toBe(true);
    }
  );

  it('should return false for 6 consecutive days (below threshold)', () => {
    const completions = makeConsecutiveDays(6, TimeBucket.MORNING, 9);
    expect(checkSteadyEddieBadge(completions)).toBe(false);
  });

  it('should return false when days have completions in multiple buckets', () => {
    // Each day has completions in MORNING and AFTERNOON -- no single-bucket day
    const completions: TimeBadgeCompletion[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2026, 6, 10 - i);
      completions.push(
        { completedAt: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0), timeBucket: TimeBucket.MORNING },
        { completedAt: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 0, 0), timeBucket: TimeBucket.AFTERNOON }
      );
    }
    expect(checkSteadyEddieBadge(completions)).toBe(false);
  });

  it('should return false for non-consecutive days', () => {
    const completions = [
      makeCompletion(2026, 7, 10, 9, TimeBucket.MORNING),
      makeCompletion(2026, 7, 9, 9, TimeBucket.MORNING),
      makeCompletion(2026, 7, 8, 9, TimeBucket.MORNING),
      // gap
      makeCompletion(2026, 7, 6, 9, TimeBucket.MORNING),
      makeCompletion(2026, 7, 5, 9, TimeBucket.MORNING),
      makeCompletion(2026, 7, 4, 9, TimeBucket.MORNING),
      makeCompletion(2026, 7, 3, 9, TimeBucket.MORNING),
    ];
    expect(checkSteadyEddieBadge(completions)).toBe(false);
  });

  it('should return false for empty completions', () => {
    expect(checkSteadyEddieBadge([])).toBe(false);
  });
});

// ==================== Dawn Patrol Badge ====================

describe('checkDawnPatrolBadge', () => {
  it('should return true for 5 consecutive days with all daily quests before 9am', () => {
    // 3 active daily quests, 3 completions before 9am each day for 5 days
    const completions: TimeBadgeCompletion[] = [];
    for (let i = 0; i < 5; i++) {
      for (let q = 0; q < 3; q++) {
        completions.push(
          makeCompletion(2026, 7, 10 - i, 6 + q, TimeBucket.EARLY_MORNING)
        );
      }
    }
    expect(checkDawnPatrolBadge(completions, 3)).toBe(true);
  });

  it('should return false when not all quests completed before 9am on a day', () => {
    const completions: TimeBadgeCompletion[] = [];
    for (let i = 0; i < 5; i++) {
      // Only 2 out of 3 quests before 9am
      completions.push(
        makeCompletion(2026, 7, 10 - i, 6, TimeBucket.EARLY_MORNING),
        makeCompletion(2026, 7, 10 - i, 7, TimeBucket.MORNING)
      );
    }
    expect(checkDawnPatrolBadge(completions, 3)).toBe(false);
  });

  it('should return false when a quest is completed at 9am or later', () => {
    const completions: TimeBadgeCompletion[] = [];
    for (let i = 0; i < 5; i++) {
      completions.push(
        makeCompletion(2026, 7, 10 - i, 7, TimeBucket.MORNING),
        // This one is at 9am -- not before 9am
        makeCompletion(2026, 7, 10 - i, 9, TimeBucket.MORNING)
      );
    }
    expect(checkDawnPatrolBadge(completions, 2)).toBe(false);
  });

  it('should return false for 4 consecutive days (below threshold)', () => {
    const completions: TimeBadgeCompletion[] = [];
    for (let i = 0; i < 4; i++) {
      completions.push(
        makeCompletion(2026, 7, 10 - i, 6, TimeBucket.EARLY_MORNING),
        makeCompletion(2026, 7, 10 - i, 7, TimeBucket.MORNING)
      );
    }
    expect(checkDawnPatrolBadge(completions, 2)).toBe(false);
  });

  it('should return false when activeDailyQuestCount is 0', () => {
    const completions = makeConsecutiveDays(5, TimeBucket.EARLY_MORNING, 5);
    expect(checkDawnPatrolBadge(completions, 0)).toBe(false);
  });

  it('should return false for empty completions', () => {
    expect(checkDawnPatrolBadge([], 3)).toBe(false);
  });

  it('should handle non-consecutive days correctly', () => {
    const completions: TimeBadgeCompletion[] = [];
    // 3 consecutive days, gap, then 3 more
    for (const day of [10, 9, 8, 5, 4, 3]) {
      completions.push(
        makeCompletion(2026, 7, day, 6, TimeBucket.EARLY_MORNING)
      );
    }
    expect(checkDawnPatrolBadge(completions, 1)).toBe(false);
  });

  it('should use completedAt hour, not timeBucket, for the 9am cutoff', () => {
    // Completions at 8am tagged as MORNING bucket -- should still count as before 9am
    const completions: TimeBadgeCompletion[] = [];
    for (let i = 0; i < 5; i++) {
      completions.push(
        makeCompletion(2026, 7, 10 - i, 8, TimeBucket.MORNING)
      );
    }
    expect(checkDawnPatrolBadge(completions, 1)).toBe(true);
  });
});
