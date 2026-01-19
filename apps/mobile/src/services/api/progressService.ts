// ============================================
// DYDYD - Progress Service
// ============================================

import {
  DailyProgress,
  WeeklyProgress,
  UserStats,
  UserBadge,
  LeaderboardEntry,
} from '@dydyd/shared';
import { apiClient } from './client';

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank: number;
}

export const progressService = {
  async getUserStats(): Promise<UserStats> {
    return apiClient.get<UserStats>('/progress/stats');
  },

  async getDailyProgress(days: number = 7): Promise<DailyProgress[]> {
    return apiClient.get<DailyProgress[]>('/progress/daily', {
      params: { days },
    });
  },

  async getWeeklyProgress(weeks: number = 4): Promise<WeeklyProgress[]> {
    return apiClient.get<WeeklyProgress[]>('/progress/weekly', {
      params: { weeks },
    });
  },

  async getEarnedBadges(): Promise<UserBadge[]> {
    return apiClient.get<UserBadge[]>('/progress/badges');
  },

  async getAvailableBadges(): Promise<UserBadge[]> {
    return apiClient.get<UserBadge[]>('/progress/badges/available');
  },

  async getLeaderboard(
    type: 'weekly' | 'allTime' = 'weekly'
  ): Promise<LeaderboardResponse> {
    return apiClient.get<LeaderboardResponse>('/progress/leaderboard', {
      params: { type },
    });
  },

  async getStreaks(): Promise<Array<{ questId: string; streak: number }>> {
    return apiClient.get('/progress/streaks');
  },
};
