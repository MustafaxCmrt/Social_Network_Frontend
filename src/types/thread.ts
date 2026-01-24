export interface Thread {
    id: number;
    title: string;
    content: string;
    viewCount: number;
    isSolved: boolean;
    userId: number;
    categoryId: number;
    createdAt: string;
    updatedAt: string;
    // Backend'den gelip gelmediği kontrol edilecek alanlar, mock ile uyum için opsiyonel bırakabiliriz veya frontend'de birleştirebiliriz
    // Şimdilik backend response'a sadık kalıyoruz
    author?: {
        username: string;
        avatar: string;
    };
    categoryName?: string;
    replyCount?: number;
    tags?: string[];
    isPinned?: boolean;
}

export interface ThreadResponse {
    items: Thread[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface CreateThreadDto {
    title: string;
    content: string;
    categoryId: number;
}

export interface UpdateThreadDto {
    id: number;
    title: string;
    content: string;
    categoryId: number;
    isSolved?: boolean;
}

export interface ThreadFilterParams {
    page?: number;
    pageSize?: number;
    q?: string;
    categoryId?: number;
    isSolved?: boolean;
    userId?: number;
    sortBy?: string;
    sortDir?: string;
}
