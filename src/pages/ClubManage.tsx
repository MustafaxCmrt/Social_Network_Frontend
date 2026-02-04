import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Building2, 
    Users, 
    ArrowLeft, 
    CheckCircle, 
    X, 
    UserX, 
    Shield, 
    UserCheck, 
    Clock,
    Search,
    ChevronDown
} from 'lucide-react';
import { clubService } from '../services/clubService';
import type { Club, ClubMembership, MembershipStatus, MembershipAction, ClubRole } from '../types/club';
import { 
    MembershipStatus as MembershipStatusEnum,
    MembershipAction as MembershipActionEnum,
    ClubRole as ClubRoleEnum,
    getMembershipStatusText,
    getClubRoleText
} from '../types/club';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/UI/Modal';
import { isAdminOrModerator as checkIsAdminOrModerator } from '../types/roles';
import '../styles/Home.css';

const ClubManage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const [club, setClub] = useState<Club | null>(null);
    const [members, setMembers] = useState<ClubMembership[]>([]); // Filtrelenmiş üyeler (görüntüleme için)
    const [allMembers, setAllMembers] = useState<ClubMembership[]>([]); // Tüm üyeler (istatistikler için)
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

    // Filters
    const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Action modals
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<ClubMembership | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'kick' | 'role' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [newRole, setNewRole] = useState<ClubRole>(ClubRoleEnum.Member);
    const [actionLoading, setActionLoading] = useState(false);

    // Check if user is admin/moderator or club president
    const isAdminOrPresident = user && club && (
        checkIsAdminOrModerator(user) || 
        (club.currentUserRole === ClubRoleEnum.President)
    );

    useEffect(() => {
        if (id) {
            loadClub();
        }
    }, [id]);

    useEffect(() => {
        if (id && club) {
            loadMembers();
            loadAllMembersForStats(); // İstatistikler için tüm üyeleri yükle
        }
    }, [id, club, page, statusFilter]);

    // Search query değiştiğinde sadece görüntülenen listeyi filtrele
    useEffect(() => {
        if (members.length > 0 || searchQuery.trim()) {
            filterMembersBySearch();
        }
    }, [searchQuery]);

    const loadClub = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const clubData = await clubService.getById(id);
            setClub(clubData);
            
            // Check if user has permission
            const hasPermission = checkIsAdminOrModerator(user) || 
                (clubData.currentUserRole === ClubRoleEnum.President);
            
            if (!hasPermission) {
                setError('Bu sayfaya erişim yetkiniz yok.');
            }
        } catch (error: any) {
            setError(error.message || 'Kulüp yüklenemedi.');
            toast.error('Hata', error.message || 'Kulüp yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    // Tüm üyeleri yükle (istatistikler için - filtre olmadan)
    const loadAllMembersForStats = async () => {
        if (!id || !club) return;
        setStatsLoading(true);
        try {
            // Tüm üyeleri yükle (status filter olmadan, sayfalama olmadan)
            const response = await clubService.getMembers(
                parseInt(id),
                1,
                1000, // Büyük sayfa boyutu ile tüm üyeleri al
                undefined // Status filter yok
            );
            setAllMembers(response.items);
        } catch (error: any) {
            console.error('İstatistikler yüklenemedi:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    // Görüntüleme için üyeleri yükle (filtrelenmiş)
    const loadMembers = async () => {
        if (!id || !club) return;
        setMembersLoading(true);
        try {
            const status = statusFilter === 'all' ? undefined : statusFilter;
            const response = await clubService.getMembers(
                parseInt(id),
                page,
                pageSize,
                status
            );
            
            setMembers(response.items);
            setTotalPages(response.totalPages);
            setTotalCount(response.totalCount);
            
            // Search query varsa filtrele
            filterMembersBySearch(response.items);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Üyeler yüklenemedi.');
        } finally {
            setMembersLoading(false);
        }
    };

    // Search query'ye göre üyeleri filtrele
    const filterMembersBySearch = (membersToFilter?: ClubMembership[]) => {
        // Eğer status filter varsa, önce status'a göre filtrelenmiş üyeleri al
        // Sonra search query'ye göre filtrele
        if (membersToFilter) {
            // loadMembers'den geldi, zaten status'a göre filtrelenmiş
            if (!searchQuery.trim()) {
                setMembers(membersToFilter);
                return;
            }
            
            const query = searchQuery.toLowerCase();
            const filtered = membersToFilter.filter(member =>
                member.username.toLowerCase().includes(query) ||
                member.firstName.toLowerCase().includes(query) ||
                member.lastName.toLowerCase().includes(query)
            );
            setMembers(filtered);
        } else {
            // Search query değişti, mevcut members listesini filtrele
            if (!searchQuery.trim()) {
                // Search temizlendi, status filter'a göre yeniden yükle
                loadMembers();
                return;
            }
            
            const query = searchQuery.toLowerCase();
            const filtered = members.filter(member =>
                member.username.toLowerCase().includes(query) ||
                member.firstName.toLowerCase().includes(query) ||
                member.lastName.toLowerCase().includes(query)
            );
            setMembers(filtered);
        }
    };

    const handleAction = (member: ClubMembership, action: 'approve' | 'reject' | 'kick' | 'role') => {
        setSelectedMember(member);
        setActionType(action);
        setActionModalOpen(true);
        if (action === 'role') {
            setNewRole(member.role);
        } else {
            setRejectionReason('');
        }
    };

    const confirmAction = async () => {
        if (!selectedMember || !actionType) return;

        setActionLoading(true);
        try {
            if (actionType === 'approve') {
                await clubService.performMembershipAction(
                    selectedMember.membershipId,
                    MembershipActionEnum.Approve
                );
                toast.success('Başarılı', 'Üyelik başvurusu onaylandı!');
            } else if (actionType === 'reject') {
                await clubService.performMembershipAction(
                    selectedMember.membershipId,
                    MembershipActionEnum.Reject
                );
                toast.success('Başarılı', 'Üyelik başvurusu reddedildi!');
            } else if (actionType === 'kick') {
                await clubService.performMembershipAction(
                    selectedMember.membershipId,
                    MembershipActionEnum.Kick
                );
                toast.success('Başarılı', 'Üye kulüpten atıldı!');
            } else if (actionType === 'role') {
                await clubService.updateMemberRole(
                    selectedMember.membershipId,
                    newRole
                );
                toast.success('Başarılı', 'Üye rolü güncellendi!');
            }

            setActionModalOpen(false);
            setSelectedMember(null);
            setActionType(null);
            await loadMembers();
            await loadAllMembersForStats(); // İstatistikleri yenile
            await loadClub(); // Refresh club data
        } catch (error: any) {
            toast.error('Hata', error.message || 'İşlem gerçekleştirilemedi.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="home-container">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !club) {
        return (
            <div className="home-container">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h2>Erişim Reddedildi</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        {error || 'Bu sayfaya erişim yetkiniz yok.'}
                    </p>
                    <button className="btn-primary" onClick={() => navigate(`/club/${id}`)}>
                        Kulüp Detayına Dön
                    </button>
                </div>
            </div>
        );
    }

    if (!isAdminOrPresident) {
        return (
            <div className="home-container">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h2>Erişim Reddedildi</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Bu sayfaya erişmek için kulüp başkanı veya admin/moderator olmanız gerekiyor.
                    </p>
                    <button className="btn-primary" onClick={() => navigate(`/club/${id}`)}>
                        Kulüp Detayına Dön
                    </button>
                </div>
            </div>
        );
    }

    // İstatistikler için tüm üyeleri kullan (filtre olmadan)
    const pendingMembers = allMembers.filter(m => m.status === MembershipStatusEnum.Pending);
    const approvedMembers = allMembers.filter(m => m.status === MembershipStatusEnum.Approved);
    const totalMembersCount = allMembers.length;

    return (
        <div className="home-container">
            <div className="forum-layout">
                {/* Header */}
                <div style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--navbar-border)',
                        borderRadius: '16px',
                        padding: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => navigate(`/club/${id}`)}
                                    style={{
                                        padding: '0.5rem',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--navbar-border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                                        {club.name} - Üyelik Yönetimi
                                    </h1>
                                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Kulüp üyelerini ve başvurularını yönetin
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main style={{ gridColumn: '1 / -1' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--navbar-border)',
                        borderRadius: '16px',
                        padding: '1.5rem'
                    }}>
                        {/* Filters */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            marginBottom: '1.5rem',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ 
                                        position: 'absolute', 
                                        left: '0.75rem', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-secondary)'
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Üye ara..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                            border: '1px solid var(--navbar-border)',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem',
                                            background: 'var(--bg-secondary)'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value as MembershipStatus | 'all');
                                        setPage(1);
                                    }}
                                    style={{
                                        padding: '0.75rem 2.5rem 0.75rem 1rem',
                                        border: '1px solid var(--navbar-border)',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem',
                                        background: 'var(--bg-secondary)',
                                        cursor: 'pointer',
                                        appearance: 'none'
                                    }}
                                >
                                    <option value="all">Tüm Durumlar</option>
                                    <option value={MembershipStatusEnum.Pending}>Beklemede</option>
                                    <option value={MembershipStatusEnum.Approved}>Onaylandı</option>
                                    <option value={MembershipStatusEnum.Rejected}>Reddedildi</option>
                                    <option value={MembershipStatusEnum.Left}>Ayrıldı</option>
                                    <option value={MembershipStatusEnum.Kicked}>Atıldı</option>
                                </select>
                                <ChevronDown size={18} style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: 'var(--text-secondary)'
                                }} />
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            marginBottom: '1.5rem',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                flex: 1,
                                minWidth: '150px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <Clock size={18} style={{ color: '#f59e0b' }} />
                                    <strong style={{ fontSize: '0.875rem', color: '#f59e0b' }}>Bekleyen Başvurular</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                                    {pendingMembers.length}
                                </p>
                            </div>
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                flex: 1,
                                minWidth: '150px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <UserCheck size={18} style={{ color: '#10b981' }} />
                                    <strong style={{ fontSize: '0.875rem', color: '#10b981' }}>Onaylı Üyeler</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                                    {approvedMembers.length}
                                </p>
                            </div>
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '8px',
                                flex: 1,
                                minWidth: '150px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <Users size={18} style={{ color: '#6366f1' }} />
                                    <strong style={{ fontSize: '0.875rem', color: '#6366f1' }}>Toplam Üye</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                                    {totalMembersCount}
                                </p>
                            </div>
                        </div>

                        {/* Members List */}
                        {membersLoading ? (
                            <div className="loading-state">Üyeler yükleniyor...</div>
                        ) : members.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>Henüz üye bulunmuyor.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {members.map(member => (
                                    <div
                                        key={member.membershipId}
                                        style={{
                                            padding: '1rem',
                                            border: '1px solid var(--navbar-border)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            background: 'var(--bg-secondary)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: member.profileImg 
                                                    ? `url(${member.profileImg}) center/cover`
                                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem'
                                            }}>
                                                {!member.profileImg && (
                                                    `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <strong style={{ fontSize: '1rem' }}>
                                                        {member.firstName} {member.lastName}
                                                    </strong>
                                                    <span style={{ 
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        background: member.status === MembershipStatusEnum.Approved 
                                                            ? 'rgba(16, 185, 129, 0.1)'
                                                            : member.status === MembershipStatusEnum.Pending
                                                            ? 'rgba(245, 158, 11, 0.1)'
                                                            : 'rgba(239, 68, 68, 0.1)',
                                                        color: member.status === MembershipStatusEnum.Approved
                                                            ? '#10b981'
                                                            : member.status === MembershipStatusEnum.Pending
                                                            ? '#f59e0b'
                                                            : '#ef4444'
                                                    }}>
                                                        {getMembershipStatusText(member.status)}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    @{member.username} • {getClubRoleText(member.role)}
                                                    {member.joinedAt && ` • ${new Date(member.joinedAt).toLocaleDateString('tr-TR')}`}
                                                </div>
                                                {member.joinNote && member.status === MembershipStatusEnum.Pending && (
                                                    <div style={{ 
                                                        marginTop: '0.5rem',
                                                        padding: '0.5rem',
                                                        background: 'rgba(99, 102, 241, 0.05)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        <strong>Başvuru Notu:</strong> {member.joinNote}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {member.status === MembershipStatusEnum.Pending && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(member, 'approve')}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '6px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                                            color: '#10b981',
                                                            cursor: 'pointer',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                                                            e.currentTarget.style.borderColor = '#10b981';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        <CheckCircle size={16} />
                                                        Onayla
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(member, 'reject')}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '6px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                                            e.currentTarget.style.borderColor = '#ef4444';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        <X size={16} />
                                                        Reddet
                                                    </button>
                                                </>
                                            )}
                                            {member.status === MembershipStatusEnum.Approved && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(member, 'role')}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '6px',
                                                            background: 'rgba(99, 102, 241, 0.1)',
                                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                                            color: '#6366f1',
                                                            cursor: 'pointer',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                                                            e.currentTarget.style.borderColor = '#6366f1';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.2)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        <Shield size={16} />
                                                        Rol Değiştir
                                                    </button>
                                                    {member.role !== ClubRoleEnum.President && (
                                                        <button
                                                            onClick={() => handleAction(member, 'kick')}
                                                            style={{
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '6px',
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 500,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                                                e.currentTarget.style.borderColor = '#ef4444';
                                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }}
                                                        >
                                                            <UserX size={16} />
                                                            At
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginTop: '1.5rem'
                            }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '0.5rem 1rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (page !== 1) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    Önceki
                                </button>
                                <span style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    Sayfa {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '0.5rem 1rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (page !== totalPages) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    Sonraki
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Action Modals */}
            <Modal
                isOpen={actionModalOpen && (actionType === 'approve' || actionType === 'reject' || actionType === 'kick')}
                onClose={() => {
                    setActionModalOpen(false);
                    setSelectedMember(null);
                    setActionType(null);
                    setRejectionReason('');
                }}
                title={
                    actionType === 'approve' ? 'Üyelik Başvurusunu Onayla' :
                    actionType === 'reject' ? 'Üyelik Başvurusunu Reddet' :
                    actionType === 'kick' ? 'Üyeyi Kulüpten At' : ''
                }
            >
                <div style={{ padding: '1rem 0' }}>
                    {selectedMember && (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                    {actionType === 'approve' && (
                                        <strong>{selectedMember.firstName} {selectedMember.lastName}</strong>
                                    )} {actionType === 'approve' 
                                        ? 'adlı kullanıcının üyelik başvurusunu onaylamak istediğinize emin misiniz?'
                                        : actionType === 'reject'
                                        ? 'adlı kullanıcının üyelik başvurusunu reddetmek istediğinize emin misiniz?'
                                        : 'adlı kullanıcıyı kulüpten atmak istediğinize emin misiniz?'}
                                </p>
                            </div>
                            {actionType === 'reject' && (
                                <div className="form-group">
                                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>
                                        Reddetme Nedeni (Opsiyonel)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Reddetme nedenini belirtin..."
                                        rows={3}
                                        maxLength={500}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid var(--navbar-border)',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            )}
                            <div className="modal-actions" style={{ 
                                display: 'flex',
                                gap: '0.75rem',
                                justifyContent: 'flex-end',
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActionModalOpen(false);
                                        setSelectedMember(null);
                                        setActionType(null);
                                        setRejectionReason('');
                                    }}
                                    className="btn-secondary"
                                    disabled={actionLoading}
                                    style={{
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!actionLoading) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmAction}
                                    className={actionType === 'kick' || actionType === 'reject' ? 'btn-danger' : 'btn-primary'}
                                    disabled={actionLoading}
                                    style={{
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!actionLoading) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {actionLoading ? 'İşleniyor...' : (
                                        actionType === 'approve' ? 'Onayla' :
                                        actionType === 'reject' ? 'Reddet' :
                                        'At'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Role Change Modal */}
            <Modal
                isOpen={actionModalOpen && actionType === 'role'}
                onClose={() => {
                    setActionModalOpen(false);
                    setSelectedMember(null);
                    setActionType(null);
                    setNewRole(ClubRoleEnum.Member);
                }}
                title="Üye Rolünü Değiştir"
            >
                <div style={{ padding: '1rem 0' }}>
                    {selectedMember && (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                    <strong>{selectedMember.firstName} {selectedMember.lastName}</strong> adlı kullanıcının rolünü değiştirin.
                                </p>
                            </div>
                            <div className="form-group">
                                <label style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    Yeni Rol
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(Number(e.target.value) as ClubRole)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid var(--navbar-border)',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value={ClubRoleEnum.Member}>Üye</option>
                                    <option value={ClubRoleEnum.Officer}>Yönetici</option>
                                    <option value={ClubRoleEnum.VicePresident}>Başkan Yardımcısı</option>
                                    <option value={ClubRoleEnum.President}>Başkan</option>
                                </select>
                            </div>
                            <div className="modal-actions" style={{ 
                                display: 'flex',
                                gap: '0.75rem',
                                justifyContent: 'flex-end',
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActionModalOpen(false);
                                        setSelectedMember(null);
                                        setActionType(null);
                                        setNewRole(ClubRoleEnum.Member);
                                    }}
                                    className="btn-secondary"
                                    disabled={actionLoading}
                                    style={{
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!actionLoading) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmAction}
                                    className="btn-primary"
                                    disabled={actionLoading || newRole === selectedMember.role}
                                    style={{
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!actionLoading && newRole !== selectedMember?.role) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {actionLoading ? 'Güncelleniyor...' : 'Güncelle'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ClubManage;
