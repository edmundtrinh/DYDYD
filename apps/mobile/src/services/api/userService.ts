// ============================================
// DYDYD - User Service
// ============================================

import { User, UserSettings, CategoryPriority } from '@dydyd/shared';
import { apiClient } from './client';

export const userService = {
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/user/profile');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>('/user/profile', data);
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return apiClient.patch<UserSettings>('/user/settings', settings);
  },

  async updateCategoryPriorities(
    priorities: CategoryPriority[]
  ): Promise<CategoryPriority[]> {
    return apiClient.put<CategoryPriority[]>('/user/priorities', { priorities });
  },

  async uploadAvatar(file: { uri: string; type: string; name: string }): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file as any);

    return apiClient.post<string>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async deleteAccount(): Promise<void> {
    return apiClient.delete('/user/account');
  },

  async exportData(): Promise<{ downloadUrl: string }> {
    return apiClient.post('/user/export');
  },

  async completeOnboarding(): Promise<void> {
    return apiClient.post('/user/onboarding/complete');
  },

  async registerDevice(deviceInfo: {
    token: string;
    platform: string;
    deviceName?: string;
  }): Promise<void> {
    return apiClient.post('/user/devices', deviceInfo);
  },

  async unregisterDevice(token: string): Promise<void> {
    return apiClient.delete('/user/devices', { data: { token } });
  },
};
