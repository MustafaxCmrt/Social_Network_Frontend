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

// ===== Pagination Response =====
export interface UserBansResponse {
    items: UserBan[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface UserMutesResponse {
    items: UserMute[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
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
    getUserBans: async (userId: number, page: number = 1, pageSize: number = 10): Promise<UserBansResponse> => {
        return api.get<UserBansResponse>(`/Moderation/user/${userId}/bans?page=${page}&pageSize=${pageSize}`);
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
    getUserMutes: async (userId: number, page: number = 1, pageSize: number = 10): Promise<UserMutesResponse> => {
        return api.get<UserMutesResponse>(`/Moderation/user/${userId}/mutes?page=${page}&pageSize=${pageSize}`);
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
    },

    /**
     * Kullanıcı ara (isim, soyisim, kullanıcı adı)
     */
    searchUsers: async (query: string): Promise<UserSearchResult[]> => {
        return api.get<UserSearchResult[]>(`/Moderation/search/users?q=${encodeURIComponent(query)}`);
    },

    /**
     * Thread ara (başlık)
     */
    searchThreads: async (query: string): Promise<ThreadSearchResult[]> => {
        return api.get<ThreadSearchResult[]>(`/Moderation/search/threads?q=${encodeURIComponent(query)}`);
    }
};

// ===== SEARCH Types =====
export interface UserSearchResult {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    profileImg: string | null;
    role: string;
    totalThreads: number;
    totalPosts: number;
    createdAt: string;
}

export interface ThreadSearchResult {
    id: number;
    title: string;
    content: string;
    viewCount: number;
    isSolved: boolean;
    postCount: number;
    userId: number;
    username: string;
    categoryId: number;
    categoryName: string;
    createdAt: string;
    updatedAt: string;
}
