import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setOnlineStatus, selectIsOnline, showToast } from '../store/slices/uiSlice';
import { offlineQueue } from '../services/offlineQueue';
import { questsService } from '../services/api/questsService';
import { HealthDataSource } from '@dydyd/shared';

export const useNetworkStatus = () => {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    offlineQueue.load();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      dispatch(setOnlineStatus(connected));

      if (connected && wasOfflineRef.current) {
        syncQueuedActions();
      }
      wasOfflineRef.current = !connected;
    });

    return () => unsubscribe();
  }, [dispatch]);

  const syncQueuedActions = async () => {
    const queueLength = offlineQueue.getQueueLength();
    if (queueLength === 0) return;

    dispatch(showToast({
      type: 'info',
      title: 'Syncing...',
      message: `${queueLength} queued action${queueLength > 1 ? 's' : ''}`,
      duration: 2000,
    }));

    const result = await offlineQueue.flush(async (action) => {
      if (action.type === 'complete_quest') {
        try {
          await questsService.completeQuest({
            userQuestId: action.payload.userQuestId as string,
            value: (action.payload.value as number) ?? 1,
            source: (action.payload.source as HealthDataSource) ?? HealthDataSource.MANUAL,
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    });

    if (result.synced > 0) {
      dispatch(showToast({
        type: 'success',
        title: 'Synced!',
        message: `${result.synced} action${result.synced > 1 ? 's' : ''} synced successfully`,
      }));
    }
    if (result.failed > 0) {
      dispatch(showToast({
        type: 'error',
        title: 'Sync failed',
        message: `${result.failed} action${result.failed > 1 ? 's' : ''} could not be synced`,
      }));
    }
  };

  return { isOnline };
};
