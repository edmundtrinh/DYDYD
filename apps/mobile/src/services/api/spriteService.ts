import { apiClient } from './client';

export interface SpriteMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SpriteRequest {
  message: string;
  context?: {
    recentQuests?: string[];
    streakDays?: number;
    currentLevel?: number;
  };
}

export interface SpriteResponse {
  reply: string;
  suggestedQuestIds?: string[];
}

export const spriteService = {
  sendMessage: (req: SpriteRequest) =>
    apiClient.post<SpriteResponse>('/ai/sprite', req),
};
