// Backend Roles enum'u ile uyumlu
export const Roles = {
    User: 0,
    Moderator: 1,
    Admin: 2
} as const;

export type Role = typeof Roles[keyof typeof Roles];

// Role değerini parse et
const parseRole = (role?: string | number): number => {
    if (role === undefined || role === null) return Roles.User;
    
    // String ise
    if (typeof role === 'string') {
        // "Admin", "Moderator", "User" string'leri
        if (role === 'Admin') return Roles.Admin;
        if (role === 'Moderator') return Roles.Moderator;
        if (role === 'User') return Roles.User;
        
        // Sayı string'i ise ("0", "1", "2")
        const parsed = parseInt(role, 10);
        return isNaN(parsed) ? Roles.User : parsed;
    }
    
    // Number ise direkt döndür
    return role;
};

// Helper functions
export const isAdmin = (user: { role?: string | number; isAdmin?: boolean } | null): boolean => {
    if (!user) return false;
    
    // Fallback: isAdmin boolean kontrolü (geriye dönük uyumluluk)
    if (user.isAdmin === true) return true;
    
    const roleValue = parseRole(user.role);
    return roleValue === Roles.Admin;
};

export const isModerator = (user: { role?: string | number } | null): boolean => {
    if (!user) return false;
    const roleValue = parseRole(user.role);
    return roleValue === Roles.Moderator;
};

export const isAdminOrModerator = (user: { role?: string | number; isAdmin?: boolean } | null): boolean => {
    if (!user) return false;
    
    // Fallback: isAdmin boolean kontrolü (geriye dönük uyumluluk)
    if (user.isAdmin === true) return true;
    
    const roleValue = parseRole(user.role);
    return roleValue >= Roles.Moderator; // Moderator(1) veya Admin(2)
};

export const getRoleName = (role: string | number): string => {
    const roleValue = typeof role === 'string' ? parseInt(role, 10) : role;
    switch (roleValue) {
        case Roles.Admin:
            return 'Admin';
        case Roles.Moderator:
            return 'Moderatör';
        case Roles.User:
            return 'Kullanıcı';
        default:
            return 'Bilinmeyen';
    }
};
