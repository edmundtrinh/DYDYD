import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import {
  requestNotificationPermission,
  registerPushToken,
  addNotification,
  selectHasNotificationPermission,
} from '../store/slices/notificationsSlice';
import { selectUserSettings } from '../store/slices/userSlice';
import { notificationsService } from '../services/notifications/notificationsService';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasPermission = useAppSelector(selectHasNotificationPermission);
  const settings = useAppSelector(selectUserSettings);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!settings?.notificationsEnabled) return;

    const init = async () => {
      const result = await dispatch(requestNotificationPermission()).unwrap();

      if (result.granted && result.token) {
        await dispatch(registerPushToken(result.token));
      }
    };

    init();
  }, [isAuthenticated, settings?.notificationsEnabled, dispatch]);

  useEffect(() => {
    if (!hasPermission) return;

    cleanupRef.current = notificationsService.setupNotificationHandlers(
      (notification) => {
        const data = notification.request?.content?.data;
        if (data) {
          dispatch(
            addNotification({
              id: notification.request.identifier,
              type: data.type || 'general',
              title: notification.request.content.title || '',
              body: notification.request.content.body || '',
              data,
              createdAt: new Date().toISOString(),
              readAt: null,
            } as any),
          );
        }
      },
      (_response) => {
        // Navigation handling would go here
        // const data = response.notification.request.content.data;
        // Navigate based on data.type
      },
    );

    return () => {
      cleanupRef.current?.();
    };
  }, [hasPermission, dispatch]);
};
