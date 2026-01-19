// ============================================
// DYDYD - Auth Service
// ============================================

import { AuthTokens, LoginRequest, RegisterRequest } from '@dydyd/shared';
import { apiClient } from './client';

interface LoginResponse {
  tokens: AuthTokens;
  isOnboarded: boolean;
}

interface RegisterResponse {
  tokens: AuthTokens;
  isOnboarded: boolean;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    await apiClient.storeTokens({
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    });
    return response;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    await apiClient.storeTokens({
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    });
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await apiClient.clearTokens();
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>('/auth/refresh', {
      refreshToken,
    });
    await apiClient.storeTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    return response;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  },
};
