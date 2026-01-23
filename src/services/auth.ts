// import { api } from './api';

// Types - Backend'den gelecek veriye göre güncelleyeceğiz
export interface User {
  id: string;
  email: string;
  username: string;
  // avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Login Endpoint
  login: async (credentials: { email: string; password: string }) => {
    // ÖRNEK: return api.post<AuthResponse>('/auth/login', credentials);
    console.log('Login attempt with:', credentials);
    // Mock response for now
    return {
      user: { id: '1', email: credentials.email, username: 'demo' },
      token: 'mock-jwt-token'
    };
  },

  // Register Endpoint
  register: async (credentials: { username: string; email: string; password: string }) => {
    // ÖRNEK: return api.post<AuthResponse>('/auth/register', credentials);
    console.log('Register attempt with:', credentials);
    return {
      user: { id: '2', email: credentials.email, username: credentials.username },
      token: 'mock-jwt-token'
    };
  }
};
