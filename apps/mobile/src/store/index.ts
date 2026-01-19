// ============================================
// DYDYD - Redux Store Configuration
// ============================================

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import slices
import authReducer from './slices/authSlice';
import questsReducer from './slices/questsSlice';
import progressReducer from './slices/progressSlice';
import userReducer from './slices/userSlice';
import healthReducer from './slices/healthSlice';
import notificationsReducer from './slices/notificationsSlice';
import uiReducer from './slices/uiSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  quests: questsReducer,
  progress: progressReducer,
  user: userReducer,
  health: healthReducer,
  notifications: notificationsReducer,
  ui: uiReducer,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'quests'], // Only persist these reducers
  blacklist: ['ui', 'health'], // Don't persist these (will be fresh each session)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Types for store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
