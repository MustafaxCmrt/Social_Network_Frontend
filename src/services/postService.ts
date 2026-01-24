import { api } from './api';
import type { PostResponse, CreatePostDto, UpdatePostDto, PostFilterParams } from '../types/post';

export const postService = {
    getAllByThreadId: async (threadId: number, params: PostFilterParams = {}): Promise<PostResponse> => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        return await api.get<PostResponse>(`/Post/getAll/${threadId}?${queryParams.toString()}`);
    },

    create: async (data: CreatePostDto): Promise<void> => {
        await api.post('/Post/create', data);
    },

    update: async (data: UpdatePostDto): Promise<void> => {
        await api.put('/Post/update', data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/Post/delete/${id}`);
    }
};
