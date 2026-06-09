// ============================================
// DYDYD - Progress Slice
// ============================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  DailyProgress,
  WeeklyProgress,
  UserStats,
  UserBadge,
  LeaderboardEntry,
} from '@dydyd/shared';
import { progressService } from '../../services/api/progressService';
import { RootState } from '../index';

interface ProgressState {
  // User statistics
  stats: UserStats | null;
  
  // Daily progress data
  dailyProgress: DailyProgress[];
  
  // Weekly progress data
  weeklyProgress: WeeklyProgress[];
  
  // Badges
  earnedBadges: UserBadge[];
  newBadgeIds: string[]; // Badges earned in current session (for animation)
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  
  // Loading states
  isLoadingStats: boolean;
  isLoadingProgress: boolean;
  isLoadingBadges: boolean;
  isLoadingLeaderboard: boolean;
  
  // Error
  error: string | null;
}

const initialState: ProgressState = {
  stats: null,
  dailyProgress: [],
  weeklyProgress: [],
  earnedBadges: [],
  newBadgeIds: [],
  leaderboard: [],
  userRank: null,
  isLoadingStats: false,
  isLoadingProgress: false,
  isLoadingBadges: false,
  isLoadingLeaderboard: false,
  error: null,
};

// Async thunks
export const fetchUserStats = createAsyncThunk(
  'progress/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await progressService.getUserStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch stats');
    }
  }
);

export const fetchDailyProgress = createAsyncThunk(
  'progress/fetchDaily',
  async (days: number = 7, { rejectWithValue }) => {
    try {
      const response = await progressService.getDailyProgress(days);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch daily progress');
    }
  }
);

export const fetchWeeklyProgress = createAsyncThunk(
  'progress/fetchWeekly',
  async (weeks: number = 4, { rejectWithValue }) => {
    try {
      const response = await progressService.getWeeklyProgress(weeks);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch weekly progress');
    }
  }
);

export const fetchEarnedBadges = createAsyncThunk(
  'progress/fetchBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await progressService.getEarnedBadges();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch badges');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'progress/fetchLeaderboard',
  async (type: 'weekly' | 'allTime' = 'weekly', { rejectWithValue }) => {
    try {
      const response = await progressService.getLeaderboard(type);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leaderboard');
    }
  }
);

export const checkBadges = createAsyncThunk(
  'progress/checkBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await progressService.checkBadges();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check badges');
    }
  }
);

// Slice
const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearNewBadges: (state) => {
      state.newBadgeIds = [];
    },
    addNewBadge: (state, action) => {
      state.newBadgeIds.push(action.payload);
    },
    // Optimistic XP update
    addXP: (state, action) => {
      if (state.stats) {
        state.stats.totalXP += action.payload;
      }
    },
    resetProgress: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch User Stats
    builder.addCase(fetchUserStats.pending, (state) => {
      state.isLoadingStats = true;
    });
    builder.addCase(fetchUserStats.fulfilled, (state, action) => {
      state.isLoadingStats = false;
      state.stats = action.payload;
    });
    builder.addCase(fetchUserStats.rejected, (state, action) => {
      state.isLoadingStats = false;
      state.error = action.payload as string;
    });

    // Fetch Daily Progress
    builder.addCase(fetchDailyProgress.pending, (state) => {
      state.isLoadingProgress = true;
    });
    builder.addCase(fetchDailyProgress.fulfilled, (state, action) => {
      state.isLoadingProgress = false;
      state.dailyProgress = action.payload;
    });
    builder.addCase(fetchDailyProgress.rejected, (state, action) => {
      state.isLoadingProgress = false;
      state.error = action.payload as string;
    });

    // Fetch Weekly Progress
    builder.addCase(fetchWeeklyProgress.fulfilled, (state, action) => {
      state.weeklyProgress = action.payload;
    });

    // Fetch Earned Badges
    builder.addCase(fetchEarnedBadges.pending, (state) => {
      state.isLoadingBadges = true;
    });
    builder.addCase(fetchEarnedBadges.fulfilled, (state, action) => {
      state.isLoadingBadges = false;
      state.earnedBadges = action.payload;
    });
    builder.addCase(fetchEarnedBadges.rejected, (state, action) => {
      state.isLoadingBadges = false;
      state.error = action.payload as string;
    });

    // Fetch Leaderboard
    builder.addCase(fetchLeaderboard.pending, (state) => {
      state.isLoadingLeaderboard = true;
    });
    builder.addCase(fetchLeaderboard.fulfilled, (state, action) => {
      state.isLoadingLeaderboard = false;
      state.leaderboard = action.payload.entries;
      state.userRank = action.payload.userRank;
    });
    builder.addCase(fetchLeaderboard.rejected, (state, action) => {
      state.isLoadingLeaderboard = false;
      state.error = action.payload as string;
    });

    // Check Badges
    builder.addCase(checkBadges.fulfilled, (state, action) => {
      const newBadges = action.payload;
      if (newBadges.length > 0) {
        const existingIds = new Set(state.earnedBadges.map((b) => b.id));
        for (const badge of newBadges) {
          if (!existingIds.has(badge.id)) {
            state.earnedBadges.push(badge);
            state.newBadgeIds.push(badge.id);
          }
        }
      }
    });
  },
});

// Selectors
export const selectUserStats = (state: RootState) => state.progress.stats;
export const selectDailyProgress = (state: RootState) => state.progress.dailyProgress;
export const selectWeeklyProgress = (state: RootState) => state.progress.weeklyProgress;
export const selectEarnedBadges = (state: RootState) => state.progress.earnedBadges;
export const selectNewBadgeIds = (state: RootState) => state.progress.newBadgeIds;
export const selectLeaderboard = (state: RootState) => state.progress.leaderboard;
export const selectUserRank = (state: RootState) => state.progress.userRank;
export const selectIsLoadingProgress = (state: RootState) =>
  state.progress.isLoadingStats || state.progress.isLoadingProgress;

export const { clearError, clearNewBadges, addNewBadge, addXP, resetProgress } =
  progressSlice.actions;
export default progressSlice.reducer;
