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
        let isMounted = true;
        
        const checkAuth = async () => {
            // Login sayfasindayken API cagirma - race condition onleme
            // Sadece token'lari temizle
            if (window.location.pathname === '/login') {
                if (isMounted) {
                    setIsLoading(false);
                }
                return;
            }

            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!token && !refreshToken) {
                if (isMounted) {
                    setIsLoading(false);
                }
                return;
            }

            if (token) {
                try {
                    const userData = await authService.getCurrentUser();
                    if (isMounted) {
                        setUser(userData);
                        setIsLoading(false);
                    }
                    return;
                } catch (error: any) {
                    console.error('Failed to fetch user:', error);
                    
                    // Try to refresh token if it's a 401/Unauthorized error
                    if (refreshToken && (error.message?.includes('401') || error.message?.includes('Unauthorized'))) {
                        try {
                            console.log('Attempting to refresh token...');
                            const refreshResponse = await authService.refreshToken(refreshToken);
                            
                            if (refreshResponse.accessToken && refreshResponse.refreshToken) {
                                localStorage.setItem('accessToken', refreshResponse.accessToken);
                                localStorage.setItem('refreshToken', refreshResponse.refreshToken);
                                
                                // Try to get user again with new token
                                const userData = await authService.getCurrentUser();
                                if (isMounted) {
                                    setUser(userData);
                                    setIsLoading(false);
                                }
                                return;
                            }
                        } catch (refreshError: any) {
                            console.error('Token refresh failed:', refreshError);
                            // Only clear tokens if refresh really failed (not just a network error)
                            if (refreshError.message?.includes('401') || refreshError.message?.includes('Unauthorized') || refreshError.message?.includes('expired')) {
                                if (isMounted) {
                                    localStorage.removeItem('accessToken');
                                    localStorage.removeItem('refreshToken');
                                    setUser(null);
                                }
                            }
                        }
                    } else {
                        // Not a 401 or no refresh token - but don't clear tokens immediately
                        // Might be a network error or temporary issue
                        console.warn('Auth check failed but not clearing tokens:', error.message);
                    }
                }
            } else if (refreshToken) {
                // Only refresh token exists, try to refresh
                try {
                    console.log('Only refresh token exists, attempting refresh...');
                    const refreshResponse = await authService.refreshToken(refreshToken);
                    
                    if (refreshResponse.accessToken && refreshResponse.refreshToken) {
                        localStorage.setItem('accessToken', refreshResponse.accessToken);
                        localStorage.setItem('refreshToken', refreshResponse.refreshToken);
                        
                        const userData = await authService.getCurrentUser();
                        if (isMounted) {
                            setUser(userData);
                            setIsLoading(false);
                        }
                        return;
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    if (isMounted) {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        setUser(null);
                    }
                }
            }
            
            if (isMounted) {
                setIsLoading(false);
            }
        };

        checkAuth();
        
        return () => {
            isMounted = false;
        };
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
