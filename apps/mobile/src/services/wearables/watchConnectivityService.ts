// ============================================
// DYDYD - Watch Connectivity Service
// ============================================
// Handles communication between mobile app and Apple Watch
// via react-native-watch-connectivity with graceful degradation

import { UserQuest } from '@dydyd/shared';

// Minimal typed interface for the react-native-watch-connectivity native module.
// Only the methods actually used by this service are declared.
interface WatchConnectivityModule {
  getIsPaired(): Promise<boolean>;
  getIsWatchAppInstalled(): Promise<boolean>;
  getReachability(): Promise<boolean>;
  sendMessage(message: Record<string, unknown>): Promise<void>;
  updateApplicationContext(context: Record<string, unknown>): Promise<void>;
  watchEvents: {
    on(event: string, callback: (data: any) => void): () => void;
  };
}

// Conditional import — react-native-watch-connectivity is a native iOS module
// that won't be available on Android, in test environments, or during development on Windows
let watchModule: WatchConnectivityModule | null = null;
try {
  watchModule = require('react-native-watch-connectivity') as WatchConnectivityModule;
} catch {
  // Module not available — all operations will gracefully degrade
}

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
  private unsubscribeReachability: (() => void) | null = null;
  private unsubscribeMessages: (() => void) | null = null;

  async initialize(): Promise<WatchState> {
    if (this.isInitialized) {
      return this.watchState;
    }

    if (!watchModule) {
      this.isInitialized = true;
      return this.watchState;
    }

    try {
      const paired: boolean = await watchModule.getIsPaired();
      const installed: boolean = await watchModule.getIsWatchAppInstalled();
      const reachable: boolean = await watchModule.getReachability();

      this.watchState = {
        isPaired: paired,
        isReachable: reachable,
        isWatchAppInstalled: installed,
      };

      this.unsubscribeReachability = watchModule.watchEvents.on(
        'reachability',
        (reachable: boolean) => {
          this.watchState = { ...this.watchState, isReachable: reachable };
        },
      );

      this.unsubscribeMessages = watchModule.watchEvents.on(
        'message',
        (message: Record<string, any>) => {
          const watchMessage: WatchMessage = {
            type: message.type as WatchMessageType,
            payload: message.payload ?? message,
            timestamp: message.timestamp ?? Date.now(),
          };
          this.handleIncomingMessage(watchMessage);
        },
      );
    } catch (error) {
      console.log('Watch connectivity not available:', error);
    }

    this.isInitialized = true;
    return this.watchState;
  }

  private handleIncomingMessage(message: WatchMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  onMessage(handler: WatchMessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  addMessageListener(callback: WatchMessageHandler): () => void {
    return this.onMessage(callback);
  }

  removeMessageListener(): void {
    this.messageHandlers = [];
  }

  async sendMessage(type: WatchMessageType, payload: any): Promise<boolean> {
    if (!watchModule || !this.watchState.isReachable) {
      return false;
    }

    const message: WatchMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    try {
      await watchModule.sendMessage({ ...message });
      return true;
    } catch (error) {
      console.error('Failed to send message to watch:', error);
      return false;
    }
  }

  async updateApplicationContext(data: Record<string, any>): Promise<boolean> {
    if (!watchModule) {
      return false;
    }

    try {
      await watchModule.updateApplicationContext(data);
      return true;
    } catch (error) {
      console.error('Failed to update application context:', error);
      return false;
    }
  }

  async getReachability(): Promise<boolean> {
    if (!watchModule) {
      return false;
    }

    try {
      return await watchModule.getReachability();
    } catch {
      return false;
    }
  }

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

  async syncProgress(progress: {
    todayXP: number;
    totalXP: number;
    level: number;
    completedCount: number;
    totalCount: number;
  }): Promise<boolean> {
    return this.sendMessage(WatchMessageType.SYNC_PROGRESS, progress);
  }

  async updateComplications(data: {
    todayXP: number;
    questsRemaining: number;
    currentStreak: number;
  }): Promise<boolean> {
    return this.sendMessage(WatchMessageType.UPDATE_COMPLICATIONS, data);
  }

  getState(): WatchState {
    return this.watchState;
  }

  isAvailable(): boolean {
    return this.watchState.isPaired && this.watchState.isWatchAppInstalled;
  }

  cleanup(): void {
    this.unsubscribeReachability?.();
    this.unsubscribeMessages?.();
    this.unsubscribeReachability = null;
    this.unsubscribeMessages = null;
    this.messageHandlers = [];
    this.isInitialized = false;
    this.watchState = { isPaired: false, isReachable: false, isWatchAppInstalled: false };
  }
}

export const watchConnectivityService = new WatchConnectivityService();
