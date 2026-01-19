// ============================================
// DYDYD - Samsung Wearables Service
// ============================================
// Handles communication with Samsung Galaxy Watch (Wear OS & Tizen)

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { UserQuest } from '@dydyd/shared';

export interface SamsungDevice {
  id: string;
  name: string;
  model: string;
  platform: 'wearos' | 'tizen';
  isConnected: boolean;
}

export interface SamsungSyncResult {
  success: boolean;
  deviceId?: string;
  error?: string;
}

class SamsungWearablesService {
  private isInitialized: boolean = false;
  private connectedDevices: SamsungDevice[] = [];
  private eventEmitter: NativeEventEmitter | null = null;

  async initialize(): Promise<SamsungDevice[]> {
    if (this.isInitialized) {
      return this.connectedDevices;
    }

    // Samsung Galaxy Watch 4+ uses Wear OS
    // Older models (Galaxy Watch 3 and earlier) use Tizen
    if (Platform.OS === 'android') {
      await this.initializeSamsungWearOS();
    }

    this.isInitialized = true;
    return this.connectedDevices;
  }

  private async initializeSamsungWearOS(): Promise<void> {
    try {
      // Uses the same Wear OS Data Layer API but with Samsung-specific features
      const SamsungWearables = NativeModules.SamsungWearables;
      
      if (SamsungWearables) {
        this.eventEmitter = new NativeEventEmitter(SamsungWearables);
        
        this.eventEmitter.addListener('deviceConnected', (device: SamsungDevice) => {
          this.connectedDevices.push(device);
        });

        this.eventEmitter.addListener('deviceDisconnected', (deviceId: string) => {
          this.connectedDevices = this.connectedDevices.filter(d => d.id !== deviceId);
        });

        this.eventEmitter.addListener('messageReceived', (message: any) => {
          this.handleSamsungMessage(message);
        });

        await SamsungWearables.initialize();
        this.connectedDevices = await SamsungWearables.getConnectedDevices();
      }
    } catch (error) {
      console.log('Samsung Wearables not available:', error);
    }
  }

  private handleSamsungMessage(message: any): void {
    console.log('Samsung watch message received:', message);
  }

  // Sync quests to Samsung watch
  async syncQuests(quests: UserQuest[], deviceId?: string): Promise<SamsungSyncResult> {
    try {
      const SamsungWearables = NativeModules.SamsungWearables;
      if (!SamsungWearables) {
        return { success: false, error: 'Samsung Wearables not available' };
      }

      const targetDevice = deviceId 
        ? this.connectedDevices.find(d => d.id === deviceId)
        : this.connectedDevices[0];

      if (!targetDevice) {
        return { success: false, error: 'No Samsung watch connected' };
      }

      // Format data based on platform (Wear OS vs Tizen)
      const questData = quests.slice(0, 15).map(q => ({
        id: q.id,
        name: q.quest?.name || 'Quest',
        category: q.quest?.category,
        icon: this.getCategoryEmoji(q.quest?.category),
        targetValue: q.quest?.targetValue || 1,
        currentValue: q.currentValue || 0,
        isCompleted: q.completedToday,
        xpValue: q.quest?.xpValue || 0,
      }));

      if (targetDevice.platform === 'wearos') {
        await SamsungWearables.sendWearOSMessage(targetDevice.id, {
          type: 'SYNC_QUESTS',
          quests: questData,
        });
      } else {
        // Tizen uses different message format
        await SamsungWearables.sendTizenMessage(targetDevice.id, {
          msgId: 'SYNC_QUESTS',
          data: JSON.stringify(questData),
        });
      }

      return { success: true, deviceId: targetDevice.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Sync progress to Samsung watch
  async syncProgress(
    progress: { todayXP: number; level: number; completed: number; total: number },
    deviceId?: string
  ): Promise<SamsungSyncResult> {
    try {
      const SamsungWearables = NativeModules.SamsungWearables;
      if (!SamsungWearables) {
        return { success: false, error: 'Samsung Wearables not available' };
      }

      const targetDevice = deviceId 
        ? this.connectedDevices.find(d => d.id === deviceId)
        : this.connectedDevices[0];

      if (!targetDevice) {
        return { success: false, error: 'No Samsung watch connected' };
      }

      const progressData = {
        xp: progress.todayXP,
        level: progress.level,
        done: progress.completed,
        total: progress.total,
        percent: Math.round((progress.completed / Math.max(progress.total, 1)) * 100),
      };

      if (targetDevice.platform === 'wearos') {
        await SamsungWearables.sendWearOSMessage(targetDevice.id, {
          type: 'SYNC_PROGRESS',
          progress: progressData,
        });
      } else {
        await SamsungWearables.sendTizenMessage(targetDevice.id, {
          msgId: 'SYNC_PROGRESS',
          data: JSON.stringify(progressData),
        });
      }

      return { success: true, deviceId: targetDevice.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update Samsung watch tile/complication
  async updateTile(data: {
    xp: number;
    remaining: number;
    streak: number;
  }): Promise<SamsungSyncResult> {
    try {
      const SamsungWearables = NativeModules.SamsungWearables;
      if (!SamsungWearables) {
        return { success: false, error: 'Samsung Wearables not available' };
      }

      // Update all connected devices
      for (const device of this.connectedDevices) {
        await SamsungWearables.updateTile(device.id, data);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private getCategoryEmoji(category?: string): string {
    const emojiMap: Record<string, string> = {
      physical_health: '💪',
      mental_wellness: '🧘',
      career: '💼',
      relationships: '❤️',
      home_chores: '🏠',
    };
    return emojiMap[category || ''] || '✨';
  }

  getConnectedDevices(): SamsungDevice[] {
    return this.connectedDevices;
  }

  isConnected(): boolean {
    return this.connectedDevices.length > 0;
  }

  cleanup(): void {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('deviceConnected');
      this.eventEmitter.removeAllListeners('deviceDisconnected');
      this.eventEmitter.removeAllListeners('messageReceived');
    }
    this.isInitialized = false;
    this.connectedDevices = [];
  }
}

export const samsungWearablesService = new SamsungWearablesService();
