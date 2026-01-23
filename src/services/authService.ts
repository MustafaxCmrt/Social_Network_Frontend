import { api } from './api';
import type { User, LoginRequest, RegisterRequest, AuthResponse, RegisterResponse, ForgotPasswordRequest, ResetPasswordRequest, ResendVerificationRequest } from '../types';

export const authService = {
    getCurrentUser: async (): Promise<User> => {
        return api.get<User>('/User/me');
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        return api.post<AuthResponse>('/Auth/login', data);
    },

    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
        return api.post<RegisterResponse>('/Auth/register', data);
    },

    resendVerificationEmail: async (data: ResendVerificationRequest): Promise<void> => {
        return api.post<void>('/Auth/resend-verification-email', data);
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
        try {
            await api.post('/Auth/logout', {});
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
    }
};
