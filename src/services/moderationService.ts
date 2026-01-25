import { api } from './api';

// ===== BAN Types =====
export interface UserBan {
    id: number;
    userId: number;
    username: string;
    bannedByUserId: number;
    bannedByUsername: string;
    reason: string;
    bannedAt: string;
    expiresAt: string | null;
    isActive: boolean;
    isPermanent: boolean;
}

export interface BanUserRequest {
    userId: number;
    reason: string;
    expiresAt?: string; // ISO date string, null = kalıcı ban
}

// ===== MUTE Types =====
export interface UserMute {
    id: number;
    userId: number;
    username: string;
    mutedByUserId: number;
    mutedByUsername: string;
    reason: string;
    mutedAt: string;
    expiresAt: string;
    isActive: boolean;
}

export interface MuteUserRequest {
    userId: number;
    reason: string;
    expiresAt: string; // ISO date string, zorunlu
}

// ===== Generic Response =====
export interface MessageResponse {
    message: string;
}

export const moderationService = {
    // ===== BAN İşlemleri =====

    /**
     * Kullanıcıyı yasakla
     */
    banUser: async (data: BanUserRequest): Promise<UserBan> => {
        return api.post<UserBan>('/Moderation/ban', data);
    },

    /**
     * Kullanıcının yasağını kaldır
     */
    unbanUser: async (userId: number): Promise<void> => {
        await api.delete(`/Moderation/ban/${userId}`);
    },

    /**
     * Kullanıcının yasaklarını getir
     */
    getUserBans: async (userId: number): Promise<UserBan[]> => {
        return api.get<UserBan[]>(`/Moderation/user/${userId}/bans`);
    },

    // ===== MUTE İşlemleri =====

    /**
     * Kullanıcıyı sustur
     */
    muteUser: async (data: MuteUserRequest): Promise<UserMute> => {
        return api.post<UserMute>('/Moderation/mute', data);
    },

    /**
     * Kullanıcının susturmasını kaldır
     */
    unmuteUser: async (userId: number): Promise<MessageResponse> => {
        return api.delete<MessageResponse>(`/Moderation/mute/${userId}`);
    },

    /**
     * Kullanıcının susturmalarını getir
     */
    getUserMutes: async (userId: number): Promise<UserMute[]> => {
        return api.get<UserMute[]>(`/Moderation/user/${userId}/mutes`);
    },

    // ===== THREAD İşlemleri =====

    /**
     * Thread'i kilitle
     */
    lockThread: async (threadId: number): Promise<MessageResponse> => {
        return api.put<MessageResponse>(`/Moderation/thread/${threadId}/lock`, {});
    },

    /**
     * Thread kilidini aç
     */
    unlockThread: async (threadId: number): Promise<MessageResponse> => {
        return api.put<MessageResponse>(`/Moderation/thread/${threadId}/unlock`, {});
    }
};
