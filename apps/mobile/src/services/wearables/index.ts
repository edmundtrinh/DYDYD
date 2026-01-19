// ============================================
// DYDYD - Unified Wearables Manager
// ============================================
// Coordinates all wearable device services

import { Platform } from 'react-native';
import { UserQuest } from '@dydyd/shared';
import { watchConnectivityService, WatchMessageType, WatchMessage } from './watchConnectivityService';
import { garminConnectService, GarminDevice } from './garminConnectService';
import { samsungWearablesService, SamsungDevice } from './samsungWearablesService';

export enum WearablePlatform {
  APPLE_WATCH = 'apple_watch',
  WEAR_OS = 'wear_os',
  GARMIN = 'garmin',
  SAMSUNG_TIZEN = 'samsung_tizen',
  SAMSUNG_WEAROS = 'samsung_wearos',
}

export interface ConnectedWearable {
  id: string;
  name: string;
  platform: WearablePlatform;
  isConnected: boolean;
  batteryLevel?: number;
}

export interface WearableSyncStatus {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  error?: string;
}

export type QuestCompletionCallback = (questId: string, value?: number) => void;

class WearablesManager {
  private isInitialized: boolean = false;
  private connectedWearables: ConnectedWearable[] = [];
  private syncStatus: WearableSyncStatus = {
    lastSyncTime: null,
    isSyncing: false,
  };
  private questCompletionCallbacks: QuestCompletionCallback[] = [];

  async initialize(): Promise<ConnectedWearable[]> {
    if (this.isInitialized) {
      return this.connectedWearables;
    }

    this.connectedWearables = [];

    // Initialize Apple Watch (iOS only)
    if (Platform.OS === 'ios') {
      const watchState = await watchConnectivityService.initialize();
      if (watchState.isPaired && watchState.isWatchAppInstalled) {
        this.connectedWearables.push({
          id: 'apple_watch',
          name: 'Apple Watch',
          platform: WearablePlatform.APPLE_WATCH,
          isConnected: watchState.isReachable,
        });
      }

      // Listen for quest completions from Apple Watch
      watchConnectivityService.onMessage(this.handleWatchMessage.bind(this));
    }

    // Initialize Wear OS / Google Pixel Watch (Android)
    if (Platform.OS === 'android') {
      const wearOSState = await watchConnectivityService.initialize();
      if (wearOSState.isPaired) {
        this.connectedWearables.push({
          id: 'wear_os',
          name: 'Wear OS Watch',
          platform: WearablePlatform.WEAR_OS,
          isConnected: wearOSState.isReachable,
        });
      }

      watchConnectivityService.onMessage(this.handleWatchMessage.bind(this));
    }

    // Initialize Garmin (both platforms)
    const garminDevices = await garminConnectService.initialize();
    garminDevices.forEach((device: GarminDevice) => {
      this.connectedWearables.push({
        id: `garmin_${device.id}`,
        name: device.name,
        platform: WearablePlatform.GARMIN,
        isConnected: device.isConnected,
      });
    });

    // Initialize Samsung (Android only)
    if (Platform.OS === 'android') {
      const samsungDevices = await samsungWearablesService.initialize();
      samsungDevices.forEach((device: SamsungDevice) => {
        this.connectedWearables.push({
          id: `samsung_${device.id}`,
          name: device.name,
          platform: device.platform === 'wearos' 
            ? WearablePlatform.SAMSUNG_WEAROS 
            : WearablePlatform.SAMSUNG_TIZEN,
          isConnected: device.isConnected,
        });
      });
    }

    this.isInitialized = true;
    return this.connectedWearables;
  }

  private handleWatchMessage(message: WatchMessage): void {
    if (message.type === WatchMessageType.QUEST_COMPLETED) {
      const { questId, value } = message.payload;
      this.questCompletionCallbacks.forEach(callback => {
        callback(questId, value);
      });
    }
  }

  // Subscribe to quest completion events from wearables
  onQuestCompleted(callback: QuestCompletionCallback): () => void {
    this.questCompletionCallbacks.push(callback);
    return () => {
      this.questCompletionCallbacks = this.questCompletionCallbacks.filter(
        cb => cb !== callback
      );
    };
  }

  // Sync quests to all connected wearables
  async syncQuests(quests: UserQuest[]): Promise<void> {
    this.syncStatus.isSyncing = true;

    try {
      const syncPromises: Promise<any>[] = [];

      // Sync to Apple Watch / Wear OS
      if (this.hasConnectedPlatform(WearablePlatform.APPLE_WATCH) ||
          this.hasConnectedPlatform(WearablePlatform.WEAR_OS)) {
        syncPromises.push(watchConnectivityService.syncQuests(quests));
      }

      // Sync to Garmin
      if (this.hasConnectedPlatform(WearablePlatform.GARMIN)) {
        syncPromises.push(garminConnectService.syncQuests(quests));
      }

      // Sync to Samsung
      if (this.hasConnectedPlatform(WearablePlatform.SAMSUNG_WEAROS) ||
          this.hasConnectedPlatform(WearablePlatform.SAMSUNG_TIZEN)) {
        syncPromises.push(samsungWearablesService.syncQuests(quests));
      }

      await Promise.all(syncPromises);
      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.error = undefined;
    } catch (error: any) {
      this.syncStatus.error = error.message;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // Sync progress to all connected wearables
  async syncProgress(progress: {
    todayXP: number;
    totalXP: number;
    level: number;
    completedCount: number;
    totalCount: number;
    currentStreak: number;
  }): Promise<void> {
    const syncPromises: Promise<any>[] = [];

    // Apple Watch / Wear OS
    if (this.hasConnectedPlatform(WearablePlatform.APPLE_WATCH) ||
        this.hasConnectedPlatform(WearablePlatform.WEAR_OS)) {
      syncPromises.push(watchConnectivityService.syncProgress({
        todayXP: progress.todayXP,
        totalXP: progress.totalXP,
        level: progress.level,
        completedCount: progress.completedCount,
        totalCount: progress.totalCount,
      }));
    }

    // Garmin
    if (this.hasConnectedPlatform(WearablePlatform.GARMIN)) {
      syncPromises.push(garminConnectService.syncProgress({
        xp: progress.todayXP,
        level: progress.level,
        done: progress.completedCount,
        total: progress.totalCount,
      }));
    }

    // Samsung
    if (this.hasConnectedPlatform(WearablePlatform.SAMSUNG_WEAROS) ||
        this.hasConnectedPlatform(WearablePlatform.SAMSUNG_TIZEN)) {
      syncPromises.push(samsungWearablesService.syncProgress({
        todayXP: progress.todayXP,
        level: progress.level,
        completed: progress.completedCount,
        total: progress.totalCount,
      }));
    }

    await Promise.allSettled(syncPromises);
  }

  // Update complications/tiles on all wearables
  async updateComplications(data: {
    todayXP: number;
    questsRemaining: number;
    currentStreak: number;
  }): Promise<void> {
    const updatePromises: Promise<any>[] = [];

    if (this.hasConnectedPlatform(WearablePlatform.APPLE_WATCH) ||
        this.hasConnectedPlatform(WearablePlatform.WEAR_OS)) {
      updatePromises.push(watchConnectivityService.updateComplications(data));
    }

    if (this.hasConnectedPlatform(WearablePlatform.SAMSUNG_WEAROS) ||
        this.hasConnectedPlatform(WearablePlatform.SAMSUNG_TIZEN)) {
      updatePromises.push(samsungWearablesService.updateTile({
        xp: data.todayXP,
        remaining: data.questsRemaining,
        streak: data.currentStreak,
      }));
    }

    await Promise.allSettled(updatePromises);
  }

  private hasConnectedPlatform(platform: WearablePlatform): boolean {
    return this.connectedWearables.some(
      w => w.platform === platform && w.isConnected
    );
  }

  getConnectedWearables(): ConnectedWearable[] {
    return this.connectedWearables;
  }

  getSyncStatus(): WearableSyncStatus {
    return this.syncStatus;
  }

  hasAnyConnectedWearable(): boolean {
    return this.connectedWearables.some(w => w.isConnected);
  }

  cleanup(): void {
    watchConnectivityService.cleanup();
    garminConnectService.cleanup();
    samsungWearablesService.cleanup();
    this.isInitialized = false;
    this.connectedWearables = [];
    this.questCompletionCallbacks = [];
  }
}

export const wearablesManager = new WearablesManager();
