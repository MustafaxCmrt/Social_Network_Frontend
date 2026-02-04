import { api } from './api';
import type { Thread, ThreadResponse, CreateThreadDto, UpdateThreadDto, ThreadFilterParams } from '../types/thread';

export const threadService = {
    getAll: async (params: ThreadFilterParams = {}): Promise<ThreadResponse> => {
        // Build query string manually to handle empty values correctly if needed
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.q) queryParams.append('q', params.q);
        if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
        if (params.clubId) queryParams.append('clubId', params.clubId.toString());
        if (params.isSolved !== undefined) queryParams.append('isSolved', params.isSolved.toString());
        if (params.userId) queryParams.append('userId', params.userId.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);

        return await api.get<ThreadResponse>(`/Thread/getAll?${queryParams.toString()}`);
    },

    getById: async (id: number): Promise<Thread> => {
        return await api.get<Thread>(`/Thread/get/${id}`);
    },

    create: async (data: CreateThreadDto): Promise<void> => {
        await api.post('/Thread/create', data);
    },

    update: async (data: UpdateThreadDto): Promise<void> => {
        await api.put('/Thread/update', data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/Thread/delete/${id}`);
    },

    // Görüntülenme sayısını artır
    incrementViewCount: async (id: number): Promise<{ message: string }> => {
        return await api.post<{ message: string }>(`/Thread/${id}/view`, {});
    },
};
