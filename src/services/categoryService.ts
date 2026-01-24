import { api } from './api';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category';

export const categoryService = {
    getAll: async (): Promise<Category[]> => {
        return await api.get<Category[]>('/Category/getAll');
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
    }
};
