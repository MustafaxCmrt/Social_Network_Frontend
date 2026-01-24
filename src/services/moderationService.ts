import { api } from './api';

// Ban Types
export interface UserBan {
    id: number;
    userId: number;
    username?: string;
    reason: string;
    bannedBy: number;
    bannedByUsername?: string;
    expiresAt?: string;
    isPermanent: boolean;
    createdAt: string;
}

// Mute Types
export interface UserMute {
    id: number;
    userId: number;
    username?: string;
    reason: string;
    mutedBy: number;
    mutedByUsername?: string;
    expiresAt: string;
    createdAt: string;
}

// Request DTOs
export interface BanUserRequest {
    userId: number;
    reason: string;
    durationDays?: number; // null = kalıcı ban
}

export interface MuteUserRequest {
    userId: number;
    reason: string;
    durationMinutes: number;
}

export interface MessageResponse {
    message: string;
}

export const moderationService = {
    // Kullanıcı banla (Admin)
    banUser: async (data: BanUserRequest): Promise<UserBan> => {
        return api.post<UserBan>('/Moderation/ban', data);
    },

    // Ban kaldır (Admin)
    unbanUser: async (userId: number): Promise<MessageResponse> => {
        return api.delete<MessageResponse>(`/Moderation/ban/${userId}`);
    },

    // Kullanıcı sustur (Admin)
    muteUser: async (data: MuteUserRequest): Promise<UserMute> => {
        return api.post<UserMute>('/Moderation/mute', data);
    },

    // Susturmayı kaldır (Admin)
    unmuteUser: async (userId: number): Promise<MessageResponse> => {
        return api.delete<MessageResponse>(`/Moderation/mute/${userId}`);
    },

    // Thread kilitle (Admin)
    lockThread: async (threadId: number): Promise<MessageResponse> => {
        return api.put<MessageResponse>(`/Moderation/thread/${threadId}/lock`, {});
    },

    // Thread kilidini aç (Admin)
    unlockThread: async (threadId: number): Promise<MessageResponse> => {
        return api.put<MessageResponse>(`/Moderation/thread/${threadId}/unlock`, {});
    }
};
