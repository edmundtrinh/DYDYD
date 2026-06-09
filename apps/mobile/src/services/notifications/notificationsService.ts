import { Platform } from 'react-native';
import { Notification } from '@dydyd/shared';
import { apiClient } from '../api/client';

class NotificationsService {
  async requestPermission(): Promise<{ granted: boolean; token: string | null }> {
    try {
      const Notifications = require('expo-notifications');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { granted: false, token: null };
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return { granted: true, token: tokenData.data };
    } catch {
      return { granted: false, token: null };
    }
  }

  async registerToken(token: string): Promise<void> {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await apiClient.post('/notifications/device-token', { token, platform });
  }

  async getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications');
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`/notifications/${notificationId}/read`);
  }

  async scheduleReminder(questId: string, time: string, questName: string): Promise<void> {
    try {
      const Notifications = require('expo-notifications');
      const [hours, minutes] = time.split(':').map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Quest Reminder',
          body: `Time to complete: ${questName}`,
          data: { questId, type: 'quest_reminder' },
        },
        trigger: {
          type: 'daily',
          hour: hours,
          minute: minutes,
        },
        identifier: `reminder-${questId}`,
      });
    } catch {
      // expo-notifications not available (web or test environment)
    }
  }

  async cancelReminder(questId: string): Promise<void> {
    try {
      const Notifications = require('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(`reminder-${questId}`);
    } catch {
      // expo-notifications not available
    }
  }

  setupNotificationHandlers(
    onNotificationReceived: (notification: any) => void,
    onNotificationTapped: (response: any) => void,
  ): () => void {
    try {
      const Notifications = require('expo-notifications');

      const receivedSub = Notifications.addNotificationReceivedListener(onNotificationReceived);
      const responseSub = Notifications.addNotificationResponseReceivedListener(onNotificationTapped);

      return () => {
        receivedSub.remove();
        responseSub.remove();
      };
    } catch {
      return () => {};
    }
  }
}

export const notificationsService = new NotificationsService();
