import { api } from './api';
import type { User } from '../types';

// Request DTOs
export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    profileImg?: string;
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
}

export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: string;
}

export interface UpdateUserRequest {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
}

// Response DTOs
export interface CreateUserResponse {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    message: string;
}

export interface UpdateUserResponse {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    message: string;
}

export interface DeleteResponse {
    message: string;
}

export const userService = {
    // Kendi profilini getir
    getMe: async (): Promise<User> => {
        return api.get<User>('/User/me');
    },

    // Kendi profilini güncelle
    updateMe: async (data: UpdateProfileRequest): Promise<User> => {
        return api.put<User>('/User/me', data);
    },

    // Profil resmi yükle
    uploadProfileImage: async (file: File): Promise<void> => {
        return api.upload<void>('/User/upload-profile-image', file);
    },

    // Kendi hesabını sil
    deleteMe: async (): Promise<DeleteResponse> => {
        return api.delete<DeleteResponse>('/User/me');
    },

    // Admin: Kullanıcı oluştur
    create: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
        return api.post<CreateUserResponse>('/User/create', data);
    },

    // Admin: Kullanıcı güncelle
    update: async (data: UpdateUserRequest): Promise<UpdateUserResponse> => {
        return api.put<UpdateUserResponse>('/User/update', data);
    },

    // Admin: Kullanıcı sil
    delete: async (userId: number): Promise<DeleteResponse> => {
        return api.delete<DeleteResponse>(`/User/delete/${userId}`);
    },

    // Backward compatibility aliases
    updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
        return api.put<User>('/User/me', data);
    },

    deleteAccount: async (): Promise<DeleteResponse> => {
        return api.delete<DeleteResponse>('/User/me');
    }
};
