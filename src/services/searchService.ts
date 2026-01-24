import { api } from './api';
import type { Thread } from '../types/thread';
import type { Post } from '../types/post';
import type { User } from '../types/index';

export interface GlobalSearchResponse {
    query: string;
    threads: Thread[];
    posts: Post[];
    users: User[]; // All endpointinde user yoksa boş gelebilir veya backend eklerse gelir
}

export interface ThreadSearchResponse {
    results: Thread[];
    totalResults: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    query: string;
}

export interface PostSearchResponse {
    results: Post[];
    totalResults: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    query: string;
}

export interface UserSearchResponse {
    results: User[];
    totalResults: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    query: string;
}

export const searchService = {
    // Tümü
    searchAll: async (query: string, limit: number = 5): Promise<GlobalSearchResponse> => {
        return await api.get<GlobalSearchResponse>(`/Search/all?query=${encodeURIComponent(query)}&limit=${limit}`);
    },

    // Konular
    searchThreads: async (query: string, page: number = 1, pageSize: number = 10): Promise<ThreadSearchResponse> => {
        return await api.get<ThreadSearchResponse>(`/Search/threads?query=${encodeURIComponent(query)}&pageNumber=${page}&pageSize=${pageSize}`);
    },

    // Yorumlar
    searchPosts: async (query: string, page: number = 1, pageSize: number = 10): Promise<PostSearchResponse> => {
        return await api.get<PostSearchResponse>(`/Search/posts?query=${encodeURIComponent(query)}&pageNumber=${page}&pageSize=${pageSize}`);
    },

    // Kullanıcılar
    searchUsers: async (query: string, page: number = 1, pageSize: number = 10): Promise<UserSearchResponse> => {
        return await api.get<UserSearchResponse>(`/Search/users?query=${encodeURIComponent(query)}&pageNumber=${page}&pageSize=${pageSize}`);
    }
};
