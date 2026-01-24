// Ortak User objesi (API'den gelen)
export interface ThreadUser {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    profileImg: string | null;
    fullName: string;
}

// Ortak Category objesi (API'den gelen)
export interface ThreadCategory {
    id: number;
    title: string;
    slug: string;
}

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
    // API'den gelen user ve category objeleri
    user?: ThreadUser;
    category?: ThreadCategory;
    // Eski uyumluluk için (deprecated, user kullanılmalı)
    author?: {
        username: string;
        avatar: string;
    };
    categoryName?: string;
    replyCount?: number;
    tags?: string[];
    isPinned?: boolean;
    // Search specific fields
    username?: string;
    postCount?: number;
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
