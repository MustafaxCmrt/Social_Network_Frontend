import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequest } from '../types';
import { authService } from '../services/authService';
import { isAdmin as checkIsAdmin, isModerator as checkIsModerator, isAdminOrModerator as checkIsAdminOrModerator } from '../types/roles';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    isAdminOrModerator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial check on mount
    useEffect(() => {
        const checkAuth = async () => {
            // Login sayfasindayken API cagirma - race condition onleme
            // Sadece token'lari temizle
            if (window.location.pathname === '/login') {
                setIsLoading(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                } catch (error: any) {
                    console.error('Failed to fetch user', error);
                    
                    // Try to refresh token if it's a 401 error
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken && (error.message?.includes('401') || error.message?.includes('Unauthorized'))) {
                        try {
                            console.log('Attempting to refresh token...');
                            const refreshResponse = await authService.refreshToken(refreshToken);
                            
                            if (refreshResponse.accessToken && refreshResponse.refreshToken) {
                                localStorage.setItem('accessToken', refreshResponse.accessToken);
                                localStorage.setItem('refreshToken', refreshResponse.refreshToken);
                                
                                // Try to get user again with new token
                                const userData = await authService.getCurrentUser();
                                setUser(userData);
                                return;
                            }
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                            // Refresh failed - clear tokens and logout
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                        }
                    } else {
                        // Not a 401 or no refresh token - clear tokens
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                    }
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (data: LoginRequest) => {
        // Login oncesi eski token'lari temizle
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        const response = await authService.login(data);

        // Token kontrolu - backend token donmediyse hata firlat
        if (!response.accessToken || !response.refreshToken) {
            throw new Error('Giris basarisiz - token alinamadi');
        }

        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);

        // Fetch user details immediately after login
        const userData = await authService.getCurrentUser();
        setUser(userData);
    };

    const logout = async () => {
        // Optimistic update
        setUser(null);
        await authService.logout();
    };

    // Debug: Backend'den gelen role değerini göster
    React.useEffect(() => {
        if (user) {
            console.log('🔐 Auth Debug:', {
                userId: user.userId,
                username: user.username,
                role: user.role,
                roleType: typeof user.role,
                isAdmin: user.isAdmin,
                calculated: {
                    isAdmin: checkIsAdmin(user),
                    isModerator: checkIsModerator(user),
                    isAdminOrModerator: checkIsAdminOrModerator(user)
                }
            });
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: checkIsAdmin(user),
            isModerator: checkIsModerator(user),
            isAdminOrModerator: checkIsAdminOrModerator(user)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
