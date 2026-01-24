import { api } from './api';
import type {
    Post,
    PostResponse,
    CreatePostDto,
    UpdatePostDto,
    PostFilterParams,
    MarkSolutionDto,
    UpvoteResponse,
    VoteStatusResponse
} from '../types/post';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5265/api';

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

    // Görsel ile birlikte yorum oluştur (multipart/form-data)
    createWithImage: async (
        threadId: number,
        content: string,
        image?: File,
        parentPostId?: number
    ): Promise<Post> => {
        const formData = new FormData();
        formData.append('threadId', threadId.toString());
        formData.append('content', content);
        if (parentPostId) {
            formData.append('parentPostId', parentPostId.toString());
        }
        if (image) {
            formData.append('image', image);
        }

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/Post/create-with-image`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Yorum oluşturulurken bir hata oluştu.');
        }

        return await response.json();
    },

    update: async (data: UpdatePostDto): Promise<void> => {
        await api.put('/Post/update', data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/Post/delete/${id}`);
    },

    // Yorumu çözüm olarak işaretle
    markSolution: async (data: MarkSolutionDto): Promise<void> => {
        await api.post('/Post/markSolution', data);
    },

    // Çözüm işaretini kaldır
    unmarkSolution: async (threadId: number): Promise<{ message: string }> => {
        return await api.delete<{ message: string }>(`/Post/unmarkSolution/${threadId}`);
    },

    // Görsel yükle (multipart/form-data)
    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/Post/upload-image`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Görsel yüklenirken bir hata oluştu.');
        }

        // Response text olarak URL döndürüyor
        return await response.text();
    },

    // Yorumu beğen / beğeniyi kaldır (toggle) - PATCH metodu
    upvote: async (postId: number): Promise<UpvoteResponse> => {
        return await api.patch<UpvoteResponse>(`/Post/${postId}/upvote`);
    },

    // Beğeniyi kaldır (aynı endpoint, toggle olarak çalışıyor)
    removeUpvote: async (postId: number): Promise<UpvoteResponse> => {
        return await api.patch<UpvoteResponse>(`/Post/${postId}/upvote`);
    },

    // Oy durumunu kontrol et
    getVoteStatus: async (postId: number): Promise<VoteStatusResponse> => {
        return await api.get<VoteStatusResponse>(`/Post/${postId}/vote-status`);
    },

    // Bir yorumun alt yanıtlarını getir
    getReplies: async (postId: number, params: PostFilterParams = {}): Promise<PostResponse> => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        return await api.get<PostResponse>(`/Post/${postId}/replies?${queryParams.toString()}`);
    }
};
