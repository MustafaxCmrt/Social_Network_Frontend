import { api } from './api';

// ===== Audit Log Types =====

export type AuditAction =
    | 'BanUser'
    | 'UnbanUser'
    | 'MuteUser'
    | 'UnmuteUser'
    | 'LockThread'
    | 'UnlockThread';

export type AuditEntityType = 'User' | 'Thread' | 'Post' | 'Report';

export interface AuditLogItem {
    id: number;
    userId: number;
    username: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: number;
    oldValue: string | null;
    newValue: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    errorMessage: string | null;
    notes: string | null;
    createdAt: string;
}

export interface AuditLogResponse {
    items: AuditLogItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface AuditLogFilters {
    userId?: number;
    action?: AuditAction;
    entityType?: AuditEntityType;
    entityId?: number;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}

// ===== Audit Log Service =====

export const auditLogService = {
    /**
     * Audit log listesini getir (filtreleme destekli)
     */
    getLogs: async (filters: AuditLogFilters = {}): Promise<AuditLogResponse> => {
        const params = new URLSearchParams();

        if (filters.userId) params.append('userId', filters.userId.toString());
        if (filters.action) params.append('action', filters.action);
        if (filters.entityType) params.append('entityType', filters.entityType);
        if (filters.entityId) params.append('entityId', filters.entityId.toString());
        if (filters.success !== undefined) params.append('success', filters.success.toString());
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

        const queryString = params.toString();
        const url = queryString ? `/AuditLog?${queryString}` : '/AuditLog';

        return api.get<AuditLogResponse>(url);
    },

    /**
     * Belirli bir audit log kaydını getir (detaylı)
     */
    getLogById: async (id: number): Promise<AuditLogItem> => {
        return api.get<AuditLogItem>(`/AuditLog/${id}`);
    },

    /**
     * Kullanıcının audit loglarını getir (pagination destekli)
     */
    getLogsByUser: async (userId: number, page: number = 1, pageSize: number = 50): Promise<AuditLogResponse> => {
        return api.get<AuditLogResponse>(`/AuditLog/user/${userId}?page=${page}&pageSize=${pageSize}`);
    },

    /**
     * Entity'ye göre audit loglarını getir
     */
    getLogsByEntity: async (entityType: AuditEntityType, entityId: number): Promise<AuditLogResponse> => {
        return api.get<AuditLogResponse>(`/AuditLog/entity/${entityType}/${entityId}`);
    },

    /**
     * Eski audit loglarını temizle
     * @param days - Kaç günden eski loglar silinsin (varsayılan 90)
     */
    cleanup: async (days: number = 90): Promise<void> => {
        return api.delete<void>(`/AuditLog/cleanup?days=${days}`);
    }
};
