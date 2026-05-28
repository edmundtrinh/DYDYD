import { Notification } from '@dydyd/shared';

class NotificationsService {
  async requestPermission(): Promise<{ granted: boolean; token: string | null }> {
    return { granted: false, token: null };
  }

  async registerToken(token: string): Promise<void> {}

  async getNotifications(): Promise<Notification[]> {
    return [];
  }

  async scheduleReminder(questId: string, time: string, questName: string): Promise<void> {}

  async cancelReminder(questId: string): Promise<void> {}
}

export const notificationsService = new NotificationsService();
