export interface User {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
    refreshToken: string;
    refreshTokenExpiresInDays: number;
}

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterResponse {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    message: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

