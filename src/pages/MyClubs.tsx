import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, MessageSquare, FileText, Plus, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { clubService } from '../services/clubService';
import type { UserClubMembership, CreateClubRequestDto, ClubRequest, ClubApplication } from '../types/club';
import { getClubRoleText, getMembershipStatusText, getClubRequestStatusText, getClubApplicationStatusText, ClubRequestStatus, ClubApplicationStatus } from '../types/club';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/UI/Modal';
import '../styles/Home.css';

const MyClubs: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    const [userClubs, setUserClubs] = useState<UserClubMembership[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Club requests state (kulüp açma başvuruları)
    const [myClubRequests, setMyClubRequests] = useState<ClubRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    
    // Club applications state (kulüpe katılma başvuruları)
    const [myApplications, setMyApplications] = useState<ClubApplication[]>([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [applicationsPage, setApplicationsPage] = useState(1);
    const [applicationsTotalPages, setApplicationsTotalPages] = useState(1);
    const [applicationsTotalCount, setApplicationsTotalCount] = useState(0);
    const [applicationStatusFilter, setApplicationStatusFilter] = useState<ClubApplicationStatus | 'all'>('all');
    
    // Club request modal state
    const [createClubModalOpen, setCreateClubModalOpen] = useState(false);
    const [clubRequestData, setClubRequestData] = useState<CreateClubRequestDto>({
        name: '',
        description: '',
        purpose: ''
    });
    const [clubRequestLoading, setClubRequestLoading] = useState(false);

    const loadUserClubs = async () => {
        setLoading(true);
        try {
            const clubs = await clubService.getMine();
            setUserClubs(clubs);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulüpler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const loadMyClubRequests = async () => {
        setRequestsLoading(true);
        try {
            const requests = await clubService.getMyRequests();
            console.log('Loaded club requests:', requests);
            setMyClubRequests(requests || []);
        } catch (error: any) {
            console.error('Failed to load club requests:', error);
            // Show error only if it's not a 404 (endpoint might not exist)
            if (error.message && !error.message.includes('404') && !error.message.includes('Not Found')) {
                toast.error('Hata', 'Başvurular yüklenirken bir hata oluştu: ' + error.message);
            }
            setMyClubRequests([]);
        } finally {
            setRequestsLoading(false);
        }
    };

    const loadMyApplications = async () => {
        setApplicationsLoading(true);
        try {
            const status = applicationStatusFilter === 'all' ? undefined : applicationStatusFilter;
            const response = await clubService.getMyApplications(applicationsPage, 10, status);
            setMyApplications(response.items);
            setApplicationsTotalPages(response.totalPages);
            setApplicationsTotalCount(response.totalCount);
        } catch (error: any) {
            console.error('Failed to load club applications:', error);
            // Silently fail if endpoint doesn't exist yet
            setMyApplications([]);
        } finally {
            setApplicationsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadUserClubs();
        loadMyClubRequests();
        loadMyApplications();
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            loadMyApplications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationsPage, applicationStatusFilter]);

    const handleCreateClubRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validations
        if (!clubRequestData.name.trim()) {
            toast.error('Hata', 'Kulüp adı zorunludur.');
            return;
        }
        if (clubRequestData.name.length < 3) {
            toast.error('Hata', 'Kulüp adı en az 3 karakter olmalıdır.');
            return;
        }
        if (clubRequestData.name.length > 100) {
            toast.error('Hata', 'Kulüp adı en fazla 100 karakter olabilir.');
            return;
        }
        if (!clubRequestData.description.trim()) {
            toast.error('Hata', 'Kulüp açıklaması zorunludur.');
            return;
        }
        if (clubRequestData.description.length < 20) {
            toast.error('Hata', 'Kulüp açıklaması en az 20 karakter olmalıdır.');
            return;
        }
        if (clubRequestData.description.length > 500) {
            toast.error('Hata', 'Kulüp açıklaması en fazla 500 karakter olabilir.');
            return;
        }
        if (!clubRequestData.purpose.trim()) {
            toast.error('Hata', 'Kulüp amacı zorunludur.');
            return;
        }
        if (clubRequestData.purpose.length < 10) {
            toast.error('Hata', 'Kulüp amacı en az 10 karakter olmalıdır.');
            return;
        }
        if (clubRequestData.purpose.length > 1000) {
            toast.error('Hata', 'Kulüp amacı en fazla 1000 karakter olabilir.');
            return;
        }

        setClubRequestLoading(true);
        try {
            await clubService.createRequest(clubRequestData);
            toast.success('Başarılı', 'Kulüp başvurunuz gönderildi! Admin/moderator onayından sonra kulüp açılacaktır.');
            setCreateClubModalOpen(false);
            setClubRequestData({
                name: '',
                description: '',
                purpose: ''
            });
            // Reload requests to show the new one
            loadMyClubRequests();
        } catch (error: any) {
            // Backend validation errors
            if (error.formattedMessage) {
                toast.error('Validation Hatası', error.formattedMessage);
            } else {
                toast.error('Hata', error.message || 'Kulüp başvurusu gönderilemedi.');
            }
        } finally {
            setClubRequestLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="home-container">
            <div style={{ 
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: '2rem', 
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                    }}>
                        <Building2 size={32} style={{ color: 'var(--accent-color)' }} />
                        Kulüplerim
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Katıldığınız kulüpler ve üyelik bilgileriniz
                    </p>
                </div>
                <button
                    onClick={() => setCreateClubModalOpen(true)}
                    className="btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        transition: 'all 0.2s ease',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        fontWeight: 500
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Plus size={18} />
                    Kulüp Aç
                </button>
            </div>

            {/* Club Requests Section - Always visible */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1.5rem', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Clock size={24} style={{ color: 'var(--accent-color)' }} />
                    Kulüp Başvurularım
                </h2>
                {requestsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Başvurular yükleniyor...</p>
                    </div>
                ) : myClubRequests.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--navbar-border)',
                        borderRadius: '16px'
                    }}>
                        <Clock size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            Henüz kulüp açma başvurunuz bulunmuyor.
                        </p>
                    </div>
                ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {myClubRequests.map((request) => {
                            const statusColor = request.status === ClubRequestStatus.Approved 
                                ? '#10b981' 
                                : request.status === ClubRequestStatus.Rejected 
                                ? '#ef4444' 
                                : '#f59e0b';
                            const statusBg = request.status === ClubRequestStatus.Approved 
                                ? 'rgba(16, 185, 129, 0.1)' 
                                : request.status === ClubRequestStatus.Rejected 
                                ? 'rgba(239, 68, 68, 0.1)' 
                                : 'rgba(245, 158, 11, 0.1)';
                            const StatusIcon = request.status === ClubRequestStatus.Approved 
                                ? CheckCircle 
                                : request.status === ClubRequestStatus.Rejected 
                                ? XCircle 
                                : Clock;

                            return (
                                <div
                                    key={request.id}
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: '16px',
                                        border: '1px solid var(--navbar-border)',
                                        background: 'var(--bg-card)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.5rem',
                                        opacity: request.status === ClubRequestStatus.Approved ? 1 : 0.8
                                    }}
                                >
                                    <div style={{
                                        width: '70px',
                                        height: '70px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1.75rem',
                                        flexShrink: 0
                                    }}>
                                        {request.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ 
                                            margin: 0, 
                                            marginBottom: '0.5rem',
                                            fontSize: '1.25rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {request.name}
                                        </h3>
                                        <p style={{
                                            margin: 0,
                                            marginBottom: '0.75rem',
                                            fontSize: '0.875rem',
                                            color: 'var(--text-secondary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {request.description}
                                        </p>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '1rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: '8px',
                                                background: statusBg,
                                                color: statusColor,
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <StatusIcon size={14} />
                                                {getClubRequestStatusText(request.status)}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                Başvuru: {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                                            </span>
                                            {request.reviewedAt && (
                                                <span style={{ 
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    İnceleme: {new Date(request.reviewedAt).toLocaleDateString('tr-TR')}
                                                </span>
                                            )}
                                        </div>
                                        {request.rejectionReason && (
                                            <div style={{
                                                marginTop: '0.75rem',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)'
                                            }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '0.875rem',
                                                    color: '#ef4444',
                                                    fontWeight: 500
                                                }}>
                                                    <strong>Red Nedeni:</strong> {request.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Club Applications Section (Kulüpe Katılma Başvuruları) */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1.5rem', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Users size={24} style={{ color: 'var(--accent-color)' }} />
                    Kulüpe Katılma Başvurularım
                </h2>
                
                {/* Status Filter */}
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setApplicationStatusFilter('all')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--navbar-border)',
                            background: applicationStatusFilter === 'all' ? 'var(--accent-color)' : 'var(--bg-card)',
                            color: applicationStatusFilter === 'all' ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (applicationStatusFilter !== 'all') {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (applicationStatusFilter !== 'all') {
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }
                        }}
                    >
                        Hepsi ({applicationsTotalCount})
                    </button>
                    <button
                        onClick={() => setApplicationStatusFilter(ClubApplicationStatus.Pending)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--navbar-border)',
                            background: applicationStatusFilter === ClubApplicationStatus.Pending ? '#f59e0b' : 'var(--bg-card)',
                            color: applicationStatusFilter === ClubApplicationStatus.Pending ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (applicationStatusFilter !== ClubApplicationStatus.Pending) {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (applicationStatusFilter !== ClubApplicationStatus.Pending) {
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }
                        }}
                    >
                        Beklemede
                    </button>
                    <button
                        onClick={() => setApplicationStatusFilter(ClubApplicationStatus.Approved)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--navbar-border)',
                            background: applicationStatusFilter === ClubApplicationStatus.Approved ? '#10b981' : 'var(--bg-card)',
                            color: applicationStatusFilter === ClubApplicationStatus.Approved ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (applicationStatusFilter !== ClubApplicationStatus.Approved) {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (applicationStatusFilter !== ClubApplicationStatus.Approved) {
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }
                        }}
                    >
                        Onaylandı
                    </button>
                    <button
                        onClick={() => setApplicationStatusFilter(ClubApplicationStatus.Rejected)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--navbar-border)',
                            background: applicationStatusFilter === ClubApplicationStatus.Rejected ? '#ef4444' : 'var(--bg-card)',
                            color: applicationStatusFilter === ClubApplicationStatus.Rejected ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (applicationStatusFilter !== ClubApplicationStatus.Rejected) {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (applicationStatusFilter !== ClubApplicationStatus.Rejected) {
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }
                        }}
                    >
                        Reddedildi
                    </button>
                </div>

                {applicationsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Başvurular yükleniyor...</p>
                    </div>
                ) : myApplications.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--navbar-border)',
                        borderRadius: '16px'
                    }}>
                        <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            Henüz kulüpe katılma başvurunuz bulunmuyor.
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {myApplications.map((application) => {
                                const statusColor = application.applicationStatus === ClubApplicationStatus.Approved 
                                    ? '#10b981' 
                                    : application.applicationStatus === ClubApplicationStatus.Rejected 
                                    ? '#ef4444' 
                                    : '#f59e0b';
                                const statusBg = application.applicationStatus === ClubApplicationStatus.Approved 
                                    ? 'rgba(16, 185, 129, 0.1)' 
                                    : application.applicationStatus === ClubApplicationStatus.Rejected 
                                    ? 'rgba(239, 68, 68, 0.1)' 
                                    : 'rgba(245, 158, 11, 0.1)';
                                const StatusIcon = application.applicationStatus === ClubApplicationStatus.Approved 
                                    ? CheckCircle 
                                    : application.applicationStatus === ClubApplicationStatus.Rejected 
                                    ? XCircle 
                                    : Clock;

                                return (
                                    <div
                                        key={application.id}
                                        onClick={() => application.applicationStatus === ClubApplicationStatus.Approved && navigate(`/club/${application.id}`)}
                                        style={{
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            border: '1px solid var(--navbar-border)',
                                            background: 'var(--bg-card)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1.5rem',
                                            opacity: application.applicationStatus === ClubApplicationStatus.Approved ? 1 : 0.8,
                                            cursor: application.applicationStatus === ClubApplicationStatus.Approved ? 'pointer' : 'default',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (application.applicationStatus === ClubApplicationStatus.Approved) {
                                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.03)';
                                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (application.applicationStatus === ClubApplicationStatus.Approved) {
                                                e.currentTarget.style.background = 'var(--bg-card)';
                                                e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        {application.logoUrl ? (
                                            <img 
                                                src={application.logoUrl} 
                                                alt={application.name}
                                                style={{
                                                    width: '70px',
                                                    height: '70px',
                                                    borderRadius: '12px',
                                                    objectFit: 'cover',
                                                    flexShrink: 0,
                                                    border: '2px solid var(--navbar-border)'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '70px',
                                                height: '70px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.75rem',
                                                flexShrink: 0
                                            }}>
                                                {application.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ 
                                                margin: 0, 
                                                marginBottom: '0.5rem',
                                                fontSize: '1.25rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {application.name}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                marginBottom: '0.75rem',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {application.description}
                                            </p>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '1rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: '8px',
                                                    background: statusBg,
                                                    color: statusColor,
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <StatusIcon size={14} />
                                                    {getClubApplicationStatusText(application.applicationStatus)}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    Üye Sayısı: {application.memberCount}
                                                </span>
                                                {application.reviewedAt && (
                                                    <span style={{ 
                                                        fontSize: '0.875rem',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        İnceleme: {new Date(application.reviewedAt).toLocaleDateString('tr-TR')}
                                                    </span>
                                                )}
                                            </div>
                                            {application.rejectionReason && (
                                                <div style={{
                                                    marginTop: '0.75rem',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                                }}>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '0.875rem',
                                                        color: '#ef4444',
                                                        fontWeight: 500
                                                    }}>
                                                        <strong>Red Nedeni:</strong> {application.rejectionReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {application.applicationStatus === ClubApplicationStatus.Approved && (
                                            <ChevronRight size={24} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Pagination */}
                        {applicationsTotalPages > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginTop: '1.5rem'
                            }}>
                                <button
                                    onClick={() => setApplicationsPage(p => Math.max(1, p - 1))}
                                    disabled={applicationsPage === 1}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--navbar-border)',
                                        background: applicationsPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                        color: applicationsPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        cursor: applicationsPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.875rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (applicationsPage !== 1) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (applicationsPage !== 1) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    Önceki
                                </button>
                                <span style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Sayfa {applicationsPage} / {applicationsTotalPages}
                                </span>
                                <button
                                    onClick={() => setApplicationsPage(p => Math.min(applicationsTotalPages, p + 1))}
                                    disabled={applicationsPage === applicationsTotalPages}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--navbar-border)',
                                        background: applicationsPage === applicationsTotalPages ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                        color: applicationsPage === applicationsTotalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        cursor: applicationsPage === applicationsTotalPages ? 'not-allowed' : 'pointer',
                                        fontSize: '0.875rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (applicationsPage !== applicationsTotalPages) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (applicationsPage !== applicationsTotalPages) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    Sonraki
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* My Clubs Section */}
            <div style={{ marginBottom: (myClubRequests.length > 0 || myApplications.length > 0) ? '2rem' : '0' }}>
                <h2 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1.5rem', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Building2 size={24} style={{ color: 'var(--accent-color)' }} />
                    Katıldığım Kulüpler
                </h2>
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Yükleniyor...</p>
                </div>
            ) : userClubs.length === 0 ? (
                <div style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--navbar-border)',
                    borderRadius: '20px'
                }}>
                    <Building2 size={64} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>
                        Henüz hiç kulübe katılmadınız
                    </h2>
                    <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)' }}>
                        İlginizi çeken kulüplere katılarak topluluğa dahil olabilirsiniz.
                    </p>
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Building2 size={16} />
                        Kulüpleri Keşfet
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {userClubs.map((club) => (
                        <div
                            key={club.clubId}
                            onClick={() => navigate(`/club/${club.clubId}`)}
                            style={{
                                padding: '1.5rem',
                                borderRadius: '16px',
                                border: '1px solid var(--navbar-border)',
                                background: 'var(--bg-card)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.03)';
                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-card)';
                                e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {club.logoUrl ? (
                                <img 
                                    src={club.logoUrl} 
                                    alt={club.clubName}
                                    style={{
                                        width: '70px',
                                        height: '70px',
                                        borderRadius: '12px',
                                        objectFit: 'cover',
                                        flexShrink: 0,
                                        border: '2px solid var(--navbar-border)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.75rem',
                                    flexShrink: 0
                                }}>
                                    {club.clubName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    marginBottom: '0.5rem',
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {club.clubName}
                                </h3>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '1rem',
                                    flexWrap: 'wrap',
                                    marginBottom: '0.75rem'
                                }}>
                                    <span style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '8px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        color: '#3b82f6',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}>
                                        {getClubRoleText(club.myRole)}
                                    </span>
                                    <span style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '8px',
                                        background: club.status === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: club.status === 1 ? '#10b981' : '#f59e0b',
                                        fontWeight: 500,
                                        fontSize: '0.875rem'
                                    }}>
                                        {getMembershipStatusText(club.status)}
                                    </span>
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '1rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MessageSquare size={14} />
                                        Konular
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={14} />
                                        Gönderiler
                                    </span>
                                    <span>•</span>
                                    <span>Katılım: {new Date(club.joinedAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>
                            <ChevronRight size={24} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Create Club Request Modal */}
            <Modal
                isOpen={createClubModalOpen}
                onClose={() => {
                    setCreateClubModalOpen(false);
                    setClubRequestData({
                        name: '',
                        description: '',
                        purpose: ''
                    });
                }}
                title="Kulüp Açma Başvurusu"
            >
                <form onSubmit={handleCreateClubRequest} className="modal-form">
                    <div style={{ 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Building2 size={16} style={{ color: '#667eea' }} />
                            <strong style={{ fontSize: '0.875rem', color: '#667eea' }}>
                                Kulüp Açma Başvurusu
                            </strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Kulüp açma başvurunuz admin veya moderatör tarafından incelendikten sonra onaylanacaktır. 
                            Lütfen tüm bilgileri eksiksiz doldurun.
                        </p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="clubName">
                            Kulüp Adı *
                        </label>
                        <input
                            type="text"
                            id="clubName"
                            value={clubRequestData.name}
                            onChange={(e) => setClubRequestData({ ...clubRequestData, name: e.target.value })}
                            placeholder="Örn: Yazılım Geliştiricileri Kulübü"
                            maxLength={100}
                            disabled={clubRequestLoading}
                            required
                            style={{ fontSize: '1rem', padding: '0.75rem' }}
                        />
                        <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {clubRequestData.name.length}/100 karakter
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="clubDescription">
                            Kulüp Açıklaması *
                        </label>
                        <textarea
                            id="clubDescription"
                            value={clubRequestData.description}
                            onChange={(e) => setClubRequestData({ ...clubRequestData, description: e.target.value })}
                            placeholder="Kulübünüzün kısa açıklamasını yazın..."
                            rows={4}
                            maxLength={500}
                            disabled={clubRequestLoading}
                            required
                            style={{ fontSize: '1rem', padding: '0.75rem', resize: 'vertical' }}
                        />
                        <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {clubRequestData.description.length}/500 karakter
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="clubPurpose">
                            Kulüp Amacı *
                        </label>
                        <textarea
                            id="clubPurpose"
                            value={clubRequestData.purpose}
                            onChange={(e) => setClubRequestData({ ...clubRequestData, purpose: e.target.value })}
                            placeholder="Kulübünüzün amacını, faaliyetlerini ve hedeflerini detaylı bir şekilde açıklayın..."
                            rows={6}
                            maxLength={1000}
                            disabled={clubRequestLoading}
                            required
                            style={{ fontSize: '1rem', padding: '0.75rem', resize: 'vertical' }}
                        />
                        <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {clubRequestData.purpose.length}/1000 karakter
                        </small>
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
                                setCreateClubModalOpen(false);
                                setClubRequestData({
                                    name: '',
                                    description: '',
                                    purpose: ''
                                });
                            }}
                            className="btn-secondary"
                            disabled={clubRequestLoading}
                            style={{
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!clubRequestLoading) {
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
                            type="submit"
                            className="btn-primary"
                            disabled={clubRequestLoading}
                            style={{
                                background: clubRequestLoading 
                                    ? 'var(--text-secondary)' 
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!clubRequestLoading) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {clubRequestLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                    Gönderiliyor...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={16} />
                                    Başvuru Gönder
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MyClubs;
