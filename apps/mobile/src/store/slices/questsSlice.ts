// ============================================
// DYDYD - Quests Slice
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Quest,
  UserQuest,
  QuestCompletion,
  QuestCategory,
  QuestFrequency,
  CompleteQuestRequest,
  HealthDataSource,
} from '@dydyd/shared';
import { questsService } from '../../services/api/questsService';
import { RootState } from '../index';

interface QuestsState {
  // Quest library (predefined quests)
  questLibrary: Quest[];
  
  // User's active quests
  userQuests: UserQuest[];
  
  // Today's completions
  todayCompletions: QuestCompletion[];
  
  // Loading states
  isLoadingLibrary: boolean;
  isLoadingUserQuests: boolean;
  isCompleting: Record<string, boolean>; // questId -> loading
  
  // Error state
  error: string | null;
  
  // Last sync timestamp
  lastSyncAt: string | null;
}

const initialState: QuestsState = {
  questLibrary: [],
  userQuests: [],
  todayCompletions: [],
  isLoadingLibrary: false,
  isLoadingUserQuests: false,
  isCompleting: {},
  error: null,
  lastSyncAt: null,
};

// Async thunks
export const fetchQuestLibrary = createAsyncThunk(
  'quests/fetchLibrary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questsService.getQuestLibrary();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch quest library');
    }
  }
);

export const fetchUserQuests = createAsyncThunk(
  'quests/fetchUserQuests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questsService.getUserQuests();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user quests');
    }
  }
);

export const fetchTodayCompletions = createAsyncThunk(
  'quests/fetchTodayCompletions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questsService.getTodayCompletions();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch completions');
    }
  }
);

export const completeQuest = createAsyncThunk(
  'quests/complete',
  async (request: CompleteQuestRequest, { rejectWithValue }) => {
    try {
      const response = await questsService.completeQuest(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete quest');
    }
  }
);

export const activateQuest = createAsyncThunk(
  'quests/activate',
  async (questId: string, { rejectWithValue }) => {
    try {
      const response = await questsService.activateQuest(questId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to activate quest');
    }
  }
);

export const deactivateQuest = createAsyncThunk(
  'quests/deactivate',
  async (userQuestId: string, { rejectWithValue }) => {
    try {
      await questsService.deactivateQuest(userQuestId);
      return userQuestId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to deactivate quest');
    }
  }
);

export const createCustomQuest = createAsyncThunk(
  'quests/createCustom',
  async (
    quest: Omit<Quest, 'id' | 'createdAt' | 'isDefault' | 'isCustom'>,
    { rejectWithValue }
  ) => {
    try {
      const response = await questsService.createCustomQuest(quest);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create custom quest');
    }
  }
);

// Slice
const questsSlice = createSlice({
  name: 'quests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    // Optimistic update for quick completion
    optimisticComplete: (
      state,
      action: PayloadAction<{ userQuestId: string; xp: number }>
    ) => {
      const userQuest = state.userQuests.find(
        (q) => q.id === action.payload.userQuestId
      );
      if (userQuest) {
        userQuest.totalCompletions += 1;
        userQuest.lastCompletedAt = new Date().toISOString() as any;
      }
    },
    
    // Revert optimistic update on failure
    revertOptimisticComplete: (
      state,
      action: PayloadAction<{ userQuestId: string }>
    ) => {
      const userQuest = state.userQuests.find(
        (q) => q.id === action.payload.userQuestId
      );
      if (userQuest) {
        userQuest.totalCompletions -= 1;
      }
    },
    
    resetQuests: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Quest Library
    builder.addCase(fetchQuestLibrary.pending, (state) => {
      state.isLoadingLibrary = true;
      state.error = null;
    });
    builder.addCase(fetchQuestLibrary.fulfilled, (state, action) => {
      state.isLoadingLibrary = false;
      state.questLibrary = action.payload;
    });
    builder.addCase(fetchQuestLibrary.rejected, (state, action) => {
      state.isLoadingLibrary = false;
      state.error = action.payload as string;
    });

    // Fetch User Quests
    builder.addCase(fetchUserQuests.pending, (state) => {
      state.isLoadingUserQuests = true;
      state.error = null;
    });
    builder.addCase(fetchUserQuests.fulfilled, (state, action) => {
      state.isLoadingUserQuests = false;
      state.userQuests = action.payload;
      state.lastSyncAt = new Date().toISOString();
    });
    builder.addCase(fetchUserQuests.rejected, (state, action) => {
      state.isLoadingUserQuests = false;
      state.error = action.payload as string;
    });

    // Fetch Today's Completions
    builder.addCase(fetchTodayCompletions.fulfilled, (state, action) => {
      state.todayCompletions = action.payload;
    });

    // Complete Quest
    builder.addCase(completeQuest.pending, (state, action) => {
      state.isCompleting[action.meta.arg.userQuestId] = true;
    });
    builder.addCase(completeQuest.fulfilled, (state, action) => {
      const { userQuestId } = action.meta.arg;
      state.isCompleting[userQuestId] = false;
      state.todayCompletions.push(action.payload.completion);
      
      // Update user quest stats
      const userQuest = state.userQuests.find((q) => q.id === userQuestId);
      if (userQuest) {
        userQuest.totalCompletions += 1;
        userQuest.currentStreak = action.payload.newStreak;
        userQuest.lastCompletedAt = action.payload.completion.completedAt;
        if (userQuest.currentStreak > userQuest.longestStreak) {
          userQuest.longestStreak = userQuest.currentStreak;
        }
      }
    });
    builder.addCase(completeQuest.rejected, (state, action) => {
      state.isCompleting[action.meta.arg.userQuestId] = false;
      state.error = action.payload as string;
    });

    // Activate Quest
    builder.addCase(activateQuest.fulfilled, (state, action) => {
      state.userQuests.push(action.payload);
    });

    // Deactivate Quest
    builder.addCase(deactivateQuest.fulfilled, (state, action) => {
      state.userQuests = state.userQuests.filter(
        (q) => q.id !== action.payload
      );
    });

    // Create Custom Quest
    builder.addCase(createCustomQuest.fulfilled, (state, action) => {
      state.userQuests.push(action.payload);
    });
  },
});

// Selectors
export const selectQuestLibrary = (state: RootState) => state.quests.questLibrary;
export const selectUserQuests = (state: RootState) => state.quests.userQuests;
export const selectTodayCompletions = (state: RootState) => state.quests.todayCompletions;
export const selectIsLoadingQuests = (state: RootState) =>
  state.quests.isLoadingLibrary || state.quests.isLoadingUserQuests;
export const selectQuestError = (state: RootState) => state.quests.error;

// Derived selectors
export const selectDailyQuests = (state: RootState) =>
  state.quests.userQuests.filter(
    (q) => q.quest.frequency === QuestFrequency.DAILY && q.isActive
  );

export const selectWeeklyQuests = (state: RootState) =>
  state.quests.userQuests.filter(
    (q) => q.quest.frequency === QuestFrequency.WEEKLY && q.isActive
  );

export const selectQuestsByCategory = (category: QuestCategory) => (state: RootState) =>
  state.quests.userQuests.filter(
    (q) => q.quest.category === category && q.isActive
  );

export const selectTodayXP = (state: RootState) =>
  state.quests.todayCompletions.reduce((sum, c) => sum + c.xpEarned, 0);

export const selectCompletedQuestIds = (state: RootState) =>
  new Set(state.quests.todayCompletions.map((c) => c.userQuestId));

export const { clearError, optimisticComplete, revertOptimisticComplete, resetQuests } =
  questsSlice.actions;
export default questsSlice.reducer;
