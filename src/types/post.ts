export interface Post {
    id: number;
    threadId: number;
    userId: number;
    content: string;
    img?: string | null;
    isSolution: boolean;
    upvoteCount: number;
    parentPostId?: number | null;
    replyCount?: number;
    createdAt: string;
    updatedAt: string;
    // Backend'den gelip gelmeyeceğini kontrol etmenizi öneririm, mock için opsiyonel
    author?: {
        username: string;
        avatar: string;
    };
}

export interface PostResponse {
    items: Post[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface CreatePostDto {
    threadId: number;
    content: string;
    img?: string;
    parentPostId?: number;
}

export interface UpdatePostDto {
    id: number;
    content: string;
    img?: string;
}

export interface PostFilterParams {
    page?: number;
    pageSize?: number;
}
