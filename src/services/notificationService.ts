import { api } from './api';
import type { NotificationResponse, NotificationSummary } from '../types/notification';

export const notificationService = {
    // Get My Notifications
    getMyNotifications: async (page: number = 1, pageSize: number = 20, onlyUnread: boolean = false): Promise<NotificationResponse> => {
        return await api.get<NotificationResponse>(`/Notification/my?page=${page}&pageSize=${pageSize}&onlyUnread=${onlyUnread}`);
    },

    // Get Summary (Unread Count)
    getSummary: async (): Promise<NotificationSummary> => {
        return await api.get<NotificationSummary>('/Notification/summary');
    },

    // Mark as Read
    markAsRead: async (id: number): Promise<void> => {
        return await api.put<void>(`/Notification/${id}/read`, {});
    },

    // Mark All as Read
    markAllAsRead: async (): Promise<void> => {
        return await api.put<void>('/Notification/mark-all-read', {});
    },

    // Delete Notification
    delete: async (id: number): Promise<void> => {
        return await api.delete<void>(`/Notification/${id}`);
    }
};
