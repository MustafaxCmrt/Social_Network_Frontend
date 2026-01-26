import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { moderationService } from '../services/moderationService';
import { dashboardService } from '../services/dashboardService';
import { auditLogService } from '../services/auditLogService';
import type { UserBan, UserMute, BanUserRequest, MuteUserRequest } from '../services/moderationService';
import type { DashboardStats, TopUser } from '../services/dashboardService';
import type { AuditLogItem, AuditLogFilters } from '../services/auditLogService';
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
    ChevronDown
} from 'lucide-react';
import '../styles/Admin.css';
import { Modal } from '../components/UI/Modal';

const AdminPanel: React.FC = () => {
    const { isAdmin, isAuthenticated, isLoading } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    // Sidebar state
    const [activeSection, setActiveSection] = useState<'dashboard' | 'ban' | 'mute' | 'thread' | 'logs'>('dashboard');

    // Dashboard state
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
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

    // User search
    const [searchUserId, setSearchUserId] = useState<string>('');
    const [searchLoading, setSearchLoading] = useState(false);

    // Thread search
    const [searchThreadId, setSearchThreadId] = useState<string>('');
    const [threadLoading, setThreadLoading] = useState(false);

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
    const [userMutes, setUserMutes] = useState<UserMute[]>([]);

    // Modal state
    const [unbanModal, setUnbanModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });
    const [unmuteModal, setUnmuteModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });

    // Sidebar state
    const [permissionsExpanded, setPermissionsExpanded] = useState(true);

    // Redirect if not admin
    // Redirect if not admin
    useEffect(() => {
        if (isLoading) return; // Wait for auth loading

        if (!isAuthenticated) {
            navigate('/login');
        } else if (!isAdmin) {
            navigate('/');
        }
    }, [isAuthenticated, isAdmin, isLoading, navigate]);

    // Load dashboard data on mount
    useEffect(() => {
        if (isAdmin && activeSection === 'dashboard') {
            loadDashboardData();
        }
    }, [isAdmin, activeSection]);

    // Load audit logs when section changes or page changes
    useEffect(() => {
        if (isAdmin && activeSection === 'logs') {
            loadAuditLogs();
        }
    }, [isAdmin, activeSection, auditPage, auditFilters]);

    const loadDashboardData = async () => {
        setDashboardLoading(true);
        try {
            const [stats, users] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getTopUsers(5)
            ]);
            setDashboardStats(stats);
            setTopUsers(users);
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
                pageSize: 15
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

    // Fetch user bans/mutes
    const handleSearchUser = async () => {
        const userId = parseInt(searchUserId);
        if (isNaN(userId) || userId <= 0) {
            toast.error('Geçersiz ID', 'Geçerli bir kullanıcı ID giriniz.');
            return;
        }

        setSearchLoading(true);
        try {
            if (activeSection === 'ban') {
                const bans = await moderationService.getUserBans(userId);
                setUserBans(bans);
                toast.info('Arama Tamamlandı', `${bans.length} yasak kaydı bulundu.`);
            } else if (activeSection === 'mute') {
                const mutes = await moderationService.getUserMutes(userId);
                setUserMutes(mutes);
                toast.info('Arama Tamamlandı', `${mutes.length} susturma kaydı bulundu.`);
            }
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kullanıcı bilgileri alınamadı.');
        } finally {
            setSearchLoading(false);
        }
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

            const bans = await moderationService.getUserBans(userId);
            setUserBans(bans);
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
                const bans = await moderationService.getUserBans(unbanModal.userId);
                setUserBans(bans);
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

            const mutes = await moderationService.getUserMutes(userId);
            setUserMutes(mutes);
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
                const mutes = await moderationService.getUserMutes(unmuteModal.userId);
                setUserMutes(mutes);
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

    if (!isAdmin) {
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
                        <span>Dashboard</span>
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
                        className={`sidebar-item ${activeSection === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveSection('logs')}
                    >
                        <History size={20} />
                        <span>İşlem Geçmişi</span>
                    </button>
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
                            <h1><BarChart3 size={28} /> Dashboard</h1>
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
                                <p>Dashboard verileri yüklenemedi.</p>
                                <button onClick={loadDashboardData} className="btn-primary">Tekrar Dene</button>
                            </div>
                        )}
                    </div>
                )}

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
                            <div className="search-form">
                                <input
                                    type="number"
                                    placeholder="Kullanıcı ID"
                                    value={searchUserId}
                                    onChange={(e) => setSearchUserId(e.target.value)}
                                    min="1"
                                />
                                <button onClick={handleSearchUser} disabled={searchLoading || !searchUserId} className="btn-primary">
                                    {searchLoading ? 'Aranıyor...' : 'Ara'}
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="content-card danger-card">
                            <div className="card-header danger">
                                <Ban size={20} />
                                <h3>Yasakla</h3>
                            </div>
                            <form onSubmit={handleBanUser} className="action-form">
                                <div className="form-group">
                                    <label>Yasaklama Sebebi</label>
                                    <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Yasaklama sebebini yazınız..." maxLength={500} rows={3} />
                                    <span className="char-count">{banReason.length}/500</span>
                                </div>
                                <div className="form-row">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={isPermanentBan} onChange={(e) => setIsPermanentBan(e.target.checked)} />
                                        <span>Kalıcı Yasak</span>
                                    </label>
                                    {!isPermanentBan && (
                                        <div className="form-group">
                                            <label>Bitiş Tarihi</label>
                                            <input type="datetime-local" value={banExpiresAt} onChange={(e) => setBanExpiresAt(e.target.value)} min={getMinDateTime()} />
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
                                    <h3>Yasaklar ({userBans.length})</h3>
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
                            <div className="search-form">
                                <input
                                    type="number"
                                    placeholder="Kullanıcı ID"
                                    value={searchUserId}
                                    onChange={(e) => setSearchUserId(e.target.value)}
                                    min="1"
                                />
                                <button onClick={handleSearchUser} disabled={searchLoading || !searchUserId} className="btn-primary">
                                    {searchLoading ? 'Aranıyor...' : 'Ara'}
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="content-card warning-card">
                            <div className="card-header warning">
                                <VolumeX size={20} />
                                <h3>Sustur</h3>
                            </div>
                            <form onSubmit={handleMuteUser} className="action-form">
                                <div className="form-group">
                                    <label>Susturma Sebebi</label>
                                    <textarea value={muteReason} onChange={(e) => setMuteReason(e.target.value)} placeholder="Susturma sebebini yazınız..." maxLength={500} rows={3} />
                                    <span className="char-count">{muteReason.length}/500</span>
                                </div>
                                <div className="form-group">
                                    <label>Bitiş Tarihi</label>
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
                                    <h3>Susturmalar ({userMutes.length})</h3>
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
                                            {mute.isActive && new Date(mute.expiresAt) > new Date() && (
                                                <button onClick={() => handleUnmuteUser(mute.userId)} className="btn-info btn-sm">
                                                    <CheckCircle size={14} /> Susturmayı Kaldır
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                                <div className="search-form">
                                    <input
                                        type="number"
                                        placeholder="Konu ID"
                                        value={searchThreadId}
                                        onChange={(e) => setSearchThreadId(e.target.value)}
                                        min="1"
                                    />
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
                                                <label>Entity Tipi</label>
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
