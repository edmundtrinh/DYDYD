// ============================================
// DYDYD - Health Service
// ============================================

import { Platform } from 'react-native';
import { HealthData, HealthDataSource, HealthDataType, HealthSyncResult } from '@dydyd/shared';
import { apiClient } from '../api/client';

// Platform-specific imports will be handled by native modules
// These are placeholders for the actual implementations

interface HealthPermissionsResult {
  steps: boolean;
  sleep: boolean;
  water: boolean;
  workout: boolean;
  heartRate: boolean;
  mindfulness: boolean;
  source?: HealthDataSource;
}

interface HealthInitResult {
  availableSources: HealthDataSource[];
  connectedSources: HealthDataSource[];
  permissions: HealthPermissionsResult;
}

class HealthService {
  private isInitialized: boolean = false;
  private currentSource: HealthDataSource = HealthDataSource.MANUAL;

  async initialize(): Promise<HealthInitResult> {
    const availableSources: HealthDataSource[] = [HealthDataSource.MANUAL];
    const connectedSources: HealthDataSource[] = [];
    const permissions: HealthPermissionsResult = {
      steps: false,
      sleep: false,
      water: false,
      workout: false,
      heartRate: false,
      mindfulness: false,
    };

    if (Platform.OS === 'ios') {
      // Check if HealthKit is available
      try {
        const AppleHealthKit = require('react-native-health').default;
        const isAvailable = await new Promise<boolean>((resolve) => {
          AppleHealthKit.isAvailable((error: any, available: boolean) => {
            resolve(!error && available);
          });
        });

        if (isAvailable) {
          availableSources.push(HealthDataSource.APPLE_HEALTH);
          this.currentSource = HealthDataSource.APPLE_HEALTH;
        }
      } catch (error) {
        console.log('HealthKit not available:', error);
      }
    } else if (Platform.OS === 'android') {
      // Check if Google Fit is available
      try {
        const GoogleFit = require('react-native-google-fit').default;
        const isAvailable = await GoogleFit.checkIsAuthorized();
        
        if (isAvailable) {
          availableSources.push(HealthDataSource.GOOGLE_FIT);
          this.currentSource = HealthDataSource.GOOGLE_FIT;
        }
      } catch (error) {
        console.log('Google Fit not available:', error);
      }
    }

    this.isInitialized = true;

    return {
      availableSources,
      connectedSources,
      permissions,
    };
  }

  async requestPermissions(dataTypes: HealthDataType[]): Promise<HealthPermissionsResult> {
    const permissions: HealthPermissionsResult = {
      steps: false,
      sleep: false,
      water: false,
      workout: false,
      heartRate: false,
      mindfulness: false,
      source: this.currentSource,
    };

    if (Platform.OS === 'ios') {
      try {
        const AppleHealthKit = require('react-native-health').default;
        
        // Map data types to HealthKit permissions
        const healthKitPermissions = {
          permissions: {
            read: this.mapToHealthKitTypes(dataTypes),
            write: [],
          },
        };

        await new Promise<void>((resolve, reject) => {
          AppleHealthKit.initHealthKit(healthKitPermissions, (error: any) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });

        // Mark permissions as granted (HealthKit doesn't provide granular status)
        dataTypes.forEach((type) => {
          const key = this.mapDataTypeToPermissionKey(type);
          if (key) {
            permissions[key] = true;
          }
        });
      } catch (error) {
        console.error('Failed to request HealthKit permissions:', error);
      }
    } else if (Platform.OS === 'android') {
      try {
        const GoogleFit = require('react-native-google-fit').default;
        
        const options = {
          scopes: this.mapToGoogleFitScopes(dataTypes),
        };

        const authResult = await GoogleFit.authorize(options);
        
        if (authResult.success) {
          dataTypes.forEach((type) => {
            const key = this.mapDataTypeToPermissionKey(type);
            if (key) {
              permissions[key] = true;
            }
          });
        }
      } catch (error) {
        console.error('Failed to request Google Fit permissions:', error);
      }
    }

    return permissions;
  }

  async syncTodayData(): Promise<HealthSyncResult> {
    const dataPoints: HealthData[] = [];
    const questsAutoCompleted: string[] = [];
    let xpEarned = 0;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Fetch each data type
    const dataTypes: HealthDataType[] = [
      'steps',
      'sleep_hours',
      'water_cups',
      'workout_minutes',
      'mindful_minutes',
    ];

    for (const type of dataTypes) {
      try {
        const data = await this.fetchData(type, startOfDay, endOfDay);
        if (data) {
          dataPoints.push(data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${type}:`, error);
      }
    }

    if (dataPoints.length > 0) {
      try {
        const syncResult = await this.syncToBackend(dataPoints);
        return {
          success: true,
          dataPoints,
          questsAutoCompleted: syncResult.questsAutoCompleted || [],
          xpEarned: syncResult.xpEarned || 0,
        };
      } catch {
        // Backend sync failed but local data is still valid
      }
    }

    return {
      success: true,
      dataPoints,
      questsAutoCompleted,
      xpEarned,
    };
  }

  async syncToBackend(
    dataPoints: HealthData[],
  ): Promise<{ questsAutoCompleted: string[]; xpEarned: number }> {
    const metrics = dataPoints.map((dp) => ({
      type: dp.type,
      value: dp.value,
      source: dp.source,
      timestamp: dp.timestamp,
    }));

    return apiClient.post('/health/sync', { metrics });
  }

  async fetchData(
    dataType: HealthDataType,
    startDate: Date,
    endDate: Date
  ): Promise<HealthData | null> {
    if (Platform.OS === 'ios') {
      return this.fetchFromHealthKit(dataType, startDate, endDate);
    } else if (Platform.OS === 'android') {
      return this.fetchFromGoogleFit(dataType, startDate, endDate);
    }
    return null;
  }

  private async fetchFromHealthKit(
    dataType: HealthDataType,
    startDate: Date,
    endDate: Date
  ): Promise<HealthData | null> {
    try {
      const AppleHealthKit = require('react-native-health').default;
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      switch (dataType) {
        case 'steps':
          return new Promise((resolve) => {
            AppleHealthKit.getStepCount(options, (error: any, result: any) => {
              if (error || !result) {
                resolve(null);
              } else {
                resolve({
                  type: 'steps',
                  value: result.value || 0,
                  unit: 'steps',
                  source: HealthDataSource.APPLE_HEALTH,
                  timestamp: new Date(),
                  startDate,
                  endDate,
                });
              }
            });
          });

        case 'sleep_hours':
          return new Promise((resolve) => {
            AppleHealthKit.getSleepSamples(options, (error: any, result: any) => {
              if (error || !result) {
                resolve(null);
              } else {
                // Calculate total sleep hours
                const totalMinutes = result.reduce((acc: number, sample: any) => {
                  const start = new Date(sample.startDate);
                  const end = new Date(sample.endDate);
                  return acc + (end.getTime() - start.getTime()) / 60000;
                }, 0);
                
                resolve({
                  type: 'sleep_hours',
                  value: Math.round(totalMinutes / 60 * 10) / 10,
                  unit: 'hours',
                  source: HealthDataSource.APPLE_HEALTH,
                  timestamp: new Date(),
                  startDate,
                  endDate,
                });
              }
            });
          });

        case 'workout_minutes':
          return new Promise((resolve) => {
            AppleHealthKit.getActiveEnergyBurned(options, (error: any, result: any) => {
              if (error || !result) {
                resolve(null);
              } else {
                resolve({
                  type: 'workout_minutes',
                  value: result.length || 0,
                  unit: 'minutes',
                  source: HealthDataSource.APPLE_HEALTH,
                  timestamp: new Date(),
                  startDate,
                  endDate,
                });
              }
            });
          });

        default:
          return null;
      }
    } catch (error) {
      console.error('HealthKit fetch error:', error);
      return null;
    }
  }

  private async fetchFromGoogleFit(
    dataType: HealthDataType,
    startDate: Date,
    endDate: Date
  ): Promise<HealthData | null> {
    try {
      const GoogleFit = require('react-native-google-fit').default;
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      switch (dataType) {
        case 'steps':
          const stepsResult = await GoogleFit.getDailyStepCountSamples(options);
          const steps = stepsResult?.[0]?.steps?.[0]?.value || 0;
          return {
            type: 'steps',
            value: steps,
            unit: 'steps',
            source: HealthDataSource.GOOGLE_FIT,
            timestamp: new Date(),
            startDate,
            endDate,
          };

        case 'sleep_hours':
          const sleepResult = await GoogleFit.getSleepSamples(options);
          const sleepMinutes = sleepResult?.reduce((acc: number, sample: any) => {
            return acc + (sample.endDate - sample.startDate) / 60000;
          }, 0) || 0;
          return {
            type: 'sleep_hours',
            value: Math.round(sleepMinutes / 60 * 10) / 10,
            unit: 'hours',
            source: HealthDataSource.GOOGLE_FIT,
            timestamp: new Date(),
            startDate,
            endDate,
          };

        default:
          return null;
      }
    } catch (error) {
      console.error('Google Fit fetch error:', error);
      return null;
    }
  }

  private mapToHealthKitTypes(dataTypes: HealthDataType[]): string[] {
    const mapping: Record<HealthDataType, string> = {
      steps: 'StepCount',
      distance: 'DistanceWalkingRunning',
      active_calories: 'ActiveEnergyBurned',
      sleep_hours: 'SleepAnalysis',
      water_cups: 'DietaryWater',
      workout_minutes: 'AppleExerciseTime',
      heart_rate: 'HeartRate',
      mindful_minutes: 'MindfulSession',
      stand_hours: 'AppleStandHour',
    };

    return dataTypes.map((type) => mapping[type]).filter(Boolean);
  }

  private mapToGoogleFitScopes(dataTypes: HealthDataType[]): string[] {
    const scopes: string[] = [];
    
    if (dataTypes.includes('steps') || dataTypes.includes('distance')) {
      scopes.push('https://www.googleapis.com/auth/fitness.activity.read');
    }
    if (dataTypes.includes('sleep_hours')) {
      scopes.push('https://www.googleapis.com/auth/fitness.sleep.read');
    }
    if (dataTypes.includes('heart_rate')) {
      scopes.push('https://www.googleapis.com/auth/fitness.heart_rate.read');
    }
    if (dataTypes.includes('workout_minutes')) {
      scopes.push('https://www.googleapis.com/auth/fitness.activity.read');
    }

    return scopes;
  }

  private mapDataTypeToPermissionKey(
    dataType: HealthDataType
  ): Exclude<keyof HealthPermissionsResult, 'source'> | null {
    const mapping: Record<HealthDataType, Exclude<keyof HealthPermissionsResult, 'source'> | null> = {
      steps: 'steps',
      distance: 'steps',
      active_calories: 'workout',
      sleep_hours: 'sleep',
      water_cups: 'water',
      workout_minutes: 'workout',
      heart_rate: 'heartRate',
      mindful_minutes: 'mindfulness',
      stand_hours: 'steps',
    };

    return mapping[dataType] || null;
  }
}

export const healthService = new HealthService();
