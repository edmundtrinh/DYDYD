// ============================================
// DYDYD - User Slice
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserSettings, CategoryPriority, QuestCategory } from '@dydyd/shared';
import { userService } from '../../services/api/userService';
import { RootState } from '../index';

interface UserState {
  profile: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  isUpdating: false,
  error: null,
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings: Partial<UserSettings>, { rejectWithValue }) => {
    try {
      const response = await userService.updateSettings(settings);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update settings');
    }
  }
);

export const updateCategoryPriorities = createAsyncThunk(
  'user/updatePriorities',
  async (priorities: CategoryPriority[], { rejectWithValue }) => {
    try {
      const response = await userService.updateCategoryPriorities(priorities);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update priorities');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (password: string, { rejectWithValue }) => {
    try {
      await userService.deleteAccount(password);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete account');
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Optimistic XP update
    addXPToProfile: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.totalXP += action.payload;
      }
    },
    // Level up
    levelUp: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.level = action.payload;
      }
    },
    resetUser: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder.addCase(fetchProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.profile = action.payload;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.isUpdating = true;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.isUpdating = false;
      state.profile = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload as string;
    });

    // Update Settings
    builder.addCase(updateSettings.fulfilled, (state, action) => {
      if (state.profile) {
        state.profile.settings = action.payload;
      }
    });

    // Update Category Priorities
    builder.addCase(updateCategoryPriorities.fulfilled, (state, action) => {
      if (state.profile) {
        state.profile.categoryPriorities = action.payload;
      }
    });
  },
});

// Selectors
export const selectProfile = (state: RootState) => state.user.profile;
export const selectUserSettings = (state: RootState) => state.user.profile?.settings;
export const selectCategoryPriorities = (state: RootState) =>
  state.user.profile?.categoryPriorities;
export const selectIsPremium = (state: RootState) => state.user.profile?.isPremium ?? false;
export const selectUserLevel = (state: RootState) => state.user.profile?.level ?? 1;
export const selectTotalXP = (state: RootState) => state.user.profile?.totalXP ?? 0;
export const selectIsLoadingUser = (state: RootState) => state.user.isLoading;

export const { clearError, addXPToProfile, levelUp, resetUser } = userSlice.actions;
export default userSlice.reducer;
