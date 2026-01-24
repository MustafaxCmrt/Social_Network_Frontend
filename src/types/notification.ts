export interface Notification {
    id: number;
    title: string;
    message: string; // or content
    type: string; // e.g., 'Like', 'Comment', 'Follow', 'System'
    isRead: boolean;
    createdAt: string;
    relatedEntityId?: number; // e.g., PostId, ThreadId
    relatedUserId?: number; // The user who triggered the notification
    relatedUserName?: string;
    relatedUserProfileImg?: string;
    link?: string; // Calculated link to navigate to
}

export interface NotificationSummary {
    unreadCount: number;
    totalCount: number;
    lastNotificationDate: string | null;
}

export interface NotificationResponse {
    items: Notification[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}
