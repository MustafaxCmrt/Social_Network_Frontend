import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequest } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
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
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    // Invalid token? Clear it.
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
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

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.isAdmin || user?.role === 'Admin' || false
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
