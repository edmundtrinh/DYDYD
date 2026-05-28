// ============================================
// DYDYD - Watch Connectivity Service
// ============================================
// Handles communication between mobile app and wearable devices

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { Quest, QuestCompletion, UserQuest } from '@dydyd/shared';

// Message types for watch communication
export enum WatchMessageType {
  SYNC_QUESTS = 'SYNC_QUESTS',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  SYNC_PROGRESS = 'SYNC_PROGRESS',
  REQUEST_SYNC = 'REQUEST_SYNC',
  UPDATE_COMPLICATIONS = 'UPDATE_COMPLICATIONS',
}

export interface WatchMessage {
  type: WatchMessageType;
  payload: any;
  timestamp: number;
}

export interface WatchState {
  isPaired: boolean;
  isReachable: boolean;
  isWatchAppInstalled: boolean;
}

export type WatchMessageHandler = (message: WatchMessage) => void;

class WatchConnectivityService {
  private isInitialized: boolean = false;
  private watchState: WatchState = {
    isPaired: false,
    isReachable: false,
    isWatchAppInstalled: false,
  };
  private messageHandlers: WatchMessageHandler[] = [];
  private eventEmitter: NativeEventEmitter | null = null;

  async initialize(): Promise<WatchState> {
    if (this.isInitialized) {
      return this.watchState;
    }

    if (Platform.OS === 'ios') {
      await this.initializeAppleWatch();
    } else if (Platform.OS === 'android') {
      await this.initializeWearOS();
    }

    this.isInitialized = true;
    return this.watchState;
  }

  private async initializeAppleWatch(): Promise<void> {
    try {
      // This would use a native module for WatchConnectivity
      // Placeholder for react-native-watch-connectivity or custom native module
      const WatchConnectivity = NativeModules.WatchConnectivity;
      
      if (WatchConnectivity) {
        this.eventEmitter = new NativeEventEmitter(WatchConnectivity);
        
        // Listen for watch state changes
        this.eventEmitter.addListener('watchStateChanged', (state: WatchState) => {
          this.watchState = state;
        });

        // Listen for messages from watch
        this.eventEmitter.addListener('messageReceived', (message: WatchMessage) => {
          this.handleIncomingMessage(message);
        });

        // Get initial state
        const state = await WatchConnectivity.getWatchState();
        this.watchState = state;
      }
    } catch (error) {
      console.log('Apple Watch connectivity not available:', error);
    }
  }

  private async initializeWearOS(): Promise<void> {
    try {
      // This would use Wearable Data Layer API via native module
      const WearOSConnectivity = NativeModules.WearOSConnectivity;
      
      if (WearOSConnectivity) {
        this.eventEmitter = new NativeEventEmitter(WearOSConnectivity);
        
        // Listen for connection changes
        this.eventEmitter.addListener('connectionChanged', (state: WatchState) => {
          this.watchState = state;
        });

        // Listen for messages from watch
        this.eventEmitter.addListener('messageReceived', (message: WatchMessage) => {
          this.handleIncomingMessage(message);
        });

        // Get initial state
        const state = await WearOSConnectivity.getConnectionState();
        this.watchState = state;
      }
    } catch (error) {
      console.log('Wear OS connectivity not available:', error);
    }
  }

  private handleIncomingMessage(message: WatchMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  // Subscribe to watch messages
  onMessage(handler: WatchMessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Send message to watch
  async sendMessage(type: WatchMessageType, payload: any): Promise<boolean> {
    if (!this.watchState.isReachable) {
      console.log('Watch is not reachable');
      return false;
    }

    const message: WatchMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    try {
      if (Platform.OS === 'ios') {
        const WatchConnectivity = NativeModules.WatchConnectivity;
        await WatchConnectivity?.sendMessage(message);
      } else if (Platform.OS === 'android') {
        const WearOSConnectivity = NativeModules.WearOSConnectivity;
        await WearOSConnectivity?.sendMessage(message);
      }
      return true;
    } catch (error) {
      console.error('Failed to send message to watch:', error);
      return false;
    }
  }

  // Sync quests to watch
  async syncQuests(quests: UserQuest[]): Promise<boolean> {
    const simplifiedQuests = quests.map(q => ({
      id: q.id,
      questId: q.questId,
      name: q.quest?.name || 'Quest',
      category: q.quest?.category,
      targetValue: q.quest?.targetValue || 1,
      currentValue: (q as any).currentValue || 0,
      isCompleted: (q as any).completedToday,
      xpValue: q.quest?.baseXP || 0,
    }));

    return this.sendMessage(WatchMessageType.SYNC_QUESTS, { quests: simplifiedQuests });
  }

  // Sync progress summary to watch
  async syncProgress(progress: {
    todayXP: number;
    totalXP: number;
    level: number;
    completedCount: number;
    totalCount: number;
  }): Promise<boolean> {
    return this.sendMessage(WatchMessageType.SYNC_PROGRESS, progress);
  }

  // Update watch complications
  async updateComplications(data: {
    todayXP: number;
    questsRemaining: number;
    currentStreak: number;
  }): Promise<boolean> {
    return this.sendMessage(WatchMessageType.UPDATE_COMPLICATIONS, data);
  }

  // Get current watch state
  getState(): WatchState {
    return this.watchState;
  }

  // Check if watch is available
  isAvailable(): boolean {
    return this.watchState.isPaired && this.watchState.isWatchAppInstalled;
  }

  // Cleanup
  cleanup(): void {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('watchStateChanged');
      this.eventEmitter.removeAllListeners('connectionChanged');
      this.eventEmitter.removeAllListeners('messageReceived');
    }
    this.messageHandlers = [];
    this.isInitialized = false;
  }
}

export const watchConnectivityService = new WatchConnectivityService();
