import { api } from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse, ForgotPasswordRequest, ResetPasswordRequest } from '../types';

export const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        return api.post<AuthResponse>('/Auth/login', data);
    },

    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
        return api.post<RegisterResponse>('/Auth/register', data);
    },

    forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
        // Backend returns 200 OK or 400 Bad Request
        return api.post<void>('/Auth/forgot-password', data);
    },

    resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
        return api.post<void>('/Auth/reset-password', data);
    },

    refreshToken: async (token: string): Promise<AuthResponse> => {
        return api.post<AuthResponse>('/Auth/refresh', { refreshToken: token });
    },

    logout: async () => {
        // Optional: Call logout endpoint if exists, and clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    }
};
