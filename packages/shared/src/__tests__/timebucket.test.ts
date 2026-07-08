import { TimeBucket } from '../types';
import { getTimeBucket } from '../utils';

describe('getTimeBucket', () => {
  const makeDate = (hour: number, minute: number = 0): Date => {
    const d = new Date(2026, 6, 8); // July 8, 2026
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  it.each([
    // EARLY_MORNING: 4am - 7am
    [4, 0, TimeBucket.EARLY_MORNING, '4:00am (start of early morning)'],
    [5, 30, TimeBucket.EARLY_MORNING, '5:30am (middle of early morning)'],
    [6, 59, TimeBucket.EARLY_MORNING, '6:59am (end of early morning)'],

    // MORNING: 7am - 12pm
    [7, 0, TimeBucket.MORNING, '7:00am (start of morning)'],
    [10, 0, TimeBucket.MORNING, '10:00am (middle of morning)'],
    [11, 59, TimeBucket.MORNING, '11:59am (end of morning)'],

    // AFTERNOON: 12pm - 5pm
    [12, 0, TimeBucket.AFTERNOON, '12:00pm (start of afternoon)'],
    [14, 30, TimeBucket.AFTERNOON, '2:30pm (middle of afternoon)'],
    [16, 59, TimeBucket.AFTERNOON, '4:59pm (end of afternoon)'],

    // EVENING: 5pm - 9pm
    [17, 0, TimeBucket.EVENING, '5:00pm (start of evening)'],
    [19, 0, TimeBucket.EVENING, '7:00pm (middle of evening)'],
    [20, 59, TimeBucket.EVENING, '8:59pm (end of evening)'],

    // NIGHT: 9pm - 4am
    [21, 0, TimeBucket.NIGHT, '9:00pm (start of night)'],
    [23, 59, TimeBucket.NIGHT, '11:59pm (late night)'],
    [0, 0, TimeBucket.NIGHT, '12:00am (midnight)'],
    [3, 59, TimeBucket.NIGHT, '3:59am (end of night)'],
  ])(
    'returns correct bucket for hour=%i minute=%i (%s)',
    (hour, minute, expected, _description) => {
      expect(getTimeBucket(makeDate(hour, minute))).toBe(expected);
    }
  );

  it('defaults to current time when no argument is provided', () => {
    // Just verify it returns a valid TimeBucket value
    const result = getTimeBucket();
    expect(Object.values(TimeBucket)).toContain(result);
  });
});
