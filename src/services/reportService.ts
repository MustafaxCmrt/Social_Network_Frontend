import { api } from './api';
import type { CreateReportDto, Report, PaginatedReportResponse, UpdateReportStatusDto } from '../types/report';

export interface AdminReportResponse {
    items: Report[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export const reportService = {
    // Rapor oluştur
    create: async (data: CreateReportDto): Promise<Report> => {
        return await api.post<Report>('/Report', data);
    },

    // Kendi raporlarımı getir
    getMyReports: async (page: number = 1, pageSize: number = 10): Promise<PaginatedReportResponse> => {
        return await api.get<PaginatedReportResponse>(`/Report/my?page=${page}&pageSize=${pageSize}`);
    },

    // Admin: Tüm raporları getir (status filtresi opsiyonel)
    getAllReports: async (page: number = 1, pageSize: number = 10, status?: number): Promise<AdminReportResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString()
        });
        
        if (status !== undefined && status !== 0) {
            params.append('status', status.toString());
        }

        return await api.get<AdminReportResponse>(`/Report/all?${params.toString()}`);
    },

    // Admin: Tek bir raporun detayını getir
    getById: async (id: number): Promise<Report> => {
        return await api.get<Report>(`/Report/${id}`);
    },

    // Admin: Rapor durumunu güncelle
    updateStatus: async (id: number, data: UpdateReportStatusDto): Promise<Report> => {
        return await api.put<Report>(`/Report/${id}/status`, data);
    },

    // Admin: Rapor sil
    delete: async (id: number): Promise<void> => {
        return await api.delete<void>(`/Report/delete/${id}`);
    }
};
