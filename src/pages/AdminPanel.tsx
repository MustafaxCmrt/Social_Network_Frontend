import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { moderationService } from '../services/moderationService';
import { dashboardService } from '../services/dashboardService';
import { auditLogService } from '../services/auditLogService';
import { userService } from '../services/userService';
import { reportService } from '../services/reportService';
import { clubService } from '../services/clubService';
import type { UserBan, UserMute, BanUserRequest, MuteUserRequest, UserSearchResult, ThreadSearchResult } from '../services/moderationService';
import type { DashboardStats, TopUser, TopReported } from '../services/dashboardService';
import type { AuditLogItem, AuditLogFilters } from '../services/auditLogService';
import type { UserListItem, UserProfile, UserThreadListItem, UserPostListItem } from '../services/userService';
import type { Report, UpdateReportStatusDto } from '../types/report';
import { ReportStatus, getReportReasonText, getReportStatusText } from '../types/report';
import type { Club, CreateClubDto, ClubRequest, ReviewClubRequestDto } from '../types/club';
import {
    Shield,
    Ban,
    VolumeX,
    Search,
    Clock,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    Lock,
    Unlock,
    MessageSquare,
    Users,
    FileText,
    TrendingUp,
    Activity,
    BarChart3,
    Calendar,
    Crown,
    Zap,
    History,
    Filter,
    XCircle,
    Trash2,
    Eye,
    X,
    Info,
    AlertCircle,
    ChevronDown,
    Pencil,
    ArrowLeft,
    Flag,
    User,
    Building2,
    Plus
} from 'lucide-react';
import '../styles/Admin.css';
import { Modal } from '../components/UI/Modal';

const AdminPanel: React.FC = () => {
    const { isAdminOrModerator, isAuthenticated, isLoading } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    // URL-based section persistence
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSection = (searchParams.get('section') as 'dashboard' | 'users' | 'user-detail' | 'ban' | 'mute' | 'thread' | 'logs' | 'reports' | 'clubs' | 'club-requests') || 'dashboard';

    // Sidebar state
    const [activeSection, setActiveSectionState] = useState<'dashboard' | 'users' | 'user-detail' | 'ban' | 'mute' | 'thread' | 'logs' | 'reports' | 'clubs' | 'club-requests'>(initialSection);

    // Wrapper to update both state and URL
    const setActiveSection = (section: 'dashboard' | 'users' | 'user-detail' | 'ban' | 'mute' | 'thread' | 'logs' | 'reports' | 'clubs' | 'club-requests') => {
        setActiveSectionState(section);
        setSearchParams({ section });
    };

    // User Detail state
    const [viewUser, setViewUser] = useState<UserProfile | null>(null);
    const [viewUserLoading, setViewUserLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'threads' | 'posts'>('profile');
    const [userThreads, setUserThreads] = useState<UserThreadListItem[]>([]);
    const [userPosts, setUserPosts] = useState<UserPostListItem[]>([]);
    const [userContentLoading, setUserContentLoading] = useState(false);
    const [threadsPage, setThreadsPage] = useState(1);
    const [threadsTotalPages, setThreadsTotalPages] = useState(0);
    const [postsPage, setPostsPage] = useState(1);
    const [postsTotalPages, setPostsTotalPages] = useState(0);

    // Dashboard state
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [topReported, setTopReported] = useState<TopReported[]>([]);
    const [topReportedCount, setTopReportedCount] = useState(10);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    // Audit Log state
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [auditPage, setAuditPage] = useState(1);
    const [auditTotalPages, setAuditTotalPages] = useState(0);
    const [auditTotalCount, setAuditTotalCount] = useState(0);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditFilters, setAuditFilters] = useState<AuditLogFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
    const [cleanupDays, setCleanupDays] = useState(90);
    const [cleanupLoading, setCleanupLoading] = useState(false);

    // Reports state
    const [reports, setReports] = useState<Report[]>([]);
    const [reportsPage, setReportsPage] = useState(1);
    const [reportsTotalPages, setReportsTotalPages] = useState(0);
    const [reportsTotalCount, setReportsTotalCount] = useState(0);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportStatusFilter, setReportStatusFilter] = useState<number>(0); // 0 = all
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
    const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
    const [updateStatusData, setUpdateStatusData] = useState<UpdateReportStatusDto>({
        status: ReportStatus.Pending,
        adminNote: ''
    });

    // User search (legacy - ID based)
    const [searchUserId, setSearchUserId] = useState<string>('');

    // Thread search (legacy - ID based)
    const [searchThreadId, setSearchThreadId] = useState<string>('');
    const [threadLoading, setThreadLoading] = useState(false);

    // User search (autocomplete)
    const [userSearchQuery, setUserSearchQuery] = useState<string>('');
    const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    // Thread search (autocomplete)
    const [threadSearchQuery, setThreadSearchQuery] = useState<string>('');
    const [threadSearchResults, setThreadSearchResults] = useState<ThreadSearchResult[]>([]);
    const [selectedThread, setSelectedThread] = useState<ThreadSearchResult | null>(null);
    const [threadSearchLoading, setThreadSearchLoading] = useState(false);
    const [showThreadDropdown, setShowThreadDropdown] = useState(false);

    // Ban state
    const [banReason, setBanReason] = useState('');
    const [banExpiresAt, setBanExpiresAt] = useState('');
    const [isPermanentBan, setIsPermanentBan] = useState(false);
    const [banLoading, setBanLoading] = useState(false);

    // Mute state
    const [muteReason, setMuteReason] = useState('');
    const [muteExpiresAt, setMuteExpiresAt] = useState('');
    const [muteLoading, setMuteLoading] = useState(false);

    // Results with pagination
    const [userBans, setUserBans] = useState<UserBan[]>([]);
    const [userBansPage, setUserBansPage] = useState(1);
    const [userBansTotalPages, setUserBansTotalPages] = useState(0);
    const [userBansTotalCount, setUserBansTotalCount] = useState(0);

    const [userMutes, setUserMutes] = useState<UserMute[]>([]);
    const [userMutesPage, setUserMutesPage] = useState(1);
    const [userMutesTotalPages, setUserMutesTotalPages] = useState(0);
    const [userMutesTotalCount, setUserMutesTotalCount] = useState(0);

    // Modal state
    const [unbanModal, setUnbanModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });
    const [unmuteModal, setUnmuteModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });

    // User Management state
    const [userList, setUserList] = useState<UserListItem[]>([]);
    const [userListPage, setUserListPage] = useState(1);
    const [userListTotalPages, setUserListTotalPages] = useState(0);
    const [userListTotalCount, setUserListTotalCount] = useState(0);
    const [userListSearch, setUserListSearch] = useState('');
    const [userListLoading, setUserListLoading] = useState(false);

    // User Create/Edit Modal state
    const [userModal, setUserModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; user: UserListItem | null }>({ isOpen: false, mode: 'create', user: null });
    const [userFormData, setUserFormData] = useState<{
        firstName: string;
        lastName: string;
        username: string;
        email: string;
        password: string;
        role: string;
        isActive: boolean;
    }>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        role: 'User',
        isActive: true
    });
    const [userFormLoading, setUserFormLoading] = useState(false);

    // User Delete Modal state
    const [deleteUserModal, setDeleteUserModal] = useState<{ isOpen: boolean; user: UserListItem | null }>({ isOpen: false, user: null });
    const [deleteUserLoading, setDeleteUserLoading] = useState(false);

    // Club Management state
    const [clubs, setClubs] = useState<Club[]>([]);
    const [clubsPage, setClubsPage] = useState(1);
    const [clubsPageSize] = useState(10);
    const [clubsTotalPages, setClubsTotalPages] = useState(0);
    const [clubsTotalCount, setClubsTotalCount] = useState(0);
    const [clubsSearch, setClubsSearch] = useState('');
    const [clubsLoading, setClubsLoading] = useState(false);
    const [clubModal, setClubModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; club: Club | null }>({ isOpen: false, mode: 'create', club: null });
    const [clubFormData, setClubFormData] = useState<CreateClubDto & { logoUrl: string | null; bannerUrl: string | null }>({
        name: '',
        description: '',
        isPublic: true,
        requiresApproval: true,
        logoUrl: null,
        bannerUrl: null
    });
    const [clubFormLoading, setClubFormLoading] = useState(false);
    const [deleteClubModal, setDeleteClubModal] = useState<{ isOpen: boolean; club: Club | null }>({ isOpen: false, club: null });
    const [deleteClubLoading, setDeleteClubLoading] = useState(false);

    // Club Requests state (admin)
    const [clubRequests, setClubRequests] = useState<ClubRequest[]>([]);
    const [clubRequestsPage, setClubRequestsPage] = useState(1);
    const [clubRequestsPageSize] = useState(10);
    const [clubRequestsTotalPages, setClubRequestsTotalPages] = useState(0);
    const [clubRequestsTotalCount, setClubRequestsTotalCount] = useState(0);
    const [clubRequestsLoading, setClubRequestsLoading] = useState(false);
    const [reviewRequestModal, setReviewRequestModal] = useState<{ isOpen: boolean; request: ClubRequest | null }>({ isOpen: false, request: null });
    const [reviewRequestData, setReviewRequestData] = useState<ReviewClubRequestDto>({
        requestId: 0,
        approve: true,
        rejectionReason: null
    });
    const [reviewRequestLoading, setReviewRequestLoading] = useState(false);

    // Sidebar state
    const [permissionsExpanded, setPermissionsExpanded] = useState(false);
    const [clubsExpanded, setClubsExpanded] = useState(false);

    // Redirect if not admin
    // Redirect if not admin
    useEffect(() => {
        if (isLoading) return; // Wait for auth loading

        if (!isAuthenticated) {
            navigate('/login');
        } else if (!isAdminOrModerator) {
            navigate('/');
        }
    }, [isAuthenticated, isAdminOrModerator, isLoading, navigate]);

    // Load dashboard data on mount and when topReportedCount changes
    useEffect(() => {
        if (isAdminOrModerator && activeSection === 'dashboard') {
            loadDashboardData();
        }
    }, [isAdminOrModerator, activeSection, topReportedCount]);

    // Load audit logs when section changes or page changes
    useEffect(() => {
        if (isAdminOrModerator && activeSection === 'logs') {
            loadAuditLogs();
        }
    }, [isAdminOrModerator, activeSection, auditPage, auditFilters]);

    // Load reports when section changes or page/filter changes
    useEffect(() => {
        if (isAdminOrModerator && activeSection === 'reports') {
            loadReports();
        }
    }, [isAdminOrModerator, activeSection, reportsPage, reportStatusFilter]);

    // Load clubs when section changes or page/search changes
    useEffect(() => {
        if (isAdminOrModerator && activeSection === 'clubs') {
            loadClubs();
        }
    }, [isAdminOrModerator, activeSection, clubsPage, clubsSearch]);

    // Load club requests when section changes or page changes
    useEffect(() => {
        if (isAdminOrModerator && activeSection === 'club-requests') {
            loadClubRequests();
        }
    }, [isAdminOrModerator, activeSection, clubRequestsPage]);

    // Load user profile from URL on page refresh
    useEffect(() => {
        if (isAdminOrModerator && initialSection === 'user-detail') {
            const userId = searchParams.get('userId');
            if (userId) {
                loadUserProfileFromUrl(parseInt(userId, 10));
            }
        }
    }, [isAdminOrModerator]);

    const loadUserProfileFromUrl = async (userId: number) => {
        setViewUserLoading(true);
        try {
            const profile = await userService.getUserProfile(userId);
            setViewUser(profile);
            setActiveTab('profile');
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcı profili yüklenemedi.');
        } finally {
            setViewUserLoading(false);
        }
    };

    const loadDashboardData = async () => {
        setDashboardLoading(true);
        try {
            const [stats, users, reported] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getTopUsers(5),
                dashboardService.getTopReported(topReportedCount)
            ]);
            setDashboardStats(stats);
            setTopUsers(users);
            setTopReported(reported);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Dashboard verileri yüklenemedi.');
        } finally {
            setDashboardLoading(false);
        }
    };

    const loadAuditLogs = async () => {
        setAuditLoading(true);
        try {
            const response = await auditLogService.getLogs({
                ...auditFilters,
                page: auditPage,
                pageSize: 50
            });
            setAuditLogs(response.items);
            setAuditTotalPages(response.totalPages);
            setAuditTotalCount(response.totalCount);
        } catch (error: any) {
            toast.error('Hata', error.message || 'İşlem geçmişi yüklenemedi.');
        } finally {
            setAuditLoading(false);
        }
    };

    const loadReports = async () => {
        setReportsLoading(true);
        try {
            const response = await reportService.getAllReports(
                reportsPage,
                10,
                reportStatusFilter === 0 ? undefined : reportStatusFilter
            );
            setReports(response.items);
            setReportsTotalPages(response.totalPages);
            setReportsTotalCount(response.totalCount);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Raporlar yüklenemedi.');
        } finally {
            setReportsLoading(false);
        }
    };

    const handleViewReportDetail = async (report: Report) => {
        try {
            const fullReport = await reportService.getById(report.id);
            setSelectedReport(fullReport);
            setIsReportDetailModalOpen(true);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Rapor detayı yüklenemedi.');
        }
    };

    const handleOpenUpdateStatus = (report: Report) => {
        setSelectedReport(report);
        setUpdateStatusData({
            status: report.status,
            adminNote: report.adminNote || ''
        });
        setIsUpdateStatusModalOpen(true);
    };

    const handleUpdateReportStatus = async () => {
        if (!selectedReport) return;

        try {
            await reportService.updateStatus(selectedReport.id, updateStatusData);
            toast.success('Başarılı', 'Rapor durumu güncellendi.');
            setIsUpdateStatusModalOpen(false);
            setSelectedReport(null);
            loadReports();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Rapor güncellenemedi.');
        }
    };

    const handleDeleteReport = async (reportId: number) => {
        if (!window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await reportService.delete(reportId);
            toast.success('Başarılı', 'Rapor silindi.');
            loadReports();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Rapor silinemedi.');
        }
    };

    const handleApplyFilters = () => {
        setAuditPage(1);
        loadAuditLogs();
    };

    const handleClearFilters = () => {
        setAuditFilters({});
        setAuditPage(1);
    };

    const handleViewLogDetails = async (logId: number) => {
        try {
            const log = await auditLogService.getLogById(logId);
            setSelectedLog(log);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Log detayları yüklenemedi.');
        }
    };

    const handleCleanupLogs = async () => {
        if (!window.confirm(`${cleanupDays} günden eski tüm loglar silinecek. Devam etmek istiyor musunuz?`)) return;

        setCleanupLoading(true);
        try {
            await auditLogService.cleanup(cleanupDays);
            toast.success('Başarılı', `${cleanupDays} günden eski loglar temizlendi.`);
            loadAuditLogs();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Log temizleme başarısız.');
        } finally {
            setCleanupLoading(false);
        }
    };

    // Autocomplete user search (debounced)
    const handleUserAutocomplete = async (query: string) => {
        setUserSearchQuery(query);

        if (query.length < 2) {
            setUserSearchResults([]);
            setShowUserDropdown(false);
            return;
        }

        setUserSearchLoading(true);
        try {
            const results = await moderationService.searchUsers(query);
            setUserSearchResults(results);
            setShowUserDropdown(true);
        } catch (error) {
            console.error('User autocomplete error:', error);
            setUserSearchResults([]);
        } finally {
            setUserSearchLoading(false);
        }
    };

    // Select user from autocomplete dropdown
    const handleSelectUser = (user: UserSearchResult) => {
        setSelectedUser(user);
        setSearchUserId(user.userId.toString());
        setUserSearchQuery(`@${user.username} (${user.firstName} ${user.lastName})`);
        setShowUserDropdown(false);

        // Auto-fetch bans/mutes for selected user
        handleSearchUserById(user.userId);
    };

    // Search by user ID directly
    const handleSearchUserById = async (userId: number, page: number = 1) => {
        setUserSearchLoading(true);
        try {
            if (activeSection === 'ban') {
                const response = await moderationService.getUserBans(userId, page);
                setUserBans(response.items);
                setUserBansPage(response.page);
                setUserBansTotalPages(response.totalPages);
                setUserBansTotalCount(response.totalCount);
                if (page === 1) {
                    toast.info('Arama Tamamlandı', `${response.totalCount} yasak kaydı bulundu.`);
                }
            } else if (activeSection === 'mute') {
                const response = await moderationService.getUserMutes(userId, page);
                setUserMutes(response.items);
                setUserMutesPage(response.page);
                setUserMutesTotalPages(response.totalPages);
                setUserMutesTotalCount(response.totalCount);
                if (page === 1) {
                    toast.info('Arama Tamamlandı', `${response.totalCount} susturma kaydı bulundu.`);
                }
            }
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcı bilgileri alınamadı.');
        } finally {
            setUserSearchLoading(false);
        }
    };

    // Load bans for specific page
    const loadUserBansPage = async (page: number) => {
        const userId = parseInt(searchUserId);
        if (isNaN(userId)) return;
        handleSearchUserById(userId, page);
    };

    // Load mutes for specific page
    const loadUserMutesPage = async (page: number) => {
        const userId = parseInt(searchUserId);
        if (isNaN(userId)) return;
        handleSearchUserById(userId, page);
    };

    // Autocomplete thread search
    const handleThreadAutocomplete = async (query: string) => {
        setThreadSearchQuery(query);

        if (query.length < 2) {
            setThreadSearchResults([]);
            setShowThreadDropdown(false);
            return;
        }

        setThreadSearchLoading(true);
        try {
            const results = await moderationService.searchThreads(query);
            setThreadSearchResults(results);
            setShowThreadDropdown(true);
        } catch (error) {
            console.error('Thread autocomplete error:', error);
            setThreadSearchResults([]);
        } finally {
            setThreadSearchLoading(false);
        }
    };

    // Select thread from autocomplete dropdown
    const handleSelectThread = (thread: ThreadSearchResult) => {
        setSelectedThread(thread);
        setSearchThreadId(thread.id.toString());
        setThreadSearchQuery(thread.title);
        setShowThreadDropdown(false);
    };

    // Ban user
    const handleBanUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = parseInt(searchUserId);

        if (isNaN(userId) || userId <= 0) {
            toast.error('Geçersiz ID', 'Geçerli bir kullanıcı ID giriniz.');
            return;
        }

        if (!banReason.trim()) {
            toast.error('Eksik Bilgi', 'Yasaklama sebebi giriniz.');
            return;
        }

        if (!isPermanentBan && !banExpiresAt) {
            toast.error('Eksik Bilgi', 'Yasak bitiş tarihi seçiniz veya kalıcı yasak seçiniz.');
            return;
        }

        setBanLoading(true);
        try {
            const request: BanUserRequest = {
                userId,
                reason: banReason.trim(),
                expiresAt: isPermanentBan ? undefined : new Date(banExpiresAt).toISOString()
            };

            await moderationService.banUser(request);
            toast.success('Başarılı', 'Kullanıcı başarıyla yasaklandı!');

            setBanReason('');
            setBanExpiresAt('');
            setIsPermanentBan(false);

            const response = await moderationService.getUserBans(userId, 1);
            setUserBans(response.items);
            setUserBansPage(response.page);
            setUserBansTotalPages(response.totalPages);
            setUserBansTotalCount(response.totalCount);
            loadDashboardData(); // Update stats
        } catch (error: any) {
            toast.error('Hata', error.message || 'Yasaklama işlemi başarısız.');
        } finally {
            setBanLoading(false);
        }
    };

    // Unban user - Open Modal
    const handleUnbanUser = (userId: number) => {
        setUnbanModal({ isOpen: true, userId });
    };

    // Confirm Unban
    const confirmUnban = async () => {
        if (!unbanModal.userId) return;

        try {
            await moderationService.unbanUser(unbanModal.userId);
            toast.success('Başarılı', 'Kullanıcının yasağı kaldırıldı!');

            // Update list if viewing that user
            if (parseInt(searchUserId) === unbanModal.userId) {
                const response = await moderationService.getUserBans(unbanModal.userId, userBansPage);
                setUserBans(response.items);
                setUserBansTotalPages(response.totalPages);
                setUserBansTotalCount(response.totalCount);
            }

            loadDashboardData(); // Update stats
            setUnbanModal({ isOpen: false, userId: null });
        } catch (error: any) {
            toast.error('Hata', error.message || 'Yasak kaldırma işlemi başarısız.');
        }
    };

    // Mute user
    const handleMuteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = parseInt(searchUserId);

        if (isNaN(userId) || userId <= 0) {
            toast.error('Geçersiz ID', 'Geçerli bir kullanıcı ID giriniz.');
            return;
        }

        if (!muteReason.trim()) {
            toast.error('Eksik Bilgi', 'Susturma sebebi giriniz.');
            return;
        }

        if (!muteExpiresAt) {
            toast.error('Eksik Bilgi', 'Susturma bitiş tarihi seçiniz.');
            return;
        }

        setMuteLoading(true);
        try {
            const request: MuteUserRequest = {
                userId,
                reason: muteReason.trim(),
                expiresAt: new Date(muteExpiresAt).toISOString()
            };

            await moderationService.muteUser(request);
            toast.success('Başarılı', 'Kullanıcı başarıyla susturuldu!');

            setMuteReason('');
            setMuteExpiresAt('');

            const response = await moderationService.getUserMutes(userId, 1);
            setUserMutes(response.items);
            setUserMutesPage(response.page);
            setUserMutesTotalPages(response.totalPages);
            setUserMutesTotalCount(response.totalCount);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Susturma işlemi başarısız.');
        } finally {
            setMuteLoading(false);
        }
    };

    // Unmute user - Open Modal
    const handleUnmuteUser = (userId: number) => {
        setUnmuteModal({ isOpen: true, userId });
    };

    // Confirm Unmute
    const confirmUnmute = async () => {
        if (!unmuteModal.userId) return;

        try {
            await moderationService.unmuteUser(unmuteModal.userId);
            toast.success('Başarılı', 'Kullanıcının susturması kaldırıldı!');

            // Update list if viewing that user
            if (parseInt(searchUserId) === unmuteModal.userId) {
                const response = await moderationService.getUserMutes(unmuteModal.userId, userMutesPage);
                setUserMutes(response.items);
                setUserMutesTotalPages(response.totalPages);
                setUserMutesTotalCount(response.totalCount);
            }

            loadDashboardData(); // Update stats
            setUnmuteModal({ isOpen: false, userId: null });
        } catch (error: any) {
            toast.error('Hata', error.message || 'Susturma kaldırma işlemi başarısız.');
        }
    };

    // Lock Thread
    const handleLockThread = async () => {
        const threadId = parseInt(searchThreadId);
        if (isNaN(threadId) || threadId <= 0) {
            toast.error('Geçersiz ID', 'Geçerli bir konu ID giriniz.');
            return;
        }

        setThreadLoading(true);
        try {
            await moderationService.lockThread(threadId);
            toast.success('Başarılı', 'Konu başarıyla kilitlendi!');
            setSearchThreadId('');
        } catch (error: any) {
            toast.error('Hata', error.message || 'Konu kilitleme işlemi başarısız.');
        } finally {
            setThreadLoading(false);
        }
    };

    // Unlock Thread
    const handleUnlockThread = async () => {
        const threadId = parseInt(searchThreadId);
        if (isNaN(threadId) || threadId <= 0) {
            toast.error('Geçersiz ID', 'Geçerli bir konu ID giriniz.');
            return;
        }

        setThreadLoading(true);
        try {
            await moderationService.unlockThread(threadId);
            toast.success('Başarılı', 'Konu kilidi başarıyla kaldırıldı!');
            setSearchThreadId('');
        } catch (error: any) {
            toast.error('Hata', error.message || 'Konu kilit kaldırma işlemi başarısız.');
        } finally {
            setThreadLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format short date
    const formatShortDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short'
        });
    };

    // Get minimum datetime for inputs (now)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    // Calculate max value for chart
    const getMaxActivity = () => {
        if (!dashboardStats?.last7DaysActivity) return 10;
        const max = Math.max(...dashboardStats.last7DaysActivity.map(d =>
            Math.max(d.newUsers, d.newThreads, d.newPosts)
        ));
        return max || 10;
    };


    const loadUserList = async (page: number = 1, search: string = '') => {
        setUserListLoading(true);
        try {
            const response = await userService.getAll(page, 10, search);
            setUserList(response.items);
            setUserListPage(response.page);
            setUserListTotalPages(response.totalPages);
            setUserListTotalCount(response.totalCount);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcılar yüklenemedi.');
        } finally {
            setUserListLoading(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'users') {
            loadUserList(1, userListSearch);
        }
    }, [activeSection]);

    // Reset user form
    const resetUserForm = () => {
        setUserFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            role: 'User',
            isActive: true
        });
    };

    // Open create user modal
    const openCreateUserModal = () => {
        resetUserForm();
        setUserModal({ isOpen: true, mode: 'create', user: null });
    };

    // Open edit user modal
    const openEditUserModal = (user: UserListItem) => {
        setUserFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            isActive: user.isActive
        });
        setUserModal({ isOpen: true, mode: 'edit', user });
    };

    // Close user modal
    const closeUserModal = () => {
        setUserModal({ isOpen: false, mode: 'create', user: null });
        resetUserForm();
    };

    // Handle create user
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userFormData.firstName.trim() || !userFormData.lastName.trim()) {
            toast.error('Eksik Bilgi', 'Ad ve soyad zorunludur.');
            return;
        }
        if (!userFormData.username.trim()) {
            toast.error('Eksik Bilgi', 'Kullanıcı adı zorunludur.');
            return;
        }
        if (!userFormData.email.trim()) {
            toast.error('Eksik Bilgi', 'Email zorunludur.');
            return;
        }
        if (!userFormData.password.trim() || userFormData.password.length < 6) {
            toast.error('Eksik Bilgi', 'Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setUserFormLoading(true);
        try {
            await userService.create({
                firstName: userFormData.firstName.trim(),
                lastName: userFormData.lastName.trim(),
                username: userFormData.username.trim(),
                email: userFormData.email.trim(),
                password: userFormData.password,
                role: userFormData.role,
                isActive: userFormData.isActive
            });
            toast.success('Başarılı', 'Kullanıcı başarıyla oluşturuldu!');
            closeUserModal();
            loadUserList(userListPage, userListSearch);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcı oluşturulamadı.');
        } finally {
            setUserFormLoading(false);
        }
    };

    // Handle update user
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userModal.user) return;

        if (!userFormData.firstName.trim() || !userFormData.lastName.trim()) {
            toast.error('Eksik Bilgi', 'Ad ve soyad zorunludur.');
            return;
        }

        setUserFormLoading(true);
        try {
            const updatedUserId = userModal.user.userId;
            await userService.update({
                userId: updatedUserId,
                firstName: userFormData.firstName.trim(),
                lastName: userFormData.lastName.trim(),
                username: userFormData.username.trim() || undefined,
                email: userFormData.email.trim() || undefined,
                password: userFormData.password.trim() || undefined,
                isActive: userFormData.isActive,
                role: userFormData.role
            });
            toast.success('Başarılı', 'Kullanıcı başarıyla düzenlendi!');
            closeUserModal();
            loadUserList(userListPage, userListSearch);
            // Eğer kullanıcı detay sayfasındaysak, profili de yenile
            if (viewUser && viewUser.userId === updatedUserId) {
                loadUserProfile(updatedUserId);
            }
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcı düzenleme başarısız.');
        } finally {
            setUserFormLoading(false);
        }
    };

    // Handle delete user
    const handleDeleteUser = async () => {
        if (!deleteUserModal.user) return;

        setDeleteUserLoading(true);
        try {
            await userService.delete(deleteUserModal.user.userId);
            toast.success('Başarılı', 'Kullanıcı başarıyla silindi!');
            setDeleteUserModal({ isOpen: false, user: null });
            loadUserList(userListPage, userListSearch);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcı silinemedi.');
        } finally {
            setDeleteUserLoading(false);
        }
    };

    // Handle user list search
    const handleUserListSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setUserListPage(1);
        loadUserList(1, userListSearch);
    };

    // ========== CLUB MANAGEMENT FUNCTIONS ==========

    // Load clubs
    const loadClubs = async () => {
        setClubsLoading(true);
        try {
            const response = await clubService.getAll(clubsPage, clubsPageSize, clubsSearch || undefined);
            setClubs(response.items);
            setClubsPage(response.page);
            setClubsTotalPages(response.totalPages);
            setClubsTotalCount(response.totalCount);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulüpler yüklenemedi.');
        } finally {
            setClubsLoading(false);
        }
    };

    // Reset club form
    const resetClubForm = () => {
        setClubFormData({
            name: '',
            description: '',
            isPublic: true,
            requiresApproval: true,
            logoUrl: null,
            bannerUrl: null
        });
    };

    // Open create club modal
    const openCreateClubModal = () => {
        resetClubForm();
        setClubModal({ isOpen: true, mode: 'create', club: null });
    };

    // Open edit club modal
    const openEditClubModal = (club: Club) => {
        setClubFormData({
            name: club.name,
            description: club.description,
            isPublic: club.isPublic,
            requiresApproval: club.requiresApproval,
            logoUrl: club.logoUrl,
            bannerUrl: club.bannerUrl
        });
        setClubModal({ isOpen: true, mode: 'edit', club });
    };

    // Close club modal
    const closeClubModal = () => {
        setClubModal({ isOpen: false, mode: 'create', club: null });
        resetClubForm();
    };

    // Handle create club
    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clubFormData.name.trim()) {
            toast.error('Eksik Bilgi', 'Kulüp adı zorunludur.');
            return;
        }

        setClubFormLoading(true);
        try {
            await clubService.create({
                name: clubFormData.name.trim(),
                description: clubFormData.description.trim(),
                isPublic: clubFormData.isPublic,
                requiresApproval: clubFormData.requiresApproval
            });
            toast.success('Başarılı', 'Kulüp başarıyla oluşturuldu!');
            closeClubModal();
            loadClubs();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulüp oluşturulamadı.');
        } finally {
            setClubFormLoading(false);
        }
    };

    // Handle update club
    const handleUpdateClub = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clubModal.club) return;

        if (!clubFormData.name.trim()) {
            toast.error('Eksik Bilgi', 'Kulüp adı zorunludur.');
            return;
        }

        setClubFormLoading(true);
        try {
            await clubService.update({
                id: clubModal.club.id,
                name: clubFormData.name.trim(),
                description: clubFormData.description.trim(),
                logoUrl: clubFormData.logoUrl ?? null,
                bannerUrl: clubFormData.bannerUrl ?? null,
                isPublic: clubFormData.isPublic,
                requiresApproval: clubFormData.requiresApproval
            });
            toast.success('Başarılı', 'Kulüp başarıyla güncellendi!');
            closeClubModal();
            loadClubs();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulüp güncellenemedi.');
        } finally {
            setClubFormLoading(false);
        }
    };

    // Handle delete club
    const handleDeleteClub = async () => {
        if (!deleteClubModal.club) return;

        setDeleteClubLoading(true);
        try {
            await clubService.delete(deleteClubModal.club.id);
            toast.success('Başarılı', 'Kulüp başarıyla silindi!');
            setDeleteClubModal({ isOpen: false, club: null });
            loadClubs();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulüp silinemedi.');
        } finally {
            setDeleteClubLoading(false);
        }
    };

    // Handle club list search
    const handleClubListSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setClubsPage(1);
        loadClubs();
    };

    // ========== CLUB REQUEST MANAGEMENT FUNCTIONS ==========

    // Load club requests
    const loadClubRequests = async () => {
        setClubRequestsLoading(true);
        try {
            const response = await clubService.getPendingRequests(clubRequestsPage, clubRequestsPageSize);
            setClubRequests(response.items);
            setClubRequestsPage(response.page);
            setClubRequestsTotalPages(response.totalPages);
            setClubRequestsTotalCount(response.totalCount);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulüp başvuruları yüklenemedi.');
        } finally {
            setClubRequestsLoading(false);
        }
    };

    // Open review request modal
    const openReviewRequestModal = (request: ClubRequest, approve: boolean) => {
        setReviewRequestData({
            requestId: request.id,
            approve,
            rejectionReason: null
        });
        setReviewRequestModal({ isOpen: true, request });
    };

    // Close review request modal
    const closeReviewRequestModal = () => {
        setReviewRequestModal({ isOpen: false, request: null });
        setReviewRequestData({
            requestId: 0,
            approve: true,
            rejectionReason: null
        });
    };

    // Handle review request
    const handleReviewRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reviewRequestModal.request) return;

        if (!reviewRequestData.approve && !reviewRequestData.rejectionReason?.trim()) {
            toast.error('Eksik Bilgi', 'Red sebebi zorunludur.');
            return;
        }

        setReviewRequestLoading(true);
        try {
            await clubService.reviewRequest(reviewRequestModal.request.id, reviewRequestData);
            toast.success('Başarılı', reviewRequestData.approve ? 'Kulüp başvurusu onaylandı!' : 'Kulüp başvurusu reddedildi.');
            closeReviewRequestModal();
            loadClubRequests();
            // Kulüpler listesini de yenile (yeni kulüp oluşturulmuş olabilir)
            if (reviewRequestData.approve && activeSection === 'clubs') {
                loadClubs();
            }
        } catch (error: any) {
            toast.error('Hata', error.message || 'Başvuru değerlendirilemedi.');
        } finally {
            setReviewRequestLoading(false);
        }
    };

    // Load user profile details
    const loadUserProfile = async (userId: number) => {
        setViewUserLoading(true);
        try {
            const profile = await userService.getUserProfile(userId);
            setViewUser(profile);
            setActiveTab('profile');
            setActiveSectionState('user-detail');
            setSearchParams({ section: 'user-detail', userId: userId.toString() });
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcı profili yüklenemedi.');
        } finally {
            setViewUserLoading(false);
        }
    };

    // Load user threads
    const loadUserThreads = async (userId: number, page: number = 1) => {
        setUserContentLoading(true);
        try {
            const data = await userService.getUserThreads(userId, page);
            setUserThreads(data.threads);
            setThreadsPage(data.pageNumber);
            setThreadsTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Hata', 'Konular yüklenemedi.');
        } finally {
            setUserContentLoading(false);
        }
    };

    // Load user posts
    const loadUserPosts = async (userId: number, page: number = 1) => {
        setUserContentLoading(true);
        try {
            const data = await userService.getUserPosts(userId, page);
            setUserPosts(data.posts);
            setPostsPage(data.pageNumber);
            setPostsTotalPages(data.totalPages);
        } catch (error: any) {
            toast.error('Hata', 'Gönderiler yüklenemedi.');
        } finally {
            setUserContentLoading(false);
        }
    };

    // Handle tab change
    const handleTabChange = (tab: 'profile' | 'threads' | 'posts') => {
        setActiveTab(tab);
        if (tab === 'threads' && userThreads.length === 0 && viewUser) {
            loadUserThreads(viewUser.userId);
        } else if (tab === 'posts' && userPosts.length === 0 && viewUser) {
            loadUserPosts(viewUser.userId);
        }
    };

    // Handle user click from list
    const handleUserClick = (userId: number) => {
        loadUserProfile(userId);
    };

    // Get action display name and color
    const getActionInfo = (action: string) => {
        const actions: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
            'BanUser': { name: 'Kullanıcı Yasaklandı', color: '#ef4444', icon: <Ban size={16} /> },
            'UnbanUser': { name: 'Yasak Kaldırıldı', color: '#10b981', icon: <CheckCircle size={16} /> },
            'MuteUser': { name: 'Kullanıcı Susturuldu', color: '#f59e0b', icon: <VolumeX size={16} /> },
            'UnmuteUser': { name: 'Susturma Kaldırıldı', color: '#3b82f6', icon: <CheckCircle size={16} /> },
            'LockThread': { name: 'Konu Kilitlendi', color: '#ef4444', icon: <Lock size={16} /> },
            'UnlockThread': { name: 'Kilit Kaldırıldı', color: '#10b981', icon: <Unlock size={16} /> }
        };
        return actions[action] || { name: action, color: '#6b7280', icon: <Activity size={16} /> };
    };

    if (!isAdminOrModerator) {
        return null;
    }

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Shield size={28} />
                    </div>
                    <div className="sidebar-title">
                        <h2>Admin Panel</h2>
                        <span>Yönetim Merkezi</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-item ${activeSection === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveSection('dashboard')}
                    >
                        <BarChart3 size={20} />
                        <span>Anasayfa</span>
                    </button>

                    <button
                        className={`sidebar-item ${activeSection === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveSection('users')}
                    >
                        <Users size={20} />
                        <span>Kullanıcılar</span>
                    </button>

                    <div className="sidebar-group">
                        <button
                            className="sidebar-item group-header"
                            onClick={() => setPermissionsExpanded(!permissionsExpanded)}
                        >
                            <Lock size={20} />
                            <span>İzinler</span>
                            {permissionsExpanded ? <ChevronDown size={16} className="arrow" /> : <ChevronRight size={16} className="arrow" />}
                        </button>

                        {permissionsExpanded && (
                            <div className="sidebar-submenu">
                                <button
                                    className={`sidebar-item sub-item ${activeSection === 'ban' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('ban')}
                                >
                                    <Ban size={18} />
                                    <span>Yasaklama</span>
                                </button>
                                <button
                                    className={`sidebar-item sub-item ${activeSection === 'mute' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('mute')}
                                >
                                    <VolumeX size={18} />
                                    <span>Susturma</span>
                                </button>
                                <button
                                    className={`sidebar-item sub-item ${activeSection === 'thread' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('thread')}
                                >
                                    <MessageSquare size={18} />
                                    <span>Konular</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className={`sidebar-item ${activeSection === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveSection('reports')}
                    >
                        <Flag size={20} />
                        <span>Raporlar</span>
                    </button>

                    <button
                        className={`sidebar-item ${activeSection === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveSection('logs')}
                    >
                        <History size={20} />
                        <span>İşlem Geçmişi</span>
                    </button>

                    <div className="sidebar-group">
                        <button
                            className="sidebar-item group-header"
                            onClick={() => setClubsExpanded(!clubsExpanded)}
                        >
                            <Building2 size={20} />
                            <span>Kulüpler</span>
                            {clubsExpanded ? <ChevronDown size={16} className="arrow" /> : <ChevronRight size={16} className="arrow" />}
                        </button>

                        {clubsExpanded && (
                            <div className="sidebar-submenu">
                                <button
                                    className={`sidebar-item sub-item ${activeSection === 'clubs' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('clubs')}
                                >
                                    <Building2 size={18} />
                                    <span>Kulüp Listesi</span>
                                </button>
                                <button
                                    className={`sidebar-item sub-item ${activeSection === 'club-requests' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('club-requests')}
                                >
                                    <Flag size={18} />
                                    <span>Kulüp Başvuruları</span>
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-stats">
                        {dashboardStats && (
                            <>
                                <div className="sidebar-stat">
                                    <Users size={16} />
                                    <span>{dashboardStats.userStats.totalUsers} Kullanıcı</span>
                                </div>
                                <div className="sidebar-stat">
                                    <Ban size={16} />
                                    <span>{dashboardStats.moderationStats.activeBans} Aktif Yasak</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Dashboard Section */}
                {activeSection === 'dashboard' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h1><BarChart3 size={28} /> Anasayfa</h1>
                            <p>Genel istatistikler ve aktiviteler</p>
                        </div>

                        {dashboardLoading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Veriler yükleniyor...</p>
                            </div>
                        ) : dashboardStats ? (
                            <>
                                {/* Stats Grid */}
                                <div className="stats-grid">
                                    <div className="stat-card users">
                                        <div className="stat-icon"><Users size={24} /></div>
                                        <div className="stat-content">
                                            <h3>{dashboardStats.userStats.totalUsers}</h3>
                                            <p>Toplam Kullanıcı</p>
                                            <span className="stat-badge positive">+{dashboardStats.userStats.newUsersThisWeek} bu hafta</span>
                                        </div>
                                    </div>
                                    <div className="stat-card content">
                                        <div className="stat-icon"><FileText size={24} /></div>
                                        <div className="stat-content">
                                            <h3>{dashboardStats.contentStats.totalPosts}</h3>
                                            <p>Toplam Gönderi</p>
                                            <span className="stat-badge positive">+{dashboardStats.contentStats.postsThisWeek} bu hafta</span>
                                        </div>
                                    </div>
                                    <div className="stat-card threads">
                                        <div className="stat-icon"><MessageSquare size={24} /></div>
                                        <div className="stat-content">
                                            <h3>{dashboardStats.contentStats.totalThreads}</h3>
                                            <p>Toplam Konu</p>
                                            <span className="stat-badge positive">+{dashboardStats.contentStats.threadsThisWeek} bu hafta</span>
                                        </div>
                                    </div>
                                    <div className="stat-card moderation">
                                        <div className="stat-icon"><Shield size={24} /></div>
                                        <div className="stat-content">
                                            <h3>{dashboardStats.moderationStats.activeBans}</h3>
                                            <p>Aktif Yasak</p>
                                            <span className="stat-badge warning">{dashboardStats.moderationStats.activeMutes} susturma</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart & Top Users */}
                                <div className="dashboard-row">
                                    <div className="content-card chart-card">
                                        <div className="card-header">
                                            <Activity size={20} />
                                            <h3>Son 7 Gün Aktivite</h3>
                                        </div>
                                        <div className="activity-chart">
                                            {dashboardStats.last7DaysActivity.map((day, index) => (
                                                <div key={index} className="chart-day">
                                                    <div className="chart-bars">
                                                        <div className="chart-bar users-bar" style={{ height: `${(day.newUsers / getMaxActivity()) * 100}%` }} title={`${day.newUsers} yeni kullanıcı`} />
                                                        <div className="chart-bar posts-bar" style={{ height: `${(day.newPosts / getMaxActivity()) * 100}%` }} title={`${day.newPosts} yeni gönderi`} />
                                                        <div className="chart-bar threads-bar" style={{ height: `${(day.newThreads / getMaxActivity()) * 100}%` }} title={`${day.newThreads} yeni konu`} />
                                                    </div>
                                                    <span className="chart-label">{formatShortDate(day.date)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="chart-legend">
                                            <span><i className="legend-dot users"></i> Kullanıcı</span>
                                            <span><i className="legend-dot posts"></i> Gönderi</span>
                                            <span><i className="legend-dot threads"></i> Konu</span>
                                        </div>
                                    </div>

                                    <div className="content-card">
                                        <div className="card-header">
                                            <Crown size={20} />
                                            <h3>En Aktif Kullanıcılar</h3>
                                        </div>
                                        <div className="top-users-list">
                                            {topUsers.map((user, index) => (
                                                <div key={user.userId} className="top-user-item">
                                                    <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                                                    <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                                                    <div className="user-info">
                                                        <span className="username">@{user.username}</span>
                                                        <span className="activity"><Zap size={12} /> {user.totalActivity} aktivite</span>
                                                    </div>
                                                    <div className="user-stats">
                                                        <span>{user.threadCount} konu</span>
                                                        <span>{user.postCount} gönderi</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Top Reported */}
                                <div className="content-card" style={{ marginTop: '1.5rem' }}>
                                    <div className="card-header" style={{ justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                                            <h3>En Çok Raporlanan İçerikler</h3>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                Göster:
                                                <select
                                                    value={topReportedCount}
                                                    onChange={(e) => setTopReportedCount(Number(e.target.value))}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-secondary)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={15}>15</option>
                                                    <option value={20}>20</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="top-reported-list" style={{ padding: '1.5rem' }}>
                                        {topReported.length === 0 ? (
                                            <div className="empty-state" style={{ padding: '2rem' }}>
                                                <Flag size={48} />
                                                <p>Henüz rapor edilmiş içerik yok.</p>
                                            </div>
                                        ) : (
                                            topReported.map((item, index) => (
                                                <div
                                                    key={item.contentId}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        padding: '1rem',
                                                        borderBottom: index < topReported.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <span
                                                        className={`rank rank-${index + 1}`}
                                                        style={{
                                                            minWidth: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            background: index === 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                                                index === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                                                    index === 2 ? 'linear-gradient(135deg, #eab308, #ca8a04)' :
                                                                        'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: '700',
                                                            fontSize: '0.9rem',
                                                            flexShrink: 0,
                                                            boxShadow: index < 3 ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none'
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '10px',
                                                        background: 'var(--bg-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--primary-color)',
                                                        flexShrink: 0
                                                    }}>
                                                        {item.contentType === 'User' ? <User size={20} /> :
                                                            item.contentType === 'Post' ? <MessageSquare size={20} /> :
                                                                <FileText size={20} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                            {item.contentPreview}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {item.contentType === 'User' ? 'Kullanıcı' :
                                                                item.contentType === 'Post' ? 'Gönderi' :
                                                                    'Konu'} • {new Date(item.lastReportedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        color: '#ef4444',
                                                        fontWeight: '700',
                                                        fontSize: '0.9rem',
                                                        flexShrink: 0
                                                    }}>
                                                        <Flag size={16} />
                                                        {item.reportCount}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="quick-stats-grid">
                                    <div className="quick-stat">
                                        <Calendar size={18} />
                                        <div><span className="value">{dashboardStats.userStats.newUsersToday}</span><span className="label">Bugün Kayıt</span></div>
                                    </div>
                                    <div className="quick-stat">
                                        <FileText size={18} />
                                        <div><span className="value">{dashboardStats.contentStats.postsToday}</span><span className="label">Bugün Gönderi</span></div>
                                    </div>
                                    <div className="quick-stat">
                                        <Users size={18} />
                                        <div><span className="value">{dashboardStats.userStats.activeUsers}</span><span className="label">Aktif Kullanıcı</span></div>
                                    </div>
                                    <div className="quick-stat">
                                        <Shield size={18} />
                                        <div><span className="value">{dashboardStats.userStats.totalAdmins}</span><span className="label">Admin</span></div>
                                    </div>
                                    <div className="quick-stat">
                                        <Lock size={18} />
                                        <div><span className="value">{dashboardStats.contentStats.lockedThreads}</span><span className="label">Kilitli Konu</span></div>
                                    </div>
                                    <div className="quick-stat">
                                        <TrendingUp size={18} />
                                        <div><span className="value">{dashboardStats.contentStats.totalCategories}</span><span className="label">Kategori</span></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <BarChart3 size={48} />
                                <p>Anasayfa verileri yüklenemedi.</p>
                                <button onClick={loadDashboardData} className="btn-primary">Tekrar Dene</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Users Section */}
                {activeSection === 'users' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h1><Users size={28} /> Kullanıcı Yönetimi</h1>
                            <p>Kullanıcıları görüntüleyin, oluşturun, düzenleyin veya silin</p>
                        </div>

                        <div className="section-actions">
                            <form onSubmit={handleUserListSearch} className="search-form">
                                <input
                                    type="text"
                                    placeholder="Kullanıcı ara (isim, email veya kullanıcı adı)..."
                                    value={userListSearch}
                                    onChange={(e) => setUserListSearch(e.target.value)}
                                />
                                <button type="submit" className="btn-primary" disabled={userListLoading}>
                                    <Search size={16} />
                                    Ara
                                </button>
                            </form>
                            <button className="btn-success" onClick={openCreateUserModal}>
                                <Users size={16} />
                                Yeni Kullanıcı
                            </button>
                        </div>

                        <div className="content-card">
                            <div className="card-header">
                                <Users size={20} />
                                <h3>Kullanıcı Listesi</h3>
                                <span className="badge">{userListTotalCount} kullanıcı</span>
                            </div>

                            {userListLoading ? (
                                <div className="loading-state">Yükleniyor...</div>
                            ) : userList.length === 0 ? (
                                <div className="empty-state">
                                    <Users size={48} />
                                    <p>Kullanıcı bulunamadı.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="user-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Kullanıcı</th>
                                                    <th>Ad Soyad</th>
                                                    <th>Email</th>
                                                    <th>Rol</th>
                                                    <th>Durum</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userList.map((user) => (
                                                    <tr key={user.userId} onClick={() => handleUserClick(user.userId)} className="clickable-row">
                                                        <td>
                                                            <div className="user-cell">
                                                                <img
                                                                    src={user.profileImg || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=40`}
                                                                    alt={user.username}
                                                                    className="user-avatar"
                                                                />
                                                                <span>@{user.username}</span>
                                                            </div>
                                                        </td>
                                                        <td>{user.firstName} {user.lastName}</td>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <span className={`role-badge ${user.role.toLowerCase()}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${user.isActive ? 'success' : 'danger'}`}>
                                                                {user.isActive ? 'Aktif' : 'Pasif'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    className="btn-icon edit"
                                                                    onClick={() => openEditUserModal(user)}
                                                                    title="Düzenle"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon delete"
                                                                    onClick={() => setDeleteUserModal({ isOpen: true, user })}
                                                                    title="Sil"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {userListTotalPages > 1 && (
                                        <div className="pagination">
                                            <button
                                                onClick={() => loadUserList(userListPage - 1, userListSearch)}
                                                disabled={userListPage <= 1 || userListLoading}
                                                className="btn-secondary"
                                            >
                                                <ChevronLeft size={16} /> Önceki
                                            </button>
                                            <span className="page-info">
                                                Sayfa {userListPage} / {userListTotalPages}
                                            </span>
                                            <button
                                                onClick={() => loadUserList(userListPage + 1, userListSearch)}
                                                disabled={userListPage >= userListTotalPages || userListLoading}
                                                className="btn-secondary"
                                            >
                                                Sonraki <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* User Detail View */}
                {activeSection === 'user-detail' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <button
                                className="btn-back"
                                onClick={() => setActiveSection('users')}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1>Kullanıcı Detayı</h1>
                                <p>Kullanıcı bilgilerini görüntüleyin ve yönetin</p>
                            </div>
                        </div>

                        {viewUserLoading ? (
                            <div className="loading-state">Yükleniyor...</div>
                        ) : viewUser ? (
                            <>
                                <div className="tab-navigation">
                                    <button
                                        onClick={() => handleTabChange('profile')}
                                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                                    >
                                        Profil
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('threads')}
                                        className={`tab-btn ${activeTab === 'threads' ? 'active' : ''}`}
                                    >
                                        Konular
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('posts')}
                                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                                    >
                                        Yanıtlar
                                    </button>
                                </div>

                                {activeTab === 'profile' && (
                                    <div className="user-detail-grid">
                                        {/* Profile Card */}
                                        <div className="content-card profile-card">
                                            <div className="profile-header">
                                                <img
                                                    src={viewUser.profileImg || `https://ui-avatars.com/api/?name=${viewUser.firstName}+${viewUser.lastName}&background=random&size=120`}
                                                    alt={viewUser.username}
                                                    className="profile-large-avatar"
                                                />
                                                <div className="profile-info">
                                                    <h2>{viewUser.firstName} {viewUser.lastName}</h2>
                                                    <span className="username">@{viewUser.username}</span>
                                                    <div className="badges">
                                                        <span className={`role-badge ${viewUser.role?.toLowerCase() || 'user'}`}>
                                                            {viewUser.role || 'User'}
                                                        </span>
                                                        <span className={`status-badge ${viewUser.isActive ? 'success' : 'danger'}`}>
                                                            {viewUser.isActive ? 'Aktif' : 'Pasif'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="profile-actions">
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => openEditUserModal(viewUser as any)} // Type casting for compatibility
                                                >
                                                    <Pencil size={16} /> Düzenle
                                                </button>
                                                <button
                                                    className="btn-danger"
                                                    onClick={() => setDeleteUserModal({ isOpen: true, user: viewUser as any })}
                                                >
                                                    <Trash2 size={16} /> Sil
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stats Card */}
                                        <div className="content-card stats-card">
                                            <h3>İstatistikler</h3>
                                            <div className="stats-list">
                                                <div className="stat-item">
                                                    <Calendar size={20} />
                                                    <div>
                                                        <span className="label">Kayıt Tarihi</span>
                                                        <span className="value">{new Date(viewUser.createdAt).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <MessageSquare size={20} />
                                                    <div>
                                                        <span className="label">Toplam Konu</span>
                                                        <span className="value">{viewUser.totalThreads}</span>
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <FileText size={20} />
                                                    <div>
                                                        <span className="label">Toplam Gönderi</span>
                                                        <span className="value">{viewUser.totalPosts}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'threads' && (
                                    <div className="admin-table-container">
                                        {userContentLoading ? (
                                            <div className="loading-state">Konular yükleniyor...</div>
                                        ) : userThreads.length > 0 ? (
                                            <>
                                            <div className="user-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Başlık</th>
                                                            <th>Görüntülenme</th>
                                                            <th>Yanıt</th>
                                                            <th>Durum</th>
                                                            <th>Oluşturulma</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userThreads.map((thread, index) => (
                                                            <tr key={thread.id}>
                                                                <td>{index + 1}</td>
                                                                <td title={thread.title}>{thread.title.length > 30 ? thread.title.substring(0, 30) + '...' : thread.title}</td>
                                                                <td>{thread.viewCount}</td>
                                                                <td>{thread.postCount}</td>
                                                                <td>
                                                                    <span className={`status-badge ${thread.isSolved ? 'success' : 'warning'}`}>
                                                                        {thread.isSolved ? 'Çözüldü' : 'Açık'}
                                                                    </span>
                                                                </td>
                                                                <td>{new Date(thread.createdAt).toLocaleDateString('tr-TR')}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {threadsTotalPages > 1 && (
                                                <div className="pagination">
                                                    <button
                                                        onClick={() => viewUser && loadUserThreads(viewUser.userId, threadsPage - 1)}
                                                        disabled={threadsPage <= 1 || userContentLoading}
                                                        className="btn-secondary"
                                                    >
                                                        <ChevronLeft size={16} /> Önceki
                                                    </button>
                                                    <span className="page-info">
                                                        Sayfa {threadsPage} / {threadsTotalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => viewUser && loadUserThreads(viewUser.userId, threadsPage + 1)}
                                                        disabled={threadsPage >= threadsTotalPages || userContentLoading}
                                                        className="btn-secondary"
                                                    >
                                                        Sonraki <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            </>
                                        ) : (
                                            <div className="empty-state">Kullanıcının hiç konusu yok.</div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'posts' && (
                                    <div className="admin-table-container">
                                        {userContentLoading ? (
                                            <div className="loading-state">Gönderiler yükleniyor...</div>
                                        ) : userPosts.length > 0 ? (
                                            <>
                                            <div className="user-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>İçerik</th>
                                                            <th>Konu</th>
                                                            <th>Beğeni</th>
                                                            <th>Çözüm mü?</th>
                                                            <th>Tarih</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userPosts.map((post, index) => (
                                                            <tr key={post.id}>
                                                                <td>{index + 1}</td>
                                                                <td title={post.content}>{post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content}</td>
                                                                <td>{post.threadTitle}</td>
                                                                <td>{post.upvoteCount}</td>
                                                                <td>
                                                                    {post.isSolution ? (
                                                                        <span className="status-badge success">Evet</span>
                                                                    ) : (
                                                                        <span className="status-badge danger">Hayır</span>
                                                                    )}
                                                                </td>
                                                                <td>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {postsTotalPages > 1 && (
                                                <div className="pagination">
                                                    <button
                                                        onClick={() => viewUser && loadUserPosts(viewUser.userId, postsPage - 1)}
                                                        disabled={postsPage <= 1 || userContentLoading}
                                                        className="btn-secondary"
                                                    >
                                                        <ChevronLeft size={16} /> Önceki
                                                    </button>
                                                    <span className="page-info">
                                                        Sayfa {postsPage} / {postsTotalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => viewUser && loadUserPosts(viewUser.userId, postsPage + 1)}
                                                        disabled={postsPage >= postsTotalPages || userContentLoading}
                                                        className="btn-secondary"
                                                    >
                                                        Sonraki <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            </>
                                        ) : (
                                            <div className="empty-state">Kullanıcının hiç gönderisi yok.</div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>Kullanıcı bulunamadı.</p>
                                <button onClick={() => setActiveSection('users')} className="btn-primary">Geri Dön</button>
                            </div>
                        )}
                    </div>
                )}

                {/* User Create/Edit Modal */}
                <Modal
                    isOpen={userModal.isOpen}
                    onClose={closeUserModal}
                    title={userModal.mode === 'create' ? 'Yeni Kullanıcı Oluştur' : 'Kullanıcı Düzenle'}
                >
                    <form onSubmit={userModal.mode === 'create' ? handleCreateUser : handleUpdateUser} className="modal-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Ad *</label>
                                <input
                                    type="text"
                                    value={userFormData.firstName}
                                    onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                                    placeholder="Ad"
                                    required
                                    minLength={2}
                                    maxLength={50}
                                />
                            </div>
                            <div className="form-group">
                                <label>Soyad *</label>
                                <input
                                    type="text"
                                    value={userFormData.lastName}
                                    onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                                    placeholder="Soyad"
                                    required
                                    minLength={2}
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Kullanıcı Adı *</label>
                            <input
                                type="text"
                                value={userFormData.username}
                                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                                placeholder="kullanici_adi"
                                required
                                minLength={3}
                                maxLength={30}
                                pattern="^[a-zA-Z0-9_]+$"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={userFormData.email}
                                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                placeholder="email@ornek.com"
                                required
                                maxLength={100}
                            />
                            {userModal.mode === 'edit' && userModal.user && userFormData.email !== userModal.user.email && (
                                <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={14} />
                                    Email degistiginde kullanicinin oturumu kapatilacak ve yeni email dogrulanana kadar giris yapamayacak
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label>{userModal.mode === 'create' ? 'Şifre *' : 'Yeni Şifre (boş bırakılırsa değişmez)'}</label>
                            <input
                                type="password"
                                value={userFormData.password}
                                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                placeholder="••••••"
                                minLength={userModal.mode === 'create' ? 6 : 0}
                                maxLength={100}
                                required={userModal.mode === 'create'}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Rol *</label>
                                <select
                                    value={userFormData.role}
                                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                                    required
                                >
                                    <option value="User">User</option>
                                    <option value="Moderator">Moderator</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Durum *</label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={userFormData.isActive}
                                        onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.checked })}
                                    />
                                    <span>Aktif</span>
                                </label>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={closeUserModal} className="btn-secondary">
                                İptal
                            </button>
                            <button type="submit" className="btn-primary" disabled={userFormLoading}>
                                {userFormLoading ? 'Kaydediliyor...' : (userModal.mode === 'create' ? 'Oluştur' : 'Kaydet')}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete User Confirmation Modal */}
                <Modal
                    isOpen={deleteUserModal.isOpen}
                    onClose={() => setDeleteUserModal({ isOpen: false, user: null })}
                    title="Kullanıcı Sil"
                >
                    <div className="confirm-modal">
                        <AlertTriangle size={48} className="warning-icon" />
                        <p>
                            <strong>@{deleteUserModal.user?.username}</strong> kullanıcısını silmek istediğinize emin misiniz?
                        </p>
                        <p className="text-muted">Bu işlem geri alınamaz!</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setDeleteUserModal({ isOpen: false, user: null })}
                                className="btn-secondary"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="btn-danger"
                                disabled={deleteUserLoading}
                            >
                                {deleteUserLoading ? 'Siliniyor...' : 'Evet, Sil'}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Club Create/Edit Modal */}
                <Modal
                    isOpen={clubModal.isOpen}
                    onClose={closeClubModal}
                    title={clubModal.mode === 'create' ? 'Yeni Kulüp Oluştur' : 'Kulüp Düzenle'}
                >
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                    {clubModal.mode === 'create' ? 'Yeni bir kulüp oluşturun ve topluluğunuzu büyütün' : 'Kulüp bilgilerini güncelleyin'}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={clubModal.mode === 'create' ? handleCreateClub : handleUpdateClub} className="modal-form">
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Info size={16} style={{ color: '#667eea' }} />
                                <strong style={{ fontSize: '0.875rem', color: '#667eea' }}>Temel Bilgiler</strong>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Kulüp adı ve açıklaması ziyaretçiler tarafından görülebilir
                            </p>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Building2 size={16} style={{ color: 'var(--primary)' }} />
                                Kulüp Adı *
                            </label>
                            <input
                                type="text"
                                value={clubFormData.name}
                                onChange={(e) => setClubFormData({ ...clubFormData, name: e.target.value })}
                                placeholder="Örn: Teknoloji Kulübü"
                                required
                                minLength={2}
                                maxLength={100}
                                style={{ fontSize: '1rem', padding: '0.75rem' }}
                            />
                            <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {clubFormData.name.length}/100 karakter
                            </small>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <FileText size={16} style={{ color: 'var(--primary)' }} />
                                Açıklama
                            </label>
                            <textarea
                                value={clubFormData.description}
                                onChange={(e) => setClubFormData({ ...clubFormData, description: e.target.value })}
                                placeholder="Kulüp hakkında detaylı bilgi verin..."
                                rows={4}
                                maxLength={500}
                                style={{ fontSize: '1rem', padding: '0.75rem', resize: 'vertical' }}
                            />
                            <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {clubFormData.description.length}/500 karakter
                            </small>
                        </div>

                        {clubModal.mode === 'edit' && (
                            <>
                                <div style={{ 
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Eye size={16} style={{ color: '#3b82f6' }} />
                                        <strong style={{ fontSize: '0.875rem', color: '#3b82f6' }}>Görsel Ayarları</strong>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Logo ve banner görselleri kulüp sayfasında görüntülenecektir
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            background: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <Building2 size={12} />
                                        </div>
                                        Logo URL
                                    </label>
                                    <input
                                        type="url"
                                        value={clubFormData.logoUrl || ''}
                                        onChange={(e) => setClubFormData({ ...clubFormData, logoUrl: e.target.value || null })}
                                        placeholder="https://example.com/logo.png"
                                        style={{ fontSize: '1rem', padding: '0.75rem' }}
                                    />
                                    {clubFormData.logoUrl && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <img 
                                                src={clubFormData.logoUrl} 
                                                alt="Logo önizleme" 
                                                style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            background: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <FileText size={12} />
                                        </div>
                                        Banner URL
                                    </label>
                                    <input
                                        type="url"
                                        value={clubFormData.bannerUrl || ''}
                                        onChange={(e) => setClubFormData({ ...clubFormData, bannerUrl: e.target.value || null })}
                                        placeholder="https://example.com/banner.png"
                                        style={{ fontSize: '1rem', padding: '0.75rem' }}
                                    />
                                    {clubFormData.bannerUrl && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <img 
                                                src={clubFormData.bannerUrl} 
                                                alt="Banner önizleme" 
                                                style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div style={{ 
                            background: 'rgba(16, 185, 129, 0.05)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Lock size={16} style={{ color: '#10b981' }} />
                                <strong style={{ fontSize: '0.875rem', color: '#10b981' }}>Gizlilik ve Onay Ayarları</strong>
                            </div>
                            
                            <div className="form-row" style={{ gap: '1rem' }}>
                                <div className="form-group" style={{ 
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: `2px solid ${clubFormData.isPublic ? '#10b981' : 'var(--border-color)'}`,
                                    transition: 'all 0.2s'
                                }}>
                                    <label className="checkbox-label" style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.75rem',
                                        cursor: 'pointer',
                                        margin: 0
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={clubFormData.isPublic}
                                            onChange={(e) => setClubFormData({ ...clubFormData, isPublic: e.target.checked })}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <Unlock size={16} style={{ color: clubFormData.isPublic ? '#10b981' : 'var(--text-secondary)' }} />
                                                <strong style={{ fontSize: '0.9rem' }}>Herkese Açık</strong>
                                            </div>
                                            <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                Kulüp herkes tarafından görülebilir ve aranabilir
                                            </small>
                                        </div>
                                    </label>
                                </div>

                                <div className="form-group" style={{ 
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: `2px solid ${clubFormData.requiresApproval ? '#f59e0b' : 'var(--border-color)'}`,
                                    transition: 'all 0.2s'
                                }}>
                                    <label className="checkbox-label" style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.75rem',
                                        cursor: 'pointer',
                                        margin: 0
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={clubFormData.requiresApproval}
                                            onChange={(e) => setClubFormData({ ...clubFormData, requiresApproval: e.target.checked })}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <Shield size={16} style={{ color: clubFormData.requiresApproval ? '#f59e0b' : 'var(--text-secondary)' }} />
                                                <strong style={{ fontSize: '0.9rem' }}>Onay Gerekli</strong>
                                            </div>
                                            <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                Yeni üyelikler için yönetici onayı gerekir
                                            </small>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ 
                            paddingTop: '1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                type="button"
                                onClick={closeClubModal}
                                className="btn-secondary"
                                disabled={clubFormLoading}
                                style={{ minWidth: '100px' }}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={clubFormLoading}
                                style={{ 
                                    minWidth: '140px',
                                    background: clubFormLoading ? 'var(--text-secondary)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none'
                                }}
                            >
                                {clubFormLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                        Kaydediliyor...
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        {clubModal.mode === 'create' ? (
                                            <>
                                                <Plus size={16} />
                                                Oluştur
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} />
                                                Güncelle
                                            </>
                                        )}
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Club Delete Modal */}
                <Modal
                    isOpen={deleteClubModal.isOpen}
                    onClose={() => setDeleteClubModal({ isOpen: false, club: null })}
                    title="Kulüp Sil"
                >
                    <div className="confirm-modal" style={{ padding: '1.5rem 0' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            border: '3px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <AlertTriangle size={40} style={{ color: '#ef4444' }} />
                        </div>
                        
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ 
                                margin: 0, 
                                marginBottom: '0.75rem', 
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>
                                <strong style={{ color: '#ef4444' }}>{deleteClubModal.club?.name}</strong> kulübünü silmek istediğinize emin misiniz?
                            </h3>
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.05)',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                textAlign: 'left',
                                marginTop: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <XCircle size={18} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Bu işlem şunları içerir:</strong>
                                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                            <li>Kulüp kalıcı olarak silinecek</li>
                                            <li>Tüm üyelikler ve üye verileri silinecek</li>
                                            <li>Kulüp içeriği (varsa) silinecek</li>
                                            <li>Bu işlem geri alınamaz</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ 
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'flex-end',
                            paddingTop: '1rem',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <button
                                onClick={() => setDeleteClubModal({ isOpen: false, club: null })}
                                className="btn-secondary"
                                disabled={deleteClubLoading}
                                style={{ minWidth: '100px' }}
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDeleteClub}
                                className="btn-danger"
                                disabled={deleteClubLoading}
                                style={{ 
                                    minWidth: '140px',
                                    background: deleteClubLoading ? 'var(--text-secondary)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    border: 'none'
                                }}
                            >
                                {deleteClubLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                        Siliniyor...
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        <Trash2 size={16} />
                                        Evet, Sil
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Review Club Request Modal */}
                <Modal
                    isOpen={reviewRequestModal.isOpen}
                    onClose={closeReviewRequestModal}
                    title={reviewRequestData.approve ? 'Kulüp Başvurusunu Onayla' : 'Kulüp Başvurusunu Reddet'}
                >
                    <form onSubmit={handleReviewRequest} className="modal-form">
                        {reviewRequestModal.request && (
                            <>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    border: '1px solid rgba(102, 126, 234, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <Building2 size={16} style={{ color: '#667eea' }} />
                                        <strong style={{ fontSize: '0.875rem', color: '#667eea' }}>Başvuru Detayları</strong>
                                    </div>
                                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <div><strong>Kulüp Adı:</strong> {reviewRequestModal.request.name}</div>
                                        <div><strong>Başvuran:</strong> @{reviewRequestModal.request.requestedByUsername}</div>
                                        <div><strong>Açıklama:</strong> {reviewRequestModal.request.description || '-'}</div>
                                        <div><strong>Amaç:</strong> {reviewRequestModal.request.purpose || '-'}</div>
                                        <div><strong>Tarih:</strong> {formatDate(reviewRequestModal.request.createdAt)}</div>
                                    </div>
                                </div>

                                {!reviewRequestData.approve && (
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                                            Red Sebebi *
                                        </label>
                                        <textarea
                                            value={reviewRequestData.rejectionReason || ''}
                                            onChange={(e) => setReviewRequestData({ ...reviewRequestData, rejectionReason: e.target.value })}
                                            placeholder="Başvurunun neden reddedildiğini açıklayın..."
                                            rows={4}
                                            required={!reviewRequestData.approve}
                                            style={{ fontSize: '1rem', padding: '0.75rem', resize: 'vertical' }}
                                        />
                                        <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            Red sebebi başvuran kullanıcıya gösterilecektir
                                        </small>
                                    </div>
                                )}

                                {reviewRequestData.approve && (
                                    <div style={{ 
                                        background: 'rgba(16, 185, 129, 0.05)',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1.5rem',
                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <CheckCircle size={16} style={{ color: '#10b981' }} />
                                            <strong style={{ fontSize: '0.875rem', color: '#10b981' }}>Onaylandığında</strong>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            Bu başvuru onaylandığında yeni bir kulüp oluşturulacak ve başvuran kullanıcı kulübün kurucusu olacaktır.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="modal-actions" style={{ 
                            paddingTop: '1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                type="button"
                                onClick={closeReviewRequestModal}
                                className="btn-secondary"
                                disabled={reviewRequestLoading}
                                style={{ minWidth: '100px' }}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className={reviewRequestData.approve ? 'btn-primary' : 'btn-danger'}
                                disabled={reviewRequestLoading}
                                style={{ 
                                    minWidth: '140px',
                                    background: reviewRequestLoading 
                                        ? 'var(--text-secondary)' 
                                        : reviewRequestData.approve
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    border: 'none'
                                }}
                            >
                                {reviewRequestLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                        İşleniyor...
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        {reviewRequestData.approve ? (
                                            <>
                                                <CheckCircle size={16} />
                                                Onayla
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={16} />
                                                Reddet
                                            </>
                                        )}
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Ban Section */}
                {activeSection === 'ban' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h1><Ban size={28} /> Kullanıcı Yasaklama</h1>
                            <p>Kullanıcıları yasaklayın veya yasaklarını kaldırın</p>
                        </div>

                        <div className="content-card">
                            <div className="card-header">
                                <Search size={20} />
                                <h3>Kullanıcı Ara</h3>
                            </div>
                            <div className="search-form autocomplete-container">
                                <div className="autocomplete-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı adı, isim veya ID ile ara..."
                                        value={userSearchQuery}
                                        onChange={(e) => handleUserAutocomplete(e.target.value)}
                                        onFocus={() => userSearchResults.length > 0 && setShowUserDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                                    />
                                    {userSearchLoading && <span className="search-spinner"></span>}

                                    {showUserDropdown && userSearchResults.length > 0 && (
                                        <div className="autocomplete-dropdown">
                                            {userSearchResults.map((user) => (
                                                <div
                                                    key={user.userId}
                                                    className="autocomplete-item"
                                                    onMouseDown={() => handleSelectUser(user)}
                                                >
                                                    <img
                                                        src={user.profileImg || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=32`}
                                                        alt={user.username}
                                                        className="autocomplete-avatar"
                                                    />
                                                    <div className="autocomplete-info">
                                                        <span className="autocomplete-name">{user.firstName} {user.lastName}</span>
                                                        <span className="autocomplete-username">@{user.username}</span>
                                                    </div>
                                                    <span className={`autocomplete-role ${user.role.toLowerCase()}`}>{user.role}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedUser && (
                                    <div className="selected-user-badge">
                                        <span>Seçili: @{selectedUser.username}</span>
                                        <button type="button" onClick={() => {
                                            setSelectedUser(null);
                                            setSearchUserId('');
                                            setUserSearchQuery('');
                                            setUserBans([]);
                                        }} className="clear-btn">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="content-card danger-card">
                            <div className="card-header danger">
                                <Ban size={20} />
                                <h3>Yasakla</h3>
                            </div>
                            <form onSubmit={handleBanUser} className="action-form">
                                <div className="form-group">
                                    <label>Yasaklama Sebebi *</label>
                                    <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Yasaklama sebebini yazınız..." maxLength={500} rows={3} required />
                                    <span className="char-count">{banReason.length}/500</span>
                                </div>
                                <div className="form-row">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={isPermanentBan} onChange={(e) => setIsPermanentBan(e.target.checked)} />
                                        <span>Kalıcı Yasak</span>
                                    </label>
                                    {!isPermanentBan && (
                                        <div className="form-group">
                                            <label>Bitiş Tarihi *</label>
                                            <input type="datetime-local" value={banExpiresAt} onChange={(e) => setBanExpiresAt(e.target.value)} min={getMinDateTime()} required />
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="btn-danger" disabled={banLoading || !searchUserId}>
                                    {banLoading ? 'İşleniyor...' : 'Yasakla'}
                                    <Ban size={16} />
                                </button>
                            </form>
                        </div>

                        {userBans.length > 0 && (
                            <div className="content-card">
                                <div className="card-header">
                                    <AlertTriangle size={20} />
                                    <h3>Yasaklar ({userBansTotalCount})</h3>
                                </div>
                                <div className="records-list">
                                    {userBans.map((ban) => (
                                        <div key={ban.id} className={`record-item ${ban.isActive ? 'active' : 'inactive'}`}>
                                            <div className="record-content">
                                                <div className="record-header">
                                                    <span className="record-username">@{ban.username}</span>
                                                    <span className={`status-badge ${ban.isActive ? 'danger' : 'muted'}`}>{ban.isActive ? 'Aktif' : 'Pasif'}</span>
                                                    {ban.isPermanent && <span className="status-badge purple">Kalıcı</span>}
                                                </div>
                                                <p className="record-reason">{ban.reason}</p>
                                                <div className="record-meta">
                                                    <span><Clock size={14} /> {formatDate(ban.bannedAt)}</span>
                                                    {ban.expiresAt && <span>Bitiş: {formatDate(ban.expiresAt)}</span>}
                                                    <span>Yasaklayan: @{ban.bannedByUsername}</span>
                                                </div>
                                            </div>
                                            {ban.isActive && (
                                                <button onClick={() => handleUnbanUser(ban.userId)} className="btn-success btn-sm">
                                                    <CheckCircle size={14} /> Yasağı Kaldır
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {userBansTotalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            onClick={() => loadUserBansPage(userBansPage - 1)}
                                            disabled={userBansPage <= 1}
                                            className="pagination-btn"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="pagination-info">
                                            Sayfa {userBansPage} / {userBansTotalPages}
                                        </span>
                                        <button
                                            onClick={() => loadUserBansPage(userBansPage + 1)}
                                            disabled={userBansPage >= userBansTotalPages}
                                            className="pagination-btn"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Mute Section */}
                {activeSection === 'mute' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h1><VolumeX size={28} /> Kullanıcı Susturma</h1>
                            <p>Kullanıcıları susturun veya susturmalarını kaldırın</p>
                        </div>

                        <div className="content-card">
                            <div className="card-header">
                                <Search size={20} />
                                <h3>Kullanıcı Ara</h3>
                            </div>
                            <div className="search-form autocomplete-container">
                                <div className="autocomplete-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı adı, isim veya ID ile ara..."
                                        value={userSearchQuery}
                                        onChange={(e) => handleUserAutocomplete(e.target.value)}
                                        onFocus={() => userSearchResults.length > 0 && setShowUserDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                                    />
                                    {userSearchLoading && <span className="search-spinner"></span>}

                                    {showUserDropdown && userSearchResults.length > 0 && (
                                        <div className="autocomplete-dropdown">
                                            {userSearchResults.map((user) => (
                                                <div
                                                    key={user.userId}
                                                    className="autocomplete-item"
                                                    onMouseDown={() => handleSelectUser(user)}
                                                >
                                                    <img
                                                        src={user.profileImg || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=32`}
                                                        alt={user.username}
                                                        className="autocomplete-avatar"
                                                    />
                                                    <div className="autocomplete-info">
                                                        <span className="autocomplete-name">{user.firstName} {user.lastName}</span>
                                                        <span className="autocomplete-username">@{user.username}</span>
                                                    </div>
                                                    <span className={`autocomplete-role ${user.role.toLowerCase()}`}>{user.role}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedUser && (
                                    <div className="selected-user-badge">
                                        <span>Seçili: @{selectedUser.username}</span>
                                        <button type="button" onClick={() => {
                                            setSelectedUser(null);
                                            setSearchUserId('');
                                            setUserSearchQuery('');
                                            setUserMutes([]);
                                        }} className="clear-btn">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="content-card warning-card">
                            <div className="card-header warning">
                                <VolumeX size={20} />
                                <h3>Sustur</h3>
                            </div>
                            <form onSubmit={handleMuteUser} className="action-form">
                                <div className="form-group">
                                    <label>Susturma Sebebi *</label>
                                    <textarea value={muteReason} onChange={(e) => setMuteReason(e.target.value)} placeholder="Susturma sebebini yazınız..." maxLength={500} rows={3} required />
                                    <span className="char-count">{muteReason.length}/500</span>
                                </div>
                                <div className="form-group">
                                    <label>Bitiş Tarihi *</label>
                                    <input type="datetime-local" value={muteExpiresAt} onChange={(e) => setMuteExpiresAt(e.target.value)} min={getMinDateTime()} required />
                                </div>
                                <button type="submit" className="btn-warning" disabled={muteLoading || !searchUserId}>
                                    {muteLoading ? 'İşleniyor...' : 'Sustur'}
                                    <VolumeX size={16} />
                                </button>
                            </form>
                        </div>

                        {userMutes.length > 0 && (
                            <div className="content-card">
                                <div className="card-header">
                                    <AlertTriangle size={20} />
                                    <h3>Susturmalar ({userMutesTotalCount})</h3>
                                </div>
                                <div className="records-list">
                                    {userMutes.map((mute) => (
                                        <div key={mute.id} className={`record-item ${mute.isActive ? 'active' : 'inactive'}`}>
                                            <div className="record-content">
                                                <div className="record-header">
                                                    <span className="record-username">@{mute.username}</span>
                                                    <span className={`status-badge ${mute.isActive ? 'warning' : 'muted'}`}>{mute.isActive ? 'Aktif' : 'Pasif'}</span>
                                                </div>
                                                <p className="record-reason">{mute.reason}</p>
                                                <div className="record-meta">
                                                    <span><Clock size={14} /> {formatDate(mute.mutedAt)}</span>
                                                    <span>Bitiş: {formatDate(mute.expiresAt)}</span>
                                                    <span>Susturan: @{mute.mutedByUsername}</span>
                                                </div>
                                            </div>
                                            {mute.isActive && (
                                                <button onClick={() => handleUnmuteUser(mute.userId)} className="btn-info btn-sm">
                                                    <CheckCircle size={14} /> Susturmayı Kaldır
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {userMutesTotalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            onClick={() => loadUserMutesPage(userMutesPage - 1)}
                                            disabled={userMutesPage <= 1}
                                            className="pagination-btn"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="pagination-info">
                                            Sayfa {userMutesPage} / {userMutesTotalPages}
                                        </span>
                                        <button
                                            onClick={() => loadUserMutesPage(userMutesPage + 1)}
                                            disabled={userMutesPage >= userMutesTotalPages}
                                            className="pagination-btn"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}


                    </div>
                )}


                {/* Thread Section */}
                {
                    activeSection === 'thread' && (
                        <div className="admin-section">
                            <div className="section-header">
                                <h1><MessageSquare size={28} /> Konu Yönetimi</h1>
                                <p>Konuları kilitleyin veya kilidini açın</p>
                            </div>

                            <div className="content-card">
                                <div className="card-header">
                                    <Search size={20} />
                                    <h3>Konu Ara</h3>
                                </div>
                                <div className="search-form autocomplete-container">
                                    <div className="autocomplete-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Konu başlığı ile ara..."
                                            value={threadSearchQuery}
                                            onChange={(e) => handleThreadAutocomplete(e.target.value)}
                                            onFocus={() => threadSearchResults.length > 0 && setShowThreadDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowThreadDropdown(false), 200)}
                                        />
                                        {threadSearchLoading && <span className="search-spinner"></span>}

                                        {showThreadDropdown && threadSearchResults.length > 0 && (
                                            <div className="autocomplete-dropdown">
                                                {threadSearchResults.map((thread) => (
                                                    <div
                                                        key={thread.id}
                                                        className="autocomplete-item thread-item"
                                                        onMouseDown={() => handleSelectThread(thread)}
                                                    >
                                                        <div className="autocomplete-info">
                                                            <span className="autocomplete-name">{thread.title}</span>
                                                            <span className="autocomplete-username">@{thread.username} • {thread.categoryName}</span>
                                                        </div>
                                                        <div className="thread-stats">
                                                            <span>{thread.postCount} yorum</span>
                                                            <span>{thread.viewCount} görüntülenme</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedThread && (
                                        <div className="selected-user-badge">
                                            <span>Seçili: {selectedThread.title.substring(0, 30)}{selectedThread.title.length > 30 ? '...' : ''}</span>
                                            <button type="button" onClick={() => {
                                                setSelectedThread(null);
                                                setSearchThreadId('');
                                                setThreadSearchQuery('');
                                            }} className="clear-btn">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="thread-actions-grid">
                                <div className="content-card action-card danger-card">
                                    <div className="action-icon danger"><Lock size={32} /></div>
                                    <h4>Konuyu Kilitle</h4>
                                    <p>Kilitli konulara yeni yorum yapılamaz.</p>
                                    <button onClick={handleLockThread} disabled={threadLoading || !searchThreadId} className="btn-danger">
                                        {threadLoading ? 'İşleniyor...' : 'Kilitle'}
                                        <Lock size={16} />
                                    </button>
                                </div>
                                <div className="content-card action-card success-card">
                                    <div className="action-icon success"><Unlock size={32} /></div>
                                    <h4>Kilidi Kaldır</h4>
                                    <p>Konu tekrar yoruma açılır.</p>
                                    <button onClick={handleUnlockThread} disabled={threadLoading || !searchThreadId} className="btn-success">
                                        {threadLoading ? 'İşleniyor...' : 'Kilidi Kaldır'}
                                        <Unlock size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Audit Log Section */}
                {
                    activeSection === 'reports' && (
                        <div className="admin-section">
                            <div className="section-header">
                                <h1><Flag size={28} /> Rapor Yönetimi</h1>
                                <p>Kullanıcı raporlarını incele ve yönet</p>
                            </div>

                            <div className="content-card">
                                <div className="card-header" style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Flag size={20} />
                                        <h3>Raporlar</h3>
                                    </div>
                                    <div className="header-actions" style={{ gap: '1.5rem', alignItems: 'center' }}>
                                        <select
                                            value={reportStatusFilter}
                                            onChange={(e) => {
                                                setReportStatusFilter(Number(e.target.value));
                                                setReportsPage(1);
                                            }}
                                            style={{
                                                padding: '0.65rem 1.25rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '500'
                                            }}
                                        >
                                            <option value={0}>Tüm Durumlar</option>
                                            <option value={ReportStatus.Pending}>Beklemede</option>
                                            <option value={ReportStatus.Reviewed}>İncelendi</option>
                                            <option value={ReportStatus.Resolved}>Çözüldü</option>
                                            <option value={ReportStatus.Rejected}>Reddedildi</option>
                                        </select>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '600', minWidth: '80px', textAlign: 'right' }}>
                                            {reportsTotalCount} rapor
                                        </span>
                                    </div>
                                </div>

                                {reportsLoading ? (
                                    <div className="loading-state">
                                        <Activity size={24} className="spinner" />
                                        <p>Raporlar yükleniyor...</p>
                                    </div>
                                ) : reports.length === 0 ? (
                                    <div className="empty-state">
                                        <Flag size={48} />
                                        <h3>Rapor Bulunamadı</h3>
                                        <p>Seçili filtreye göre rapor bulunmuyor.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="reports-grid">
                                            {reports.map((report, index) => (
                                                <div key={report.id} className="report-card">
                                                    <div className="report-card-header">
                                                        <div className="report-number">
                                                            <span className="number-badge">#{(reportsPage - 1) * 10 + index + 1}</span>
                                                        </div>
                                                        <div className="report-status-badge">
                                                            <span
                                                                className={`status-pill ${
                                                                    report.status === ReportStatus.Pending ? 'status-pending' :
                                                                    report.status === ReportStatus.Reviewed ? 'status-reviewed' :
                                                                    report.status === ReportStatus.Resolved ? 'status-resolved' :
                                                                    'status-rejected'
                                                                }`}
                                                            >
                                                                {getReportStatusText(report.status)}
                                                            </span>
                                                        </div>
                                                        <div className="report-actions">
                                                            <button
                                                                className="btn-icon btn-view"
                                                                onClick={() => handleViewReportDetail(report)}
                                                                title="Detay"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-edit"
                                                                onClick={() => handleOpenUpdateStatus(report)}
                                                                title="Durumu Güncelle"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-delete"
                                                                onClick={() => handleDeleteReport(report.id)}
                                                                title="Sil"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="report-card-body">
                                                        <div className="report-row">
                                                            <div className="report-label">
                                                                <User size={14} />
                                                                <span>Raporlayan</span>
                                                            </div>
                                                            <div className="report-value">
                                                                @{report.reporterUsername || 'Bilinmiyor'}
                                                            </div>
                                                        </div>

                                                        <div className="report-row">
                                                            <div className="report-label">
                                                                <Flag size={14} />
                                                                <span>Tip</span>
                                                            </div>
                                                            <div className="report-value">
                                                                <span className="type-badge">
                                                                    {(() => {
                                                                        const type = (report as any).reportedType;
                                                                        if (type === 'User') return 'Kullanıcı';
                                                                        if (type === 'Post') return 'Gönderi';
                                                                        if (type === 'Thread') return 'Konu';
                                                                        // Fallback
                                                                        if (report.reportedUserId) return 'Kullanıcı';
                                                                        if (report.reportedPostId) return 'Gönderi';
                                                                        if (report.reportedThreadId) return 'Konu';
                                                                        return '-';
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="report-row">
                                                            <div className="report-label">
                                                                <AlertTriangle size={14} />
                                                                <span>Hedef</span>
                                                            </div>
                                                            <div className="report-value target-name">
                                                                {(report as any).reportedInfo || 
                                                                    report.reportedUsername || 
                                                                    report.postTitle || 
                                                                    report.threadTitle || '-'}
                                                            </div>
                                                        </div>

                                                        <div className="report-row">
                                                            <div className="report-label">
                                                                <XCircle size={14} />
                                                                <span>Sebep</span>
                                                            </div>
                                                            <div className="report-value">
                                                                <span className="reason-badge">
                                                                    {getReportReasonText(report.reason)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="report-row">
                                                            <div className="report-label">
                                                                <Clock size={14} />
                                                                <span>Tarih</span>
                                                            </div>
                                                            <div className="report-value report-date">
                                                                {new Date(report.createdAt).toLocaleDateString('tr-TR', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {reportsTotalPages > 1 && (
                                            <div className="pagination">
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => setReportsPage(reportsPage - 1)}
                                                    disabled={reportsPage === 1}
                                                >
                                                    <ChevronLeft size={16} />
                                                    Önceki
                                                </button>
                                                <span className="pagination-info">
                                                    Sayfa {reportsPage} / {reportsTotalPages}
                                                </span>
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => setReportsPage(reportsPage + 1)}
                                                    disabled={reportsPage === reportsTotalPages}
                                                >
                                                    Sonraki
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Report Detail Modal */}
                            {isReportDetailModalOpen && selectedReport && (
                                <Modal isOpen={isReportDetailModalOpen} onClose={() => setIsReportDetailModalOpen(false)} title="Rapor Detayları">
                                    <div style={{ padding: '1rem' }}>
                                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '140px 1fr',
                                                gap: '1rem',
                                                paddingBottom: '1rem',
                                                borderBottom: '1px solid var(--border-color)'
                                            }}>
                                                <strong>Raporlayan:</strong>
                                                <span>@{selectedReport.reporterUsername} ({selectedReport.reporterEmail})</span>

                                                <strong>Rapor Tipi:</strong>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    {selectedReport.reportedUserId && (
                                                        <span>Kullanıcı: <strong>@{selectedReport.reportedUsername}</strong></span>
                                                    )}
                                                    {selectedReport.reportedPostId && (
                                                        <span>Gönderi: <strong>{selectedReport.postTitle}</strong></span>
                                                    )}
                                                    {selectedReport.reportedThreadId && (
                                                        <span>Konu: <strong>{selectedReport.threadTitle}</strong></span>
                                                    )}
                                                </div>

                                                <strong>Sebep:</strong>
                                                <span className="badge badge-warning">{getReportReasonText(selectedReport.reason)}</span>

                                                <strong>Durum:</strong>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: selectedReport.status === ReportStatus.Pending ? 'rgba(245, 158, 11, 0.1)' :
                                                            selectedReport.status === ReportStatus.Reviewed ? 'rgba(59, 130, 246, 0.1)' :
                                                                selectedReport.status === ReportStatus.Resolved ? 'rgba(16, 185, 129, 0.1)' :
                                                                    'rgba(239, 68, 68, 0.1)',
                                                        color: selectedReport.status === ReportStatus.Pending ? '#f59e0b' :
                                                            selectedReport.status === ReportStatus.Reviewed ? '#3b82f6' :
                                                                selectedReport.status === ReportStatus.Resolved ? '#10b981' :
                                                                    '#ef4444'
                                                    }}
                                                >
                                                    {getReportStatusText(selectedReport.status)}
                                                </span>

                                                <strong>Rapor Tarihi:</strong>
                                                <span>
                                                    {new Date(selectedReport.createdAt).toLocaleString('tr-TR')}
                                                </span>
                                            </div>

                                            <div>
                                                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Açıklama:</strong>
                                                <div style={{
                                                    background: 'var(--bg-secondary)',
                                                    padding: '1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    lineHeight: '1.6'
                                                }}>
                                                    {selectedReport.description || 'Açıklama yok'}
                                                </div>
                                            </div>

                                            {selectedReport.adminNote && (
                                                <div>
                                                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Admin Notu:</strong>
                                                    <div style={{
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        padding: '1rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                                        lineHeight: '1.6'
                                                    }}>
                                                        {selectedReport.adminNote}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedReport.reviewedAt && (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '140px 1fr',
                                                    gap: '1rem',
                                                    paddingTop: '1rem',
                                                    borderTop: '1px solid var(--border-color)'
                                                }}>
                                                    <strong>İnceleme Tarihi:</strong>
                                                    <span>{new Date(selectedReport.reviewedAt).toLocaleString('tr-TR')}</span>

                                                    {selectedReport.reviewedByUsername && (
                                                        <>
                                                            <strong>İnceleyen Admin:</strong>
                                                            <span>@{selectedReport.reviewedByUsername}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Modal>
                            )}

                            {/* Update Status Modal */}
                            {isUpdateStatusModalOpen && selectedReport && (
                                <Modal isOpen={isUpdateStatusModalOpen} onClose={() => setIsUpdateStatusModalOpen(false)} title="Rapor Durumunu Güncelle">
                                    <div style={{ padding: '1rem' }}>
                                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                                    Durum *
                                                </label>
                                                <select
                                                    value={updateStatusData.status}
                                                    onChange={(e) => setUpdateStatusData({ ...updateStatusData, status: Number(e.target.value) as ReportStatus })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-secondary)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '1rem'
                                                    }}
                                                    required
                                                >
                                                    <option value={ReportStatus.Pending}>Beklemede</option>
                                                    <option value={ReportStatus.Reviewed}>İncelendi</option>
                                                    <option value={ReportStatus.Resolved}>Çözüldü</option>
                                                    <option value={ReportStatus.Rejected}>Reddedildi</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                                    Admin Notu (Opsiyonel)
                                                </label>
                                                <textarea
                                                    value={updateStatusData.adminNote}
                                                    onChange={(e) => setUpdateStatusData({ ...updateStatusData, adminNote: e.target.value })}
                                                    placeholder="İnceleme sonucunuz ve aldığınız aksiyonlar hakkında not..."
                                                    rows={4}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-secondary)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '1rem',
                                                        fontFamily: 'inherit',
                                                        resize: 'vertical'
                                                    }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => setIsUpdateStatusModalOpen(false)}
                                                >
                                                    İptal
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    onClick={handleUpdateReportStatus}
                                                >
                                                    <CheckCircle size={16} />
                                                    Güncelle
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Modal>
                            )}
                        </div>
                    )
                }

                {
                    activeSection === 'logs' && (
                        <div className="admin-section">
                            <div className="section-header">
                                <h1><History size={28} /> İşlem Geçmişi</h1>
                                <p>Tüm admin işlemlerinin kaydı</p>
                            </div>

                            <div className="content-card">
                                <div className="card-header">
                                    <History size={20} />
                                    <h3>İşlem Kayıtları</h3>
                                    <div className="header-actions">
                                        <button className="btn-ghost" onClick={() => setShowFilters(!showFilters)}>
                                            <Filter size={16} />
                                            {showFilters ? 'Gizle' : 'Filtrele'}
                                        </button>
                                    </div>
                                </div>

                                {/* Filters */}
                                {showFilters && (
                                    <div className="filters-panel">
                                        <div className="filter-row">
                                            <div className="filter-group">
                                                <label>İşlem Tipi</label>
                                                <select value={auditFilters.action || ''} onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value as any || undefined })}>
                                                    <option value="">Tümü</option>
                                                    <option value="BanUser">Yasaklama</option>
                                                    <option value="UnbanUser">Yasak Kaldırma</option>
                                                    <option value="MuteUser">Susturma</option>
                                                    <option value="UnmuteUser">Susturma Kaldırma</option>
                                                    <option value="LockThread">Konu Kilitleme</option>
                                                    <option value="UnlockThread">Kilit Kaldırma</option>
                                                </select>
                                            </div>
                                            <div className="filter-group">
                                                <label>Hedef Türü</label>
                                                <select value={auditFilters.entityType || ''} onChange={(e) => setAuditFilters({ ...auditFilters, entityType: e.target.value as any || undefined })}>
                                                    <option value="">Tümü</option>
                                                    <option value="User">Kullanıcı</option>
                                                    <option value="Thread">Konu</option>
                                                </select>
                                            </div>
                                            <div className="filter-actions">
                                                <button onClick={handleApplyFilters} className="btn-primary btn-sm"><Filter size={14} /> Uygula</button>
                                                <button onClick={handleClearFilters} className="btn-ghost btn-sm"><XCircle size={14} /> Temizle</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Cleanup */}
                                <div className="cleanup-panel">
                                    <div className="cleanup-info">
                                        <Trash2 size={16} />
                                        <span>Eski logları temizle</span>
                                    </div>
                                    <div className="cleanup-form">
                                        <input type="number" value={cleanupDays} onChange={(e) => setCleanupDays(parseInt(e.target.value) || 90)} min="1" max="365" />
                                        <span>günden eski</span>
                                        <button onClick={handleCleanupLogs} disabled={cleanupLoading} className="btn-danger btn-sm">
                                            {cleanupLoading ? 'Temizleniyor...' : 'Temizle'}
                                        </button>
                                    </div>
                                </div>

                                <div className="log-info">
                                    <span>Toplam {auditTotalCount} kayıt</span>
                                </div>

                                {/* Logs Table */}
                                {auditLoading ? (
                                    <div className="loading-state">
                                        <div className="loading-spinner"></div>
                                        <p>Yükleniyor...</p>
                                    </div>
                                ) : auditLogs.length > 0 ? (
                                    <div className="logs-table">
                                        <div className="table-header">
                                            <span className="col-action">İşlem</span>
                                            <span className="col-user">Admin</span>
                                            <span className="col-target">Hedef</span>
                                            <span className="col-status">Durum</span>
                                            <span className="col-date">Tarih</span>
                                            <span className="col-actions"></span>
                                        </div>
                                        <div className="table-body">
                                            {auditLogs.map((log) => {
                                                const actionInfo = getActionInfo(log.action);
                                                return (
                                                    <div key={log.id} className="table-row">
                                                        <div className="col-action">
                                                            <span className="action-badge" style={{ backgroundColor: `${actionInfo.color}20`, color: actionInfo.color }}>
                                                                {actionInfo.icon}
                                                                <span>{actionInfo.name}</span>
                                                            </span>
                                                        </div>
                                                        <div className="col-user">@{log.username}</div>
                                                        <div className="col-target"><span className="target-badge">{log.entityType} #{log.entityId}</span></div>
                                                        <div className="col-status">
                                                            {log.success ? (
                                                                <span className="status-success"><CheckCircle size={14} /> Başarılı</span>
                                                            ) : (
                                                                <span className="status-failed"><XCircle size={14} /> Başarısız</span>
                                                            )}
                                                        </div>
                                                        <div className="col-date"><Clock size={14} /> {formatDate(log.createdAt)}</div>
                                                        <div className="col-actions">
                                                            <button onClick={() => handleViewLogDetails(log.id)} className="btn-icon" title="Detaylar">
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <History size={48} />
                                        <p>Henüz işlem geçmişi bulunmuyor.</p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {auditTotalCount > 0 && (
                                    <div className="pagination">
                                        <button onClick={() => setAuditPage(1)} disabled={auditPage === 1} className="pagination-btn" title="İlk Sayfa">
                                            «
                                        </button>
                                        <button onClick={() => setAuditPage(Math.max(1, auditPage - 1))} disabled={auditPage === 1} className="pagination-btn">
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className="pagination-info">Sayfa {auditPage} / {Math.max(1, auditTotalPages)}</span>
                                        <button onClick={() => setAuditPage(Math.min(Math.max(1, auditTotalPages), auditPage + 1))} disabled={auditPage >= auditTotalPages} className="pagination-btn">
                                            <ChevronRight size={18} />
                                        </button>
                                        <button onClick={() => setAuditPage(Math.max(1, auditTotalPages))} disabled={auditPage >= auditTotalPages} className="pagination-btn" title="Son Sayfa">
                                            »
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Clubs Section */}
                {activeSection === 'clubs' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h1><Building2 size={28} /> Kulüp Yönetimi</h1>
                            <p>Kulüpleri görüntüleyin, oluşturun, düzenleyin veya silin</p>
                        </div>

                        <div className="section-actions">
                            <form onSubmit={handleClubListSearch} className="search-form">
                                <input
                                    type="text"
                                    placeholder="Kulüp ara (isim veya açıklama)..."
                                    value={clubsSearch}
                                    onChange={(e) => setClubsSearch(e.target.value)}
                                />
                                <button type="submit" className="btn-primary" disabled={clubsLoading}>
                                    <Search size={16} />
                                    Ara
                                </button>
                            </form>
                            <button className="btn-success" onClick={openCreateClubModal}>
                                <Plus size={16} />
                                Yeni Kulüp
                            </button>
                        </div>

                        <div className="content-card">
                            <div className="card-header">
                                <Building2 size={20} />
                                <h3>Kulüp Listesi</h3>
                                <span className="badge">{clubsTotalCount} kulüp</span>
                            </div>

                            {clubsLoading ? (
                                <div className="loading-state">Yükleniyor...</div>
                            ) : clubs.length === 0 ? (
                                <div className="empty-state">
                                    <Building2 size={48} />
                                    <p>Kulüp bulunamadı.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="user-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Kulüp Adı</th>
                                                    <th>Açıklama</th>
                                                    <th>Kurucu</th>
                                                    <th>Üye Sayısı</th>
                                                    <th>Durum</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clubs.map((club) => (
                                                    <tr key={club.id}>
                                                        <td>
                                                            <div className="user-cell">
                                                                {club.logoUrl ? (
                                                                    <img
                                                                        src={club.logoUrl}
                                                                        alt={club.name}
                                                                        className="user-avatar"
                                                                    />
                                                                ) : (
                                                                    <div className="user-avatar" style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {club.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <strong>{club.name}</strong>
                                                                    <br />
                                                                    <small style={{ color: 'var(--text-secondary)' }}>@{club.slug}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {club.description || '-'}
                                                            </div>
                                                        </td>
                                                        <td>@{club.founderUsername}</td>
                                                        <td>{club.memberCount}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                                <span className={`status-badge ${club.isPublic ? 'success' : 'warning'}`}>
                                                                    {club.isPublic ? 'Herkese Açık' : 'Özel'}
                                                                </span>
                                                                <span className={`status-badge ${club.requiresApproval ? 'warning' : 'success'}`}>
                                                                    {club.requiresApproval ? 'Onay Gerekli' : 'Otomatik'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="btn-icon edit"
                                                                    onClick={() => openEditClubModal(club)}
                                                                    title="Düzenle"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon delete"
                                                                    onClick={() => setDeleteClubModal({ isOpen: true, club })}
                                                                    title="Sil"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {clubsTotalPages > 1 && (
                                        <div className="pagination">
                                            <button
                                                onClick={() => {
                                                    setClubsPage(clubsPage - 1);
                                                }}
                                                disabled={clubsPage <= 1 || clubsLoading}
                                                className="btn-secondary"
                                            >
                                                <ChevronLeft size={16} /> Önceki
                                            </button>
                                            <span className="page-info">
                                                Sayfa {clubsPage} / {clubsTotalPages}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setClubsPage(clubsPage + 1);
                                                }}
                                                disabled={clubsPage >= clubsTotalPages || clubsLoading}
                                                className="btn-secondary"
                                            >
                                                Sonraki <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Club Requests Section */}
                {activeSection === 'club-requests' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h1><Flag size={28} /> Kulüp Başvuruları</h1>
                            <p>Bekleyen kulüp oluşturma başvurularını inceleyin ve değerlendirin</p>
                        </div>

                        <div className="content-card">
                            <div className="card-header">
                                <Flag size={20} />
                                <h3>Bekleyen Başvurular</h3>
                                <span className="badge">{clubRequestsTotalCount} başvuru</span>
                            </div>

                            {clubRequestsLoading ? (
                                <div className="loading-state">Yükleniyor...</div>
                            ) : clubRequests.length === 0 ? (
                                <div className="empty-state">
                                    <Flag size={48} />
                                    <p>Bekleyen kulüp başvurusu bulunmuyor.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="user-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Kulüp Adı</th>
                                                    <th>Başvuran</th>
                                                    <th>Açıklama</th>
                                                    <th>Amaç</th>
                                                    <th>Tarih</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clubRequests.map((request) => (
                                                    <tr key={request.id}>
                                                        <td>
                                                            <strong>{request.name}</strong>
                                                        </td>
                                                        <td>
                                                            <div className="user-cell">
                                                                <div className="user-avatar" style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {request.requestedByUsername.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span>@{request.requestedByUsername}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {request.description || '-'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {request.purpose || '-'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                                {formatDate(request.createdAt)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="btn-icon edit"
                                                                    onClick={() => openReviewRequestModal(request, true)}
                                                                    title="Onayla"
                                                                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon delete"
                                                                    onClick={() => openReviewRequestModal(request, false)}
                                                                    title="Reddet"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {clubRequestsTotalPages > 1 && (
                                        <div className="pagination">
                                            <button
                                                onClick={() => {
                                                    setClubRequestsPage(clubRequestsPage - 1);
                                                }}
                                                disabled={clubRequestsPage <= 1 || clubRequestsLoading}
                                                className="btn-secondary"
                                            >
                                                <ChevronLeft size={16} /> Önceki
                                            </button>
                                            <span className="page-info">
                                                Sayfa {clubRequestsPage} / {clubRequestsTotalPages}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setClubRequestsPage(clubRequestsPage + 1);
                                                }}
                                                disabled={clubRequestsPage >= clubRequestsTotalPages || clubRequestsLoading}
                                                className="btn-secondary"
                                            >
                                                Sonraki <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main >

            <Modal
                isOpen={unbanModal.isOpen}
                onClose={() => setUnbanModal({ isOpen: false, userId: null })}
                title="Yasağı Kaldır"
            >
                <div className="confirmation-content">
                    <div className="confirmation-icon">
                        <AlertCircle size={48} color="#ef4444" />
                    </div>
                    <p className="confirmation-text">
                        Bu kullanıcının yasağını kaldırmak istediğinize emin misiniz?
                        <br />
                        <span className="confirmation-sub">Bu işlem geri alınamaz ancak kullanıcı tekrar yasaklanabilir.</span>
                    </p>
                    <div className="modal-actions">
                        <button
                            onClick={() => setUnbanModal({ isOpen: false, userId: null })}
                            className="btn-secondary"
                        >
                            İptal
                        </button>
                        <button
                            onClick={confirmUnban}
                            className="btn-danger"
                        >
                            Yasağı Kaldır
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={unmuteModal.isOpen}
                onClose={() => setUnmuteModal({ isOpen: false, userId: null })}
                title="Susturmayı Kaldır"
            >
                <div className="confirmation-content">
                    <div className="confirmation-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <VolumeX size={48} color="#3b82f6" />
                    </div>
                    <p className="confirmation-text">
                        Bu kullanıcının susturmasını kaldırmak istediğinize emin misiniz?
                        <br />
                        <span className="confirmation-sub">Kullanıcı tekrar yorum yapabilir ve sohbet edebilir.</span>
                    </p>
                    <div className="modal-actions">
                        <button
                            onClick={() => setUnmuteModal({ isOpen: false, userId: null })}
                            className="btn-secondary"
                        >
                            İptal
                        </button>
                        <button
                            onClick={confirmUnmute}
                            className="btn-info"
                        >
                            Susturmayı Kaldır
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Log Detail Modal */}
            {
                selectedLog && (
                    <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3><Info size={20} /> Log Detayları #{selectedLog.id}</h3>
                                <button onClick={() => setSelectedLog(null)} className="modal-close"><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>İşlem</label>
                                        <span className="action-badge" style={{ backgroundColor: `${getActionInfo(selectedLog.action).color}20`, color: getActionInfo(selectedLog.action).color }}>
                                            {getActionInfo(selectedLog.action).icon}
                                            <span>{getActionInfo(selectedLog.action).name}</span>
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Admin</label>
                                        <span>@{selectedLog.username} (ID: {selectedLog.userId})</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Hedef</label>
                                        <span>{selectedLog.entityType} #{selectedLog.entityId}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Durum</label>
                                        {selectedLog.success ? (
                                            <span className="status-success"><CheckCircle size={14} /> Başarılı</span>
                                        ) : (
                                            <span className="status-failed"><XCircle size={14} /> Başarısız</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Tarih</label>
                                        <span>{formatDate(selectedLog.createdAt)}</span>
                                    </div>
                                    {selectedLog.oldValue && (
                                        <div className="detail-item full">
                                            <label>Eski Değer</label>
                                            <span className="value-box">{selectedLog.oldValue}</span>
                                        </div>
                                    )}
                                    {selectedLog.newValue && (
                                        <div className="detail-item full">
                                            <label>Yeni Değer</label>
                                            <span className="value-box">{selectedLog.newValue}</span>
                                        </div>
                                    )}
                                    {selectedLog.errorMessage && (
                                        <div className="detail-item full">
                                            <label>Hata Mesajı</label>
                                            <span className="value-box error">{selectedLog.errorMessage}</span>
                                        </div>
                                    )}
                                    {selectedLog.ipAddress && (
                                        <div className="detail-item">
                                            <label>IP Adresi</label>
                                            <span>{selectedLog.ipAddress}</span>
                                        </div>
                                    )}
                                    {selectedLog.notes && (
                                        <div className="detail-item full">
                                            <label>Notlar</label>
                                            <span className="value-box">{selectedLog.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminPanel;
