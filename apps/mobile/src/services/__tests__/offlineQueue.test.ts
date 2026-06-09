import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineQueue } from '../offlineQueue';

describe('OfflineQueue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await offlineQueue.clear();
  });

  it('starts with empty queue', () => {
    expect(offlineQueue.getQueueLength()).toBe(0);
    expect(offlineQueue.getQueue()).toEqual([]);
  });

  it('enqueues an action', async () => {
    await offlineQueue.enqueue({
      type: 'complete_quest',
      payload: { userQuestId: 'q1', value: 1 },
    });
    expect(offlineQueue.getQueueLength()).toBe(1);
    expect(offlineQueue.getQueue()[0].type).toBe('complete_quest');
  });

  it('persists queue to AsyncStorage', async () => {
    await offlineQueue.enqueue({
      type: 'complete_quest',
      payload: { userQuestId: 'q1' },
    });

    const stored = await AsyncStorage.getItem('@dydyd/offline-queue');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].payload.userQuestId).toBe('q1');
  });

  it('loads queue from AsyncStorage', async () => {
    await AsyncStorage.setItem(
      '@dydyd/offline-queue',
      JSON.stringify([
        { id: '1', type: 'complete_quest', payload: { userQuestId: 'q1' }, timestamp: '2026-06-09', retryCount: 0 },
        { id: '2', type: 'complete_quest', payload: { userQuestId: 'q2' }, timestamp: '2026-06-09', retryCount: 0 },
      ]),
    );

    await offlineQueue.load();
    expect(offlineQueue.getQueueLength()).toBe(2);
  });

  it('flushes queue with successful executor', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q2' } });

    const executor = jest.fn().mockResolvedValue(true);
    const result = await offlineQueue.flush(executor);

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(offlineQueue.getQueueLength()).toBe(0);
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('retries failed actions up to 3 times', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });

    const executor = jest.fn().mockResolvedValue(false);

    await offlineQueue.flush(executor);
    expect(offlineQueue.getQueueLength()).toBe(1);

    await offlineQueue.flush(executor);
    expect(offlineQueue.getQueueLength()).toBe(1);

    await offlineQueue.flush(executor);
    expect(offlineQueue.getQueueLength()).toBe(0);
  });

  it('reports failed actions after max retries', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });

    const executor = jest.fn().mockResolvedValue(false);
    await offlineQueue.flush(executor);
    await offlineQueue.flush(executor);
    const result = await offlineQueue.flush(executor);

    expect(result.failed).toBe(1);
  });

  it('calls onProgress callback during flush', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q2' } });

    const onProgress = jest.fn();
    await offlineQueue.flush(jest.fn().mockResolvedValue(true), onProgress);

    expect(onProgress).toHaveBeenCalledWith(1, 2);
    expect(onProgress).toHaveBeenCalledWith(2, 2);
  });

  it('handles executor throwing errors', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });

    const executor = jest.fn().mockRejectedValue(new Error('Network error'));
    const result = await offlineQueue.flush(executor);

    expect(result.synced).toBe(0);
    expect(offlineQueue.getQueueLength()).toBe(1);
  });

  it('returns early if already syncing', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });

    const slowExecutor = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100)),
    );

    const flush1 = offlineQueue.flush(slowExecutor);
    const result2 = await offlineQueue.flush(slowExecutor);

    expect(result2.synced).toBe(0);
    await flush1;
  });

  it('clears the queue', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });
    expect(offlineQueue.getQueueLength()).toBe(1);

    await offlineQueue.clear();
    expect(offlineQueue.getQueueLength()).toBe(0);

    const stored = await AsyncStorage.getItem('@dydyd/offline-queue');
    expect(JSON.parse(stored!)).toEqual([]);
  });

  it('generates unique IDs for each action', async () => {
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q1' } });
    await offlineQueue.enqueue({ type: 'complete_quest', payload: { userQuestId: 'q2' } });

    const queue = offlineQueue.getQueue();
    expect(queue[0].id).not.toBe(queue[1].id);
  });
});
