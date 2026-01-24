import { api } from './api';

// Report Types - const objects instead of enums for erasableSyntaxOnly compatibility
export const ReportType = {
    THREAD: 'thread',
    POST: 'post',
    USER: 'user'
} as const;
export type ReportType = typeof ReportType[keyof typeof ReportType];

export const ReportStatus = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
} as const;
export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

export interface Report {
    id: number;
    reporterId: number;
    reporterUsername?: string;
    targetType: ReportType;
    targetId: number;
    reason: string;
    description?: string;
    status: ReportStatus;
    reviewedBy?: number;
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReportResponse {
    items: Report[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Request DTOs
export interface CreateReportRequest {
    targetType: ReportType;
    targetId: number;
    reason: string;
    description?: string;
}

export interface UpdateReportStatusRequest {
    status: ReportStatus;
}

export interface ReportFilterParams {
    page?: number;
    pageSize?: number;
    status?: ReportStatus;
    targetType?: ReportType;
}

export interface DeleteResponse {
    message: string;
}

export const reportService = {
    // Tüm raporları getir (Admin)
    getAll: async (params: ReportFilterParams = {}): Promise<ReportResponse> => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.status) queryParams.append('status', params.status);
        if (params.targetType) queryParams.append('targetType', params.targetType);

        return api.get<ReportResponse>(`/Report?${queryParams.toString()}`);
    },

    // Rapor oluştur
    create: async (data: CreateReportRequest): Promise<Report> => {
        return api.post<Report>('/Report', data);
    },

    // Rapor durumunu güncelle (Admin)
    updateStatus: async (reportId: number, data: UpdateReportStatusRequest): Promise<Report> => {
        return api.put<Report>(`/Report/${reportId}/status`, data);
    },

    // Rapor sil (Admin)
    delete: async (reportId: number): Promise<DeleteResponse> => {
        return api.delete<DeleteResponse>(`/Report/${reportId}`);
    }
};
