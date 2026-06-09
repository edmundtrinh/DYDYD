import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@dydyd/offline-queue';

export interface QueuedAction {
  id: string;
  type: 'complete_quest';
  payload: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

const MAX_RETRIES = 3;

class OfflineQueue {
  private queue: QueuedAction[] = [];
  private isSyncing = false;

  async load(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      this.queue = stored ? JSON.parse(stored) : [];
    } catch {
      this.queue = [];
    }
  }

  async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const item: QueuedAction = {
      ...action,
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    this.queue.push(item);
    await this.persist();
  }

  async flush(
    executor: (action: QueuedAction) => Promise<boolean>,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;
    const remaining: QueuedAction[] = [];

    for (let i = 0; i < this.queue.length; i++) {
      const action = this.queue[i];
      try {
        const success = await executor(action);
        if (success) {
          synced++;
        } else {
          action.retryCount++;
          if (action.retryCount < MAX_RETRIES) {
            remaining.push(action);
          } else {
            failed++;
          }
        }
      } catch {
        action.retryCount++;
        if (action.retryCount < MAX_RETRIES) {
          remaining.push(action);
        } else {
          failed++;
        }
      }
      onProgress?.(i + 1, this.queue.length);
    }

    this.queue = remaining;
    await this.persist();
    this.isSyncing = false;

    return { synced, failed };
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueue(): ReadonlyArray<QueuedAction> {
    return this.queue;
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // Storage full or unavailable
    }
  }
}

export const offlineQueue = new OfflineQueue();
