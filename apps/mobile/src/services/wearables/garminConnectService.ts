// ============================================
// DYDYD - Garmin Connect IQ Service
// ============================================
// Handles communication with Garmin wearables (Venu, Fenix, etc.)

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { UserQuest } from '@dydyd/shared';

export interface GarminDevice {
  id: string;
  name: string;
  model: string;
  isConnected: boolean;
}

export interface GarminSyncResult {
  success: boolean;
  deviceId?: string;
  error?: string;
}

class GarminConnectService {
  private isInitialized: boolean = false;
  private connectedDevices: GarminDevice[] = [];
  private eventEmitter: NativeEventEmitter | null = null;

  async initialize(): Promise<GarminDevice[]> {
    if (this.isInitialized) {
      return this.connectedDevices;
    }

    try {
      // This would use Garmin Connect IQ SDK via native module
      const GarminConnect = NativeModules.GarminConnect;
      
      if (GarminConnect) {
        this.eventEmitter = new NativeEventEmitter(GarminConnect);
        
        // Listen for device connection changes
        this.eventEmitter.addListener('deviceConnected', (device: GarminDevice) => {
          this.connectedDevices.push(device);
        });

        this.eventEmitter.addListener('deviceDisconnected', (deviceId: string) => {
          this.connectedDevices = this.connectedDevices.filter(d => d.id !== deviceId);
        });

        // Listen for messages from Garmin device
        this.eventEmitter.addListener('messageReceived', (message: any) => {
          this.handleGarminMessage(message);
        });

        // Initialize and get connected devices
        await GarminConnect.initialize();
        this.connectedDevices = await GarminConnect.getConnectedDevices();
      }
    } catch (error) {
      console.log('Garmin Connect not available:', error);
    }

    this.isInitialized = true;
    return this.connectedDevices;
  }

  private handleGarminMessage(message: any): void {
    // Handle incoming messages from Garmin device
    // This could be quest completions, sync requests, etc.
    console.log('Garmin message received:', message);
  }

  // Sync quests to Garmin device
  async syncQuests(quests: UserQuest[], deviceId?: string): Promise<GarminSyncResult> {
    try {
      const GarminConnect = NativeModules.GarminConnect;
      if (!GarminConnect) {
        return { success: false, error: 'Garmin Connect not available' };
      }

      // Garmin Connect IQ has limited data capacity, so we send minimal data
      const garminQuests = quests.slice(0, 10).map(q => ({
        id: q.id,
        name: (q.quest?.name || 'Quest').substring(0, 30), // Garmin has limited display
        icon: this.getCategoryIcon(q.quest?.category),
        target: q.quest?.targetValue || 1,
        current: (q as any).currentValue || 0,
        done: (q as any).completedToday ? 1 : 0,
        xp: q.quest?.baseXP || 0,
      }));

      const targetDevice = deviceId || this.connectedDevices[0]?.id;
      if (!targetDevice) {
        return { success: false, error: 'No Garmin device connected' };
      }

      await GarminConnect.sendData(targetDevice, {
        type: 'QUESTS',
        data: garminQuests,
      });

      return { success: true, deviceId: targetDevice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Sync progress summary to Garmin
  async syncProgress(
    progress: { xp: number; level: number; done: number; total: number },
    deviceId?: string
  ): Promise<GarminSyncResult> {
    try {
      const GarminConnect = NativeModules.GarminConnect;
      if (!GarminConnect) {
        return { success: false, error: 'Garmin Connect not available' };
      }

      const targetDevice = deviceId || this.connectedDevices[0]?.id;
      if (!targetDevice) {
        return { success: false, error: 'No Garmin device connected' };
      }

      await GarminConnect.sendData(targetDevice, {
        type: 'PROGRESS',
        data: progress,
      });

      return { success: true, deviceId: targetDevice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get icon code for Garmin display
  private getCategoryIcon(category?: string): number {
    const iconMap: Record<string, number> = {
      physical_health: 1,   // Heart icon
      mental_wellness: 2,   // Mind icon
      career: 3,            // Briefcase icon
      relationships: 4,     // People icon
      home_chores: 5,       // Home icon
    };
    return iconMap[category || ''] || 0;
  }

  // Get connected devices
  getConnectedDevices(): GarminDevice[] {
    return this.connectedDevices;
  }

  // Check if any Garmin device is connected
  isConnected(): boolean {
    return this.connectedDevices.length > 0;
  }

  // Cleanup
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

export const garminConnectService = new GarminConnectService();
