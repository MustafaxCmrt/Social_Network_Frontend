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
    role: string;
    isActive: boolean;
}

export interface UpdateUserRequest {
    userId: number;
    firstName: string;
    lastName: string;
    username?: string;
    email?: string;
    password?: string;
    isActive: boolean;
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

export interface UserProfile {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profileImg: string | null;
    role?: string; // We will hide this in UI
    createdAt: string;
    totalThreads: number;
    totalPosts: number;
}

// Admin: User List Types
export interface UserListItem {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImg: string | null;
    email: string;
    role: string;
    isActive: boolean;
}

export interface UserListResponse {
    items: UserListItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Admin: User Thread & Post Types
export interface UserThreadListItem {
    id: number;
    title: string;
    content: string;
    viewCount: number;
    postCount: number;
    isSolved: boolean;
    createdAt: string;
}

export interface UserThreadsResponse {
    userId: number;
    username: string;
    totalThreads: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    threads: UserThreadListItem[];
}

export interface UserPostListItem {
    id: number;
    threadId: number;
    threadTitle: string;
    content: string;
    isSolution: boolean;
    upvoteCount: number;
    createdAt: string;
}

export interface UserPostsResponse {
    userId: number;
    username: string;
    totalPosts: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    posts: UserPostListItem[];
}

export const userService = {
    // Kendi profilini getir
    getMe: async (): Promise<User> => {
        return api.get<User>('/User/me');
    },

    // Başka bir kullanıcının profilini getir
    getUserProfile: async (id: number): Promise<UserProfile> => {
        return api.get<UserProfile>(`/User/profile/${id}`);
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

    // Kullanıcının konularını getir
    getUserThreads: async (userId: number, page: number = 1, pageSize: number = 10): Promise<UserThreadsResponse> => {
        return api.get<UserThreadsResponse>(`/User/${userId}/threads?pageNumber=${page}&pageSize=${pageSize}`);
    },

    // Kullanıcının postlarını getir
    getUserPosts: async (userId: number, page: number = 1, pageSize: number = 10): Promise<UserPostsResponse> => {
        return api.get<UserPostsResponse>(`/User/${userId}/posts?pageNumber=${page}&pageSize=${pageSize}`);
    },

    // Admin: Tüm kullanıcıları getir (pagination + search)
    getAll: async (page: number = 1, pageSize: number = 10, search: string = ''): Promise<UserListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });
        if (search.trim()) {
            params.append('search', search.trim());
        }
        return api.get<UserListResponse>(`/User/getAll?${params.toString()}`);
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
        return api.delete<DeleteResponse>(`/User/delete?id=${userId}`);
    },

    // Backward compatibility aliases
    updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
        return api.put<User>('/User/me', data);
    },

    deleteAccount: async (): Promise<DeleteResponse> => {
        return api.delete<DeleteResponse>('/User/me');
    }
};

