// ============================================
// DYDYD - API Client
// ============================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ApiError } from '@dydyd/shared';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.dydyd.app/api';

const AUTH_TOKEN_KEY = '@dydyd/auth_tokens';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const tokens = await this.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await this.getStoredTokens();
            if (tokens?.refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refreshToken: tokens.refreshToken,
              });

              const newTokens = response.data.data;
              await this.storeTokens(newTokens);

              // Retry all queued requests
              this.refreshSubscribers.forEach((callback) =>
                callback(newTokens.accessToken)
              );
              this.refreshSubscribers = [];

              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Clear tokens and redirect to login
            await this.clearTokens();
            // Dispatch logout action (handled by store listener)
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private async getStoredTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const tokens = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch {
      return null;
    }
  }

  public async storeTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokens));
  }

  public async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  private transformError(error: any): ApiError {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
    if (!response.data.success) {
      throw response.data.error;
    }
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
    if (!response.data.success) {
      throw response.data.error;
    }
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
    if (!response.data.success) {
      throw response.data.error;
    }
    return response.data.data as T;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config);
    if (!response.data.success) {
      throw response.data.error;
    }
    return response.data.data as T;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
    if (!response.data.success) {
      throw response.data.error;
    }
    return response.data.data as T;
  }
}

export const apiClient = new ApiClient();
