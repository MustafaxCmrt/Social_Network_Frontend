// Club Enums as const objects (TypeScript erasableSyntaxOnly uyumlu)
export const MembershipStatus = {
    Pending: 0,
    Approved: 1,
    Rejected: 2,
    Left: 3,
    Kicked: 4
} as const;

export type MembershipStatus = typeof MembershipStatus[keyof typeof MembershipStatus];

export const MembershipAction = {
    Approve: 0,
    Reject: 1,
    Kick: 2
} as const;

export type MembershipAction = typeof MembershipAction[keyof typeof MembershipAction];

export const ClubRole = {
    Member: 0,
    Officer: 1,
    VicePresident: 2,
    President: 3
} as const;

export type ClubRole = typeof ClubRole[keyof typeof ClubRole];

export const ClubRequestStatus = {
    Pending: 0,
    Approved: 1,
    Rejected: 2
} as const;

export type ClubRequestStatus = typeof ClubRequestStatus[keyof typeof ClubRequestStatus];

// Club Application Status (for club applications/join requests)
export const ClubApplicationStatus = {
    Pending: 0,
    Approved: 1,
    Rejected: 2
} as const;

export type ClubApplicationStatus = typeof ClubApplicationStatus[keyof typeof ClubApplicationStatus];

// Helper functions for enum display
export const getMembershipStatusText = (status: MembershipStatus): string => {
    switch (status) {
        case MembershipStatus.Pending:
            return 'Beklemede';
        case MembershipStatus.Approved:
            return 'Onaylandı';
        case MembershipStatus.Rejected:
            return 'Reddedildi';
        case MembershipStatus.Left:
            return 'Ayrıldı';
        case MembershipStatus.Kicked:
            return 'Atıldı';
        default:
            return 'Bilinmeyen';
    }
};

export const getClubRoleText = (role: ClubRole): string => {
    switch (role) {
        case ClubRole.Member:
            return 'Üye';
        case ClubRole.Officer:
            return 'Yönetim Kurulu';
        case ClubRole.VicePresident:
            return 'Başkan Yardımcısı';
        case ClubRole.President:
            return 'Başkan';
        default:
            return 'Bilinmeyen';
    }
};

export const getClubRequestStatusText = (status: ClubRequestStatus): string => {
    switch (status) {
        case ClubRequestStatus.Pending:
            return 'Beklemede';
        case ClubRequestStatus.Approved:
            return 'Onaylandı';
        case ClubRequestStatus.Rejected:
            return 'Reddedildi';
        default:
            return 'Bilinmeyen';
    }
};

export const getClubApplicationStatusText = (status: ClubApplicationStatus): string => {
    switch (status) {
        case ClubApplicationStatus.Pending:
            return 'Beklemede';
        case ClubApplicationStatus.Approved:
            return 'Onaylandı';
        case ClubApplicationStatus.Rejected:
            return 'Reddedildi';
        default:
            return 'Bilinmeyen';
    }
};

export interface Club {
    id: number;
    name: string;
    slug: string;
    description: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    isPublic: boolean;
    requiresApproval: boolean;
    memberCount: number;
    founderId: number;
    founderUsername: string;
    createdAt: string;
    isMember: boolean | null;
    currentUserRole: number | null;
    currentUserStatus: number | null;
}

export interface CreateClubDto {
    name: string;
    description: string;
    isPublic: boolean;
    requiresApproval: boolean;
}

export interface UpdateClubDto {
    id: number;
    name: string;
    description: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    isPublic: boolean;
    requiresApproval: boolean;
}

export interface ClubListResponse {
    items: Club[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Club Request Types
export interface CreateClubRequestDto {
    name: string;
    description: string;
    purpose: string;
}

export interface ClubRequest {
    id: number;
    name: string;
    description: string;
    purpose: string;
    status: ClubRequestStatus;
    requestedByUserId: number;
    requestedByUsername: string;
    createdAt: string;
    reviewedByUserId: number | null;
    reviewedByUsername: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
}

export interface ClubRequestListResponse {
    items: ClubRequest[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface ReviewClubRequestDto {
    requestId: number;
    approve: boolean;
    rejectionReason?: string | null;
}

// Club Membership Types
export interface ClubMembership {
    membershipId: number;
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImg: string | null;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string | null;
    joinNote: string | null;
    // Optional fields for pending memberships endpoint
    clubId?: number;
    clubName?: string;
}

export interface JoinClubDto {
    clubId: number;
    joinNote?: string | null;
}

// User's Club Membership (from get-mine)
export interface UserClubMembership {
    clubId: number;
    clubName: string;
    clubSlug: string;
    logoUrl: string | null;
    myRole: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
}

// Club Members List Response
export interface ClubMembersListResponse {
    items: ClubMembership[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Membership Action DTO
export interface MembershipActionDto {
    membershipId: number;
    action: MembershipAction;
}

// Update Role DTO
export interface UpdateMembershipRoleDto {
    membershipId: number;
    newRole: ClubRole;
}

// Club Application Types (for my-applications endpoint)
export interface ClubApplication {
    id: number;
    name: string;
    slug: string;
    description: string;
    logoUrl: string | null;
    memberCount: number;
    isPublic: boolean;
    founderId: number;
    founderUsername: string;
    applicationStatus: ClubApplicationStatus;
    rejectionReason: string | null;
    reviewedAt: string | null;
}

export interface ClubApplicationListResponse {
    items: ClubApplication[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Update Application Status DTO
export interface UpdateApplicationStatusDto {
    status: ClubApplicationStatus;
    rejectionReason?: string | null;
}
