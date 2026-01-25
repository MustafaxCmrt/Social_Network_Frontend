export interface User {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    isAdmin: boolean;
    isActive: boolean;
    profileImg?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
    refreshToken: string;
    refreshTokenExpiresInDays: number;
    // Login response'tan gelen kullanıcı bilgileri
    userId: number;
    username: string;
    email: string;
    role: string;
    isAdmin: boolean;
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


export interface ResendVerificationRequest {
    email: string;
}
