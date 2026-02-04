import { api } from './api';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category';

interface PaginatedCategoryResponse {
    items: Category[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

interface GetPaginatedParams {
    page?: number;
    pageSize?: number;
    search?: string;
    parentCategoryId?: number | null;
}

export const categoryService = {
    // Sadece ana kategorileri getirir
    getAll: async (): Promise<Category[]> => {
        return await api.get<Category[]>('/Category/getAll');
    },

    getPaginated: async (params: GetPaginatedParams): Promise<PaginatedCategoryResponse> => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.parentCategoryId !== undefined && params.parentCategoryId !== null) {
            queryParams.append('parentCategoryId', params.parentCategoryId.toString());
        }
        
        return await api.get<PaginatedCategoryResponse>(`/Category/paginated?${queryParams.toString()}`);
    },

    getById: async (id: number): Promise<Category> => {
        return await api.get<Category>(`/Category/get/${id}`);
    },

    getBySlug: async (slug: string): Promise<Category> => {
        return await api.get<Category>(`/Category/get/slug/${slug}`);
    },

    create: async (data: CreateCategoryDto): Promise<void> => {
        await api.post('/Category/create', data);
    },

    update: async (data: UpdateCategoryDto): Promise<void> => {
        await api.put('/Category/update', data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/Category/delete?id=${id}`);
    },

    getTree: async (): Promise<Category[]> => {
        return await api.get<Category[]>('/Category/tree');
    },

    getSubcategories: async (id: number): Promise<Category[]> => {
        return await api.get<Category[]>(`/Category/${id}/subcategories`);
    },

    getRootCategories: async (): Promise<Category[]> => {
        return await api.get<Category[]>('/Category/root');
    },

    /**
     * Get categories for a specific club
     * GET /api/Category/club/{clubId}
     */
    getClubCategories: async (clubId: number): Promise<Category[]> => {
        return await api.get<Category[]>(`/Category/club/${clubId}`);
    },

    /**
     * Create a category for a specific club
     * POST /api/Category/club/{clubId}
     */
    createClubCategory: async (clubId: number, data: CreateCategoryDto): Promise<void> => {
        await api.post(`/Category/club/${clubId}`, data);
    }
};
