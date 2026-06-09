import { Platform } from 'react-native';
import { healthService } from '../healthService';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('react-native-health', () => ({
  default: {
    isAvailable: jest.fn((_err: any, cb: any) => cb(null, false)),
    initHealthKit: jest.fn((_opts: any, cb: any) => cb(null)),
    getStepCount: jest.fn((_opts: any, cb: any) => cb(null, { value: 0 })),
    getSleepSamples: jest.fn((_opts: any, cb: any) => cb(null, [])),
    getActiveEnergyBurned: jest.fn((_opts: any, cb: any) => cb(null, [])),
  },
}), { virtual: true });

jest.mock('react-native-google-fit', () => ({
  default: {
    checkIsAuthorized: jest.fn().mockResolvedValue(false),
    authorize: jest.fn().mockResolvedValue({ success: false }),
    getDailyStepCountSamples: jest.fn().mockResolvedValue([]),
    getSleepSamples: jest.fn().mockResolvedValue([]),
  },
}), { virtual: true });

describe('HealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('returns manual source as always available', async () => {
      const result = await healthService.initialize();
      expect(result.availableSources).toContain('manual');
    });

    it('initializes with default permissions all false', async () => {
      const result = await healthService.initialize();
      expect(result.permissions.steps).toBe(false);
      expect(result.permissions.sleep).toBe(false);
      expect(result.permissions.water).toBe(false);
    });
  });

  describe('syncToBackend', () => {
    it('sends metrics to backend health sync endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({
        questsAutoCompleted: ['q1'],
        xpEarned: 25,
      });

      const dataPoints = [
        {
          type: 'steps' as const,
          value: 10000,
          unit: 'steps',
          source: 'apple_health' as const,
          timestamp: new Date(),
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const result = await healthService.syncToBackend(dataPoints);

      expect(apiClient.post).toHaveBeenCalledWith('/health/sync', {
        metrics: expect.arrayContaining([
          expect.objectContaining({ type: 'steps', value: 10000 }),
        ]),
      });
      expect(result.questsAutoCompleted).toEqual(['q1']);
      expect(result.xpEarned).toBe(25);
    });
  });

  describe('syncTodayData', () => {
    it('returns success with data points', async () => {
      const result = await healthService.syncTodayData();
      expect(result.success).toBe(true);
      expect(result.dataPoints).toBeDefined();
    });
  });

  describe('fetchData', () => {
    it('returns null for web platform', async () => {
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });

      const result = await healthService.fetchData('steps', new Date(), new Date());
      expect(result).toBeNull();

      Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
    });

    it('fetches steps data on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

      const result = await healthService.fetchData('steps', new Date(), new Date());
      expect(result).toBeDefined();
      if (result) {
        expect(result.type).toBe('steps');
        expect(result.source).toBe('apple_health');
      }
    });
  });
});
