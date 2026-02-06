import { api } from './api';
import type { 
    Club, 
    CreateClubDto, 
    UpdateClubDto, 
    ClubListResponse,
    CreateClubRequestDto,
    ClubRequest,
    ClubRequestListResponse,
    ReviewClubRequestDto,
    ClubMembership,
    UserClubMembership,
    ClubMembersListResponse,
    MembershipActionDto,
    UpdateMembershipRoleDto,
    MembershipStatus,
    ClubApplicationListResponse,
    UpdateApplicationStatusDto,
    ClubApplicationStatus
} from '../types/club';

export const clubService = {
    /**
     * Get all clubs with search and pagination
     * GET /api/Club/get-all
     */
    getAll: async (page: number = 1, pageSize: number = 10, search?: string): Promise<ClubListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });
        
        if (search && search.trim()) {
            params.append('search', search.trim());
        }
        
        return api.get<ClubListResponse>(`/Club/get-all?${params.toString()}`);
    },

    /**
     * Get club details by ID or slug
     * GET /api/Club/get/{identifier}
     */
    getById: async (identifier: string | number): Promise<Club> => {
        return api.get<Club>(`/Club/get/${identifier}`);
    },

    /**
     * Create a new club (admin only)
     * POST /api/Club/create
     */
    create: async (data: CreateClubDto): Promise<Club> => {
        return api.post<Club>('/Club/create', data);
    },

    /**
     * Update club (admin or president)
     * PUT /api/Club/update
     */
    update: async (data: UpdateClubDto): Promise<Club> => {
        return api.put<Club>('/Club/update', data);
    },

    /**
     * Delete club (admin only)
     * DELETE /api/Club/delete/{id}
     */
    delete: async (id: number): Promise<void> => {
        return api.delete<void>(`/Club/delete/${id}`);
    },

    /**
     * Upload club image (logo or banner)
     * POST /api/Club/{id}/upload-image
     */
    uploadImage: async (clubId: number, file: File, type: 'logo' | 'banner'): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.upload<{ url: string } | string>(
            `/Club/${clubId}/upload-image?type=${type}`,
            file
        );
        
        // Response string veya object olabilir
        return typeof response === 'string' ? response : response.url || '';
    },

    // ========== CLUB REQUEST ENDPOINTS ==========

    /**
     * Create a club request (user)
     * POST /api/Club/requests/create
     */
    createRequest: async (data: CreateClubRequestDto): Promise<ClubRequest> => {
        return api.post<ClubRequest>('/Club/requests/create', data);
    },

    /**
     * Get pending club requests (admin/moderator)
     * GET /api/Club/requests/get-pending
     */
    getPendingRequests: async (page: number = 1, pageSize: number = 10): Promise<ClubRequestListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });
        
        return api.get<ClubRequestListResponse>(`/Club/requests/get-pending?${params.toString()}`);
    },

    /**
     * Review club request (approve/reject) (admin/moderator)
     * PUT /api/Club/requests/{requestId}/review
     */
    reviewRequest: async (requestId: number, data: ReviewClubRequestDto): Promise<ClubRequest> => {
        return api.put<ClubRequest>(`/Club/requests/${requestId}/review`, {
            ...data,
            requestId
        });
    },

    /**
     * Get user's own club requests
     * GET /api/Club/requests/get-mine
     */
    getMyRequests: async (): Promise<ClubRequest[]> => {
        return api.get<ClubRequest[]>('/Club/requests/get-mine');
    },

    /**
     * Get user's club applications (join requests)
     * GET /api/Club/my-applications
     */
    getMyApplications: async (page: number = 1, pageSize: number = 10, status?: ClubApplicationStatus): Promise<ClubApplicationListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });
        
        if (status !== undefined) {
            params.append('status', status.toString());
        }
        
        return api.get<ClubApplicationListResponse>(`/Club/my-applications?${params.toString()}`);
    },

    /**
     * Update club application status
     * PATCH /api/Club/{id}/application-status
     */
    updateApplicationStatus: async (clubId: number, data: UpdateApplicationStatusDto): Promise<void> => {
        return api.patch<void>(`/Club/${clubId}/application-status`, data);
    },

    // ========== CLUB MEMBERSHIP ENDPOINTS ==========

    /**
     * Join a club
     * POST /api/Club/{clubId}/join
     */
    join: async (clubId: number, joinNote?: string): Promise<ClubMembership> => {
        return api.post<ClubMembership>(`/Club/${clubId}/join`, {
            clubId,
            joinNote: joinNote || null
        });
    },

    /**
     * Leave a club
     * POST /api/Club/{clubId}/leave
     */
    leave: async (clubId: number): Promise<ClubMembership> => {
        return api.post<ClubMembership>(`/Club/${clubId}/leave`, {});
    },

    /**
     * Get user's clubs (memberships)
     * GET /api/Club/get-mine
     */
    getMine: async (): Promise<UserClubMembership[]> => {
        return api.get<UserClubMembership[]>('/Club/get-mine');
    },

    /**
     * Get club members
     * GET /api/Club/{clubId}/members
     */
    getMembers: async (clubId: number, page: number = 1, pageSize: number = 20, status?: MembershipStatus): Promise<ClubMembersListResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });
        
        if (status !== undefined) {
            params.append('status', status.toString());
        }
        
        return api.get<ClubMembersListResponse>(`/Club/${clubId}/members?${params.toString()}`);
    },

    /**
     * Perform membership action (approve/reject/kick)
     * PUT /api/Club/memberships/{membershipId}
     */
    performMembershipAction: async (membershipId: number, action: MembershipActionDto['action']): Promise<void> => {
        return api.put<void>(`/Club/memberships/${membershipId}`, {
            membershipId,
            action
        });
    },

    /**
     * Update member role
     * PUT /api/Club/memberships/{membershipId}/role
     */
    updateMemberRole: async (membershipId: number, newRole: UpdateMembershipRoleDto['newRole']): Promise<void> => {
        return api.put<void>(`/Club/memberships/${membershipId}/role`, {
            membershipId,
            newRole
        });
    },
};
