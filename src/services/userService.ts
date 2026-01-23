import { api } from './api';
import type { User } from '../types';

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    profileImg?: string;
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
}

export const userService = {
    updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
        return api.put<User>('/User/me', data);
    },

    uploadProfileImage: async (file: File): Promise<void> => {
        // Backend returns 200 OK
        return api.upload<void>('/User/upload-profile-image', file);
    },

    deleteAccount: async (): Promise<void> => {
        return api.delete<void>('/User/me');
    }
};
