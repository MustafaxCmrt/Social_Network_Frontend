import { api } from './api';

// ===== Dashboard Stats Types =====

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    totalAdmins: number;
    bannedUsers: number;
}

export interface ContentStats {
    totalThreads: number;
    totalPosts: number;
    threadsToday: number;
    postsToday: number;
    threadsThisWeek: number;
    postsThisWeek: number;
    lockedThreads: number;
    totalCategories: number;
}

export interface ReportStats {
    totalReports: number;
    pendingReports: number;
    reviewedReports: number;
    resolvedReports: number;
    rejectedReports: number;
    reportsToday: number;
    reportsThisWeek: number;
}

export interface ModerationStats {
    activeBans: number;
    activeMutes: number;
    totalBans: number;
    totalMutes: number;
    bansToday: number;
    mutesToday: number;
}

export interface DailyActivity {
    date: string;
    newUsers: number;
    newThreads: number;
    newPosts: number;
    newReports: number;
}

export interface DashboardStats {
    userStats: UserStats;
    contentStats: ContentStats;
    reportStats: ReportStats;
    moderationStats: ModerationStats;
    last7DaysActivity: DailyActivity[];
}

export interface TopUser {
    userId: number;
    username: string;
    email: string;
    threadCount: number;
    postCount: number;
    totalActivity: number;
}

export interface TopReported {
    contentId: number;
    contentType: string;
    contentPreview: string;
    reportCount: number;
    lastReportedAt: string;
}

// ===== Dashboard Service =====

export const dashboardService = {
    /**
     * Tüm dashboard istatistiklerini getir
     */
    getStats: async (): Promise<DashboardStats> => {
        return api.get<DashboardStats>('/Dashboard/stats');
    },

    /**
     * En aktif kullanıcıları getir
     */
    getTopUsers: async (topCount: number = 10): Promise<TopUser[]> => {
        return api.get<TopUser[]>(`/Dashboard/top-users?topCount=${topCount}`);
    },

    /**
     * En çok rapor edilen içerikleri getir
     */
    getTopReported: async (topCount: number = 10): Promise<TopReported[]> => {
        return api.get<TopReported[]>(`/Dashboard/top-reported?topCount=${topCount}`);
    }
};
