// ============================================
// DYDYD - Notifications Slice
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationType } from '@dydyd/shared';
import { notificationsService } from '../../services/notifications/notificationsService';
import { RootState } from '../index';

interface NotificationsState {
  // Permission status
  hasPermission: boolean;
  permissionRequested: boolean;
  
  // Push token
  pushToken: string | null;
  
  // In-app notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Scheduled reminders
  scheduledReminders: string[]; // Quest IDs with scheduled reminders
  
  // Loading state
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  hasPermission: false,
  permissionRequested: false,
  pushToken: null,
  notifications: [],
  unreadCount: 0,
  scheduledReminders: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const requestNotificationPermission = createAsyncThunk(
  'notifications/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const result = await notificationsService.requestPermission();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to request permission');
    }
  }
);

export const registerPushToken = createAsyncThunk(
  'notifications/registerToken',
  async (token: string, { rejectWithValue }) => {
    try {
      await notificationsService.registerToken(token);
      return token;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to register token');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const result = await notificationsService.getNotifications();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const scheduleQuestReminder = createAsyncThunk(
  'notifications/scheduleReminder',
  async (
    params: { questId: string; time: string; questName: string },
    { rejectWithValue }
  ) => {
    try {
      await notificationsService.scheduleReminder(
        params.questId,
        params.time,
        params.questName
      );
      return params.questId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to schedule reminder');
    }
  }
);

export const cancelQuestReminder = createAsyncThunk(
  'notifications/cancelReminder',
  async (questId: string, { rejectWithValue }) => {
    try {
      await notificationsService.cancelReminder(questId);
      return questId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel reminder');
    }
  }
);

// Slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.readAt) {
        notification.readAt = new Date() as any;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        if (!n.readAt) {
          n.readAt = new Date() as any;
        }
      });
      state.unreadCount = 0;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    // Request Permission
    builder.addCase(requestNotificationPermission.fulfilled, (state, action) => {
      state.hasPermission = action.payload.granted;
      state.permissionRequested = true;
    });

    // Register Token
    builder.addCase(registerPushToken.fulfilled, (state, action) => {
      state.pushToken = action.payload;
    });

    // Fetch Notifications
    builder.addCase(fetchNotifications.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n: Notification) => !n.readAt).length;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Schedule Reminder
    builder.addCase(scheduleQuestReminder.fulfilled, (state, action) => {
      if (!state.scheduledReminders.includes(action.payload)) {
        state.scheduledReminders.push(action.payload);
      }
    });

    // Cancel Reminder
    builder.addCase(cancelQuestReminder.fulfilled, (state, action) => {
      state.scheduledReminders = state.scheduledReminders.filter(
        (id) => id !== action.payload
      );
    });
  },
});

// Selectors
export const selectHasNotificationPermission = (state: RootState) =>
  state.notifications.hasPermission;
export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectScheduledReminders = (state: RootState) =>
  state.notifications.scheduledReminders;

export const {
  clearError,
  markAsRead,
  markAllAsRead,
  addNotification,
  resetNotifications,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
