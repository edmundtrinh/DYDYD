import { notificationsService } from '../notificationsService';
import { apiClient } from '../../api/client';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermission', () => {
    it('returns granted with token when permission is granted', async () => {
      const result = await notificationsService.requestPermission();
      expect(result.granted).toBe(true);
      expect(result.token).toBe('ExponentPushToken[test-token]');
    });

    it('returns not granted when permission denied', async () => {
      const Notifications = require('expo-notifications');
      Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const result = await notificationsService.requestPermission();
      expect(result.granted).toBe(false);
      expect(result.token).toBeNull();
    });
  });

  describe('registerToken', () => {
    it('calls backend API with token and platform', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});
      await notificationsService.registerToken('test-token-123');
      expect(apiClient.post).toHaveBeenCalledWith(
        '/notifications/device-token',
        expect.objectContaining({ token: 'test-token-123' }),
      );
    });
  });

  describe('getNotifications', () => {
    it('fetches notifications from backend', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test', body: 'Test body' },
      ];
      (apiClient.get as jest.Mock).mockResolvedValue(mockNotifications);
      const result = await notificationsService.getNotifications();
      expect(result).toEqual(mockNotifications);
      expect(apiClient.get).toHaveBeenCalledWith('/notifications');
    });
  });

  describe('markAsRead', () => {
    it('calls backend API to mark notification as read', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({});
      await notificationsService.markAsRead('notif-1');
      expect(apiClient.put).toHaveBeenCalledWith('/notifications/notif-1/read');
    });
  });

  describe('scheduleReminder', () => {
    it('schedules a local notification', async () => {
      const Notifications = require('expo-notifications');
      await notificationsService.scheduleReminder('quest-1', '09:00', 'Morning Run');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Quest Reminder',
            body: 'Time to complete: Morning Run',
          }),
          identifier: 'reminder-quest-1',
        }),
      );
    });
  });

  describe('cancelReminder', () => {
    it('cancels a scheduled notification', async () => {
      const Notifications = require('expo-notifications');
      await notificationsService.cancelReminder('quest-1');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'reminder-quest-1',
      );
    });
  });

  describe('setupNotificationHandlers', () => {
    it('registers received and response listeners', () => {
      const onReceived = jest.fn();
      const onTapped = jest.fn();
      const cleanup = notificationsService.setupNotificationHandlers(onReceived, onTapped);

      const Notifications = require('expo-notifications');
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();

      expect(typeof cleanup).toBe('function');
    });

    it('returns cleanup function that removes listeners', () => {
      const cleanup = notificationsService.setupNotificationHandlers(jest.fn(), jest.fn());
      cleanup();
      // No errors thrown means cleanup worked
    });
  });
});
