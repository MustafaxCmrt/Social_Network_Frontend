// Ortak User objesi (API'den gelen)
export interface PostUser {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    profileImg: string | null;
    fullName: string;
}

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
    // API'den gelen user objesi
    user?: PostUser;
    // Eski uyumluluk için (deprecated, user kullanılmalı)
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

export interface MarkSolutionDto {
    threadId: number;
    postId: number;
}

export interface UpvoteResponse {
    postId: number;
    isUpvoted: boolean;
    totalUpvotes: number;
    message?: string;
}

export interface VoteStatusResponse {
    postId: number;
    isUpvoted: boolean;
    totalUpvotes: number;
}
