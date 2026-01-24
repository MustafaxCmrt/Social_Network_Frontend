export interface Category {
    id: number;
    title: string;
    slug: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    threadCount: number;
    parentCategoryId?: number | null;
    subCategoryCount: number;
    createdUserId?: number | null;
    updatedUserId?: number | null;
    subCategories?: Category[];
}

export interface CreateCategoryDto {
    title: string;
    description?: string;
    parentCategoryId?: number;
}

export interface UpdateCategoryDto {
    id: number;
    title: string;
    description?: string;
    parentCategoryId?: number;
}
