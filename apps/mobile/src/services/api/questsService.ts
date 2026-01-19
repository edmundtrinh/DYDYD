// ============================================
// DYDYD - Quests Service
// ============================================

import {
  Quest,
  UserQuest,
  QuestCompletion,
  CompleteQuestRequest,
} from '@dydyd/shared';
import { apiClient } from './client';

interface CompleteQuestResponse {
  completion: QuestCompletion;
  xpEarned: number;
  newStreak: number;
  totalXP: number;
  newLevel?: number;
  badgesEarned?: string[];
}

export const questsService = {
  async getQuestLibrary(): Promise<Quest[]> {
    return apiClient.get<Quest[]>('/quests/library');
  },

  async getUserQuests(): Promise<UserQuest[]> {
    return apiClient.get<UserQuest[]>('/quests/user');
  },

  async getTodayCompletions(): Promise<QuestCompletion[]> {
    return apiClient.get<QuestCompletion[]>('/quests/completions/today');
  },

  async getCompletions(params: {
    startDate: string;
    endDate: string;
    questId?: string;
  }): Promise<QuestCompletion[]> {
    return apiClient.get<QuestCompletion[]>('/quests/completions', {
      params,
    });
  },

  async completeQuest(request: CompleteQuestRequest): Promise<CompleteQuestResponse> {
    return apiClient.post<CompleteQuestResponse>(
      `/quests/${request.userQuestId}/complete`,
      {
        value: request.value,
        source: request.source,
        notes: request.notes,
        completedAt: request.completedAt,
      }
    );
  },

  async activateQuest(questId: string): Promise<UserQuest> {
    return apiClient.post<UserQuest>('/quests/activate', { questId });
  },

  async activateQuests(questIds: string[]): Promise<UserQuest[]> {
    return apiClient.post<UserQuest[]>('/quests/activate-batch', { questIds });
  },

  async deactivateQuest(userQuestId: string): Promise<void> {
    return apiClient.delete(`/quests/user/${userQuestId}`);
  },

  async updateUserQuest(
    userQuestId: string,
    data: Partial<UserQuest>
  ): Promise<UserQuest> {
    return apiClient.patch<UserQuest>(`/quests/user/${userQuestId}`, data);
  },

  async createCustomQuest(
    quest: Omit<Quest, 'id' | 'createdAt' | 'isDefault' | 'isCustom'>
  ): Promise<UserQuest> {
    return apiClient.post<UserQuest>('/quests/custom', quest);
  },

  async updateCustomQuest(
    userQuestId: string,
    quest: Partial<Quest>
  ): Promise<UserQuest> {
    return apiClient.patch<UserQuest>(`/quests/custom/${userQuestId}`, quest);
  },

  async deleteCustomQuest(userQuestId: string): Promise<void> {
    return apiClient.delete(`/quests/custom/${userQuestId}`);
  },

  async setQuestReminder(
    userQuestId: string,
    time: string | null
  ): Promise<UserQuest> {
    return apiClient.patch<UserQuest>(`/quests/user/${userQuestId}/reminder`, {
      reminderTime: time,
      reminderEnabled: !!time,
    });
  },
};
