import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { spriteService, SpriteMessage } from '../../services/api/spriteService';
import { RootState } from '../index';

interface SpriteState {
  messages: SpriteMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: SpriteState = {
  messages: [],
  loading: false,
  error: null,
};

export const sendSpriteMessage = createAsyncThunk(
  'sprite/sendMessage',
  async (message: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const user = (state as any).user?.profile;
      const response = await spriteService.sendMessage({
        message,
        context: {
          streakDays: user?.streakDays,
          currentLevel: user?.level,
        },
      });
      return { userMessage: message, reply: response.reply };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Your Sprite is resting. Try again soon.');
    }
  }
);

const spriteSlice = createSlice({
  name: 'sprite',
  initialState,
  reducers: {
    clearMessages(state) {
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendSpriteMessage.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.messages.push({
          id: `user-${Date.now()}`,
          role: 'user',
          content: action.meta.arg,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendSpriteMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: action.payload.reply,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendSpriteMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMessages } = spriteSlice.actions;
export default spriteSlice.reducer;
