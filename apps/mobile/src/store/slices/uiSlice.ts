// ============================================
// DYDYD - UI Slice
// ============================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface Modal {
  id: string;
  type: 'badge_earned' | 'level_up' | 'confirm' | 'custom';
  data?: Record<string, unknown>;
}

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Loading overlay
  isGlobalLoading: boolean;
  loadingMessage: string | null;
  
  // Toasts
  toasts: Toast[];
  
  // Modals
  activeModal: Modal | null;
  
  // Bottom sheet
  bottomSheetContent: string | null;
  bottomSheetData: Record<string, unknown> | null;
  
  // Keyboard
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  
  // Network
  isOnline: boolean;
  
  // Quick complete mode (for widget/watch)
  quickCompleteMode: boolean;
}

const initialState: UIState = {
  theme: 'system',
  isGlobalLoading: false,
  loadingMessage: null,
  toasts: [],
  activeModal: null,
  bottomSheetContent: null,
  bottomSheetData: null,
  isKeyboardVisible: false,
  keyboardHeight: 0,
  isOnline: true,
  quickCompleteMode: false,
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    setGlobalLoading: (
      state,
      action: PayloadAction<{ isLoading: boolean; message?: string }>
    ) => {
      state.isGlobalLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || null;
    },
    
    showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    showModal: (state, action: PayloadAction<Modal>) => {
      state.activeModal = action.payload;
    },
    
    hideModal: (state) => {
      state.activeModal = null;
    },
    
    showBottomSheet: (
      state,
      action: PayloadAction<{ content: string; data?: Record<string, unknown> }>
    ) => {
      state.bottomSheetContent = action.payload.content;
      state.bottomSheetData = action.payload.data || null;
    },
    
    hideBottomSheet: (state) => {
      state.bottomSheetContent = null;
      state.bottomSheetData = null;
    },
    
    setKeyboardState: (
      state,
      action: PayloadAction<{ visible: boolean; height: number }>
    ) => {
      state.isKeyboardVisible = action.payload.visible;
      state.keyboardHeight = action.payload.height;
    },
    
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    setQuickCompleteMode: (state, action: PayloadAction<boolean>) => {
      state.quickCompleteMode = action.payload;
    },
    
    resetUI: () => initialState,
  },
});

// Selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectIsGlobalLoading = (state: RootState) => state.ui.isGlobalLoading;
export const selectLoadingMessage = (state: RootState) => state.ui.loadingMessage;
export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectActiveModal = (state: RootState) => state.ui.activeModal;
export const selectBottomSheet = (state: RootState) => ({
  content: state.ui.bottomSheetContent,
  data: state.ui.bottomSheetData,
});
export const selectIsKeyboardVisible = (state: RootState) => state.ui.isKeyboardVisible;
export const selectKeyboardHeight = (state: RootState) => state.ui.keyboardHeight;
export const selectIsOnline = (state: RootState) => state.ui.isOnline;
export const selectQuickCompleteMode = (state: RootState) => state.ui.quickCompleteMode;

export const {
  setTheme,
  setGlobalLoading,
  showToast,
  hideToast,
  clearToasts,
  showModal,
  hideModal,
  showBottomSheet,
  hideBottomSheet,
  setKeyboardState,
  setOnlineStatus,
  setQuickCompleteMode,
  resetUI,
} = uiSlice.actions;
export default uiSlice.reducer;
