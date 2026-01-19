// ============================================
// DYDYD - Health Slice
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HealthData, HealthDataSource, HealthDataType, HealthSyncResult } from '@dydyd/shared';
import { healthService } from '../../services/health/healthService';
import { RootState } from '../index';

interface HealthPermissions {
  steps: boolean;
  sleep: boolean;
  water: boolean;
  workout: boolean;
  heartRate: boolean;
  mindfulness: boolean;
}

interface HealthState {
  // Available data sources on this device
  availableSources: HealthDataSource[];
  
  // Connected/authorized sources
  connectedSources: HealthDataSource[];
  
  // Permissions status
  permissions: HealthPermissions;
  
  // Today's health data
  todayData: Record<HealthDataType, HealthData | null>;
  
  // Sync status
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
  
  // Auto-sync enabled
  autoSyncEnabled: boolean;
}

const initialState: HealthState = {
  availableSources: [],
  connectedSources: [],
  permissions: {
    steps: false,
    sleep: false,
    water: false,
    workout: false,
    heartRate: false,
    mindfulness: false,
  },
  todayData: {
    steps: null,
    distance: null,
    active_calories: null,
    sleep_hours: null,
    water_cups: null,
    workout_minutes: null,
    heart_rate: null,
    mindful_minutes: null,
    stand_hours: null,
  },
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,
  autoSyncEnabled: true,
};

// Async thunks
export const initializeHealthKit = createAsyncThunk(
  'health/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const result = await healthService.initialize();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize health integration');
    }
  }
);

export const requestHealthPermissions = createAsyncThunk(
  'health/requestPermissions',
  async (dataTypes: HealthDataType[], { rejectWithValue }) => {
    try {
      const result = await healthService.requestPermissions(dataTypes);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to request permissions');
    }
  }
);

export const syncHealthData = createAsyncThunk(
  'health/sync',
  async (_, { rejectWithValue }) => {
    try {
      const result = await healthService.syncTodayData();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync health data');
    }
  }
);

export const fetchHealthData = createAsyncThunk(
  'health/fetchData',
  async (
    params: { dataType: HealthDataType; startDate: Date; endDate: Date },
    { rejectWithValue }
  ) => {
    try {
      const result = await healthService.fetchData(
        params.dataType,
        params.startDate,
        params.endDate
      );
      return { dataType: params.dataType, data: result };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch health data');
    }
  }
);

// Slice
const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearSyncError: (state) => {
      state.syncError = null;
    },
    setAutoSync: (state, action: PayloadAction<boolean>) => {
      state.autoSyncEnabled = action.payload;
    },
    updateHealthData: (state, action: PayloadAction<HealthData>) => {
      state.todayData[action.payload.type] = action.payload;
    },
    resetHealth: () => initialState,
  },
  extraReducers: (builder) => {
    // Initialize
    builder.addCase(initializeHealthKit.fulfilled, (state, action) => {
      state.availableSources = action.payload.availableSources;
      state.connectedSources = action.payload.connectedSources;
      state.permissions = action.payload.permissions;
    });

    // Request Permissions
    builder.addCase(requestHealthPermissions.fulfilled, (state, action) => {
      state.permissions = { ...state.permissions, ...action.payload };
      // Add to connected sources if any permission granted
      if (Object.values(action.payload).some(Boolean)) {
        const source = action.payload.source;
        if (source && !state.connectedSources.includes(source)) {
          state.connectedSources.push(source);
        }
      }
    });

    // Sync Health Data
    builder.addCase(syncHealthData.pending, (state) => {
      state.isSyncing = true;
      state.syncError = null;
    });
    builder.addCase(syncHealthData.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.lastSyncAt = new Date().toISOString();
      
      // Update today's data
      action.payload.dataPoints.forEach((data) => {
        state.todayData[data.type] = data;
      });
    });
    builder.addCase(syncHealthData.rejected, (state, action) => {
      state.isSyncing = false;
      state.syncError = action.payload as string;
    });

    // Fetch Specific Health Data
    builder.addCase(fetchHealthData.fulfilled, (state, action) => {
      state.todayData[action.payload.dataType] = action.payload.data;
    });
  },
});

// Selectors
export const selectAvailableSources = (state: RootState) => state.health.availableSources;
export const selectConnectedSources = (state: RootState) => state.health.connectedSources;
export const selectHealthPermissions = (state: RootState) => state.health.permissions;
export const selectTodayHealthData = (state: RootState) => state.health.todayData;
export const selectIsSyncing = (state: RootState) => state.health.isSyncing;
export const selectLastSyncAt = (state: RootState) => state.health.lastSyncAt;
export const selectAutoSyncEnabled = (state: RootState) => state.health.autoSyncEnabled;

export const selectHealthDataByType = (type: HealthDataType) => (state: RootState) =>
  state.health.todayData[type];

export const { clearSyncError, setAutoSync, updateHealthData, resetHealth } =
  healthSlice.actions;
export default healthSlice.reducer;
