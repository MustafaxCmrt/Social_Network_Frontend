import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, MessageSquare, FileText, ArrowLeft, Plus, LogOut, CheckCircle, AlertCircle, Camera, Upload, X, Settings, Clock, XCircle, FolderOpen } from 'lucide-react';
import { clubService } from '../services/clubService';
import { threadService } from '../services/threadService';
import { categoryService } from '../services/categoryService';
import type { Club, ClubRequest } from '../types/club';
import type { Thread, CreateThreadDto } from '../types/thread';
import type { Category, CreateCategoryDto } from '../types/category';
import { ClubRole, ClubRequestStatus, getClubRequestStatusText } from '../types/club';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/UI/Modal';
import { ThreadModal } from '../components/Forum/ThreadModal';
import { CategoryModal } from '../components/Forum/CategoryModal';
import { isAdminOrModerator as checkIsAdminOrModerator } from '../types/roles';
import '../styles/Home.css';

const ClubDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const toast = useToast();

    const [club, setClub] = useState<Club | null>(null);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [threadsLoading, setThreadsLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [myClubRequests, setMyClubRequests] = useState<ClubRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    // Check if user is admin/moderator or club president
    const isAdminOrPresident = user && club && (
        checkIsAdminOrModerator(user) || 
        (club.currentUserRole === ClubRole.President)
    );

    // Join/Leave modal states
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [joinNote, setJoinNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Image upload states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadType, setUploadType] = useState<'logo' | 'banner'>('logo');
    const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
    const [selectedBanner, setSelectedBanner] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Thread modal states
    const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
    
    // Category modal states
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    useEffect(() => {
        if (id) {
            loadClub();
            loadThreads();
            loadMyClubRequests();
            loadClubCategories();
        }
    }, [id]);

    // Debug: Modal state değişikliklerini izle
    useEffect(() => {
        if (uploadModalOpen) {
            console.log('Modal açıldı!', { uploadType, uploadModalOpen });
        }
    }, [uploadModalOpen, uploadType]);

    const loadClub = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const clubData = await clubService.getById(id);
            setClub(clubData);
        } catch (error: any) {
            setError(error.message || 'Kulüp yüklenemedi.');
            toast.error('Hata', error.message || 'Kulüp yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const loadThreads = async () => {
        if (!id) return;
        setThreadsLoading(true);
        try {
            // Kulüp thread'lerini getirmek için özel endpoint kullan
            const clubIdNum = parseInt(id);
            const response = await threadService.getClubThreads(clubIdNum, { 
                page: 1, 
                pageSize: 20
            });
            setThreads(response.items);
        } catch (error: any) {
            console.error('Failed to load threads:', error);
            toast.error('Hata', 'Konular yüklenirken bir hata oluştu.');
        } finally {
            setThreadsLoading(false);
        }
    };

    const loadMyClubRequests = async () => {
        if (!user) return;
        setRequestsLoading(true);
        try {
            const requests = await clubService.getMyRequests();
            setMyClubRequests(requests);
        } catch (error: any) {
            // Silently fail if endpoint doesn't exist yet
            console.error('Failed to load club requests:', error);
            setMyClubRequests([]);
        } finally {
            setRequestsLoading(false);
        }
    };

    const loadClubCategories = async () => {
        if (!id) return;
        setCategoriesLoading(true);
        try {
            const clubCategories = await categoryService.getClubCategories(parseInt(id));
            setCategories(clubCategories);
        } catch (error: any) {
            console.error('Failed to load club categories:', error);
            // Silently fail - categories might not exist yet
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleCreateCategory = () => {
        setSelectedCategory(null);
        setIsCategoryModalOpen(true);
    };

    const handleCategoryModalSubmit = async (data: CreateCategoryDto) => {
        if (!id) return;
        try {
            await categoryService.createClubCategory(parseInt(id), data);
            toast.success('Başarılı', 'Kategori başarıyla oluşturuldu!');
            setIsCategoryModalOpen(false);
            await loadClubCategories();
        } catch (error: any) {
            throw error; // CategoryModal zaten hata gösteriyor
        }
    };

    const handleJoinClub = async () => {
        if (!club || !id) return;
        
        setActionLoading(true);
        try {
            await clubService.join(parseInt(id), joinNote.trim() || undefined);
            toast.success('Başarılı', club.requiresApproval 
                ? 'Başvurunuz gönderildi! Onay bekleniyor.' 
                : 'Kulübe başarıyla katıldınız!');
            setJoinModalOpen(false);
            setJoinNote('');
            // Kulüp bilgilerini yenile
            loadClub();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulübe katılamadınız.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveClub = async () => {
        if (!club || !id) return;
        
        setActionLoading(true);
        try {
            await clubService.leave(parseInt(id));
            toast.success('Başarılı', 'Kulüpten ayrıldınız.');
            setLeaveModalOpen(false);
            // Kulüp bilgilerini yenile
            loadClub();
        } catch (error: any) {
            toast.error('Hata', error.message || 'Kulüpten ayrılamadınız.');
        } finally {
            setActionLoading(false);
        }
    };

    // Image upload handlers
    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Hata', 'Logo dosyası 5MB\'dan büyük olamaz.');
                return;
            }
            setSelectedLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Hata', 'Banner dosyası 10MB\'dan büyük olamaz.');
                return;
            }
            setSelectedBanner(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async (type: 'logo' | 'banner') => {
        if (!club || !id) return;
        
        const file = type === 'logo' ? selectedLogo : selectedBanner;
        if (!file) {
            toast.error('Hata', 'Lütfen bir dosya seçin.');
            return;
        }

        setUploadLoading(true);
        try {
            await clubService.uploadImage(parseInt(id), file, type);
            toast.success('Başarılı', `${type === 'logo' ? 'Logo' : 'Banner'} başarıyla yüklendi!`);
            
            // Kulüp bilgilerini yenile
            await loadClub();
            
            // Reset states
            if (type === 'logo') {
                setSelectedLogo(null);
                setLogoPreview(null);
                if (logoInputRef.current) logoInputRef.current.value = '';
            } else {
                setSelectedBanner(null);
                setBannerPreview(null);
                if (bannerInputRef.current) bannerInputRef.current.value = '';
            }
            
            setUploadModalOpen(false);
        } catch (error: any) {
            toast.error('Hata', error.message || 'Resim yüklenemedi.');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleThreadModalSubmit = async (data: CreateThreadDto) => {
        if (!id) return;
        try {
            // Kulüp ID'sini ekle - kulüp sayfasından oluşturulduğu için clubId dolu olmalı
            const threadData: CreateThreadDto = {
                ...data,
                clubId: parseInt(id) // Kulüp sayfasından oluşturulduğu için clubId dolu
            };
            await threadService.create(threadData);
            toast.success('Başarılı', 'Konu başarıyla oluşturuldu!');
            setIsThreadModalOpen(false);
            // Thread'leri yenile
            await loadThreads();
        } catch (error: any) {
            throw error; // ThreadModal zaten hata gösteriyor
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
                    <h2>Kulüp Bulunamadı</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        {error || 'Aradığınız kulüp bulunamadı.'}
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/')}>
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    // Check if user has a pending/rejected request for this club
    const pendingRequest = myClubRequests.find(req => 
        req.name.toLowerCase() === club.name.toLowerCase() && 
        req.status !== ClubRequestStatus.Approved
    );

    // If user has a pending/rejected request, show status only
    if (pendingRequest && !checkIsAdminOrModerator(user)) {
        const statusColor = pendingRequest.status === ClubRequestStatus.Rejected 
            ? '#ef4444' 
            : '#f59e0b';
        const statusBg = pendingRequest.status === ClubRequestStatus.Rejected 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(245, 158, 11, 0.1)';
        const StatusIcon = pendingRequest.status === ClubRequestStatus.Rejected 
            ? XCircle 
            : Clock;

        return (
            <div className="home-container">
                <div style={{ 
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--navbar-border)',
                    borderRadius: '20px',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <Building2 size={64} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.75rem', fontWeight: 600 }}>
                        {club.name}
                    </h2>
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        background: statusBg,
                        border: `1px solid ${statusColor}40`
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.5rem'
                        }}>
                            <StatusIcon size={24} style={{ color: statusColor }} />
                            <span style={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                color: statusColor
                            }}>
                                {getClubRequestStatusText(pendingRequest.status)}
                            </span>
                        </div>
                        <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)'
                        }}>
                            {pendingRequest.status === ClubRequestStatus.Pending
                                ? 'Kulüp açma başvurunuz inceleniyor. Onaylandıktan sonra kulüp detaylarına erişebilirsiniz.'
                                : 'Kulüp açma başvurunuz reddedildi. Detaylar için aşağıdaki bilgilere bakabilirsiniz.'}
                        </p>
                    </div>
                    {pendingRequest.rejectionReason && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            textAlign: 'left'
                        }}>
                            <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#ef4444',
                                fontWeight: 500
                            }}>
                                <strong>Red Nedeni:</strong> {pendingRequest.rejectionReason}
                            </p>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1.5rem'
                    }}>
                        <span>Başvuru Tarihi: {new Date(pendingRequest.createdAt).toLocaleDateString('tr-TR')}</span>
                        {pendingRequest.reviewedAt && (
                            <span>İnceleme Tarihi: {new Date(pendingRequest.reviewedAt).toLocaleDateString('tr-TR')}</span>
                        )}
                    </div>
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/my-clubs')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Building2 size={16} />
                        Kulüplerime Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="forum-layout">
                {/* Club Header - Facebook Style Cover Photo */}
                <div style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--navbar-border)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* Banner/Cover Photo */}
                        <div style={{
                            width: '100%',
                            height: '350px',
                            background: club.bannerUrl 
                                ? `url(${club.bannerUrl}) center/cover no-repeat`
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {/* Back Button - Inside Banner */}
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    left: '1rem',
                                    padding: '0.5rem',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid var(--navbar-border)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    zIndex: 10,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>

                            {/* Upload Cover Photo Button */}
                            {isAdminOrPresident && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '1rem',
                                        right: '1rem',
                                        zIndex: 1000,
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUploadType('banner');
                                            setUploadModalOpen(true);
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid var(--navbar-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            transition: 'all 0.2s',
                                            userSelect: 'none',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'white';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title="Kapak Fotoğrafı Yükle"
                                    >
                                        <Camera size={16} />
                                        Kapak Fotoğrafı Yükle
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Club Info Section */}
                        <div style={{
                            padding: '0 2rem 2rem 2rem',
                            position: 'relative',
                            background: 'var(--bg-card)'
                        }}>
                            {/* Logo - Overlapping Banner */}
                            <div style={{ 
                                position: 'relative',
                                marginTop: '-50px',
                                marginBottom: '1.5rem',
                                zIndex: 2
                            }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    {club.logoUrl ? (
                                        <img 
                                            src={club.logoUrl} 
                                            alt={club.name}
                                            style={{
                                                width: '140px',
                                                height: '140px',
                                                borderRadius: '12px',
                                                objectFit: 'cover',
                                                border: '4px solid var(--bg-card)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                background: 'var(--bg-card)'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '140px',
                                            height: '140px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '3.5rem',
                                            fontWeight: 'bold',
                                            border: '4px solid var(--bg-card)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }}>
                                            {club.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {isAdminOrPresident && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadType('logo');
                                                setUploadModalOpen(true);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                bottom: '0',
                                                right: '0',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: 'var(--accent-color)',
                                                border: '3px solid var(--bg-card)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s',
                                                zIndex: 10
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                            title="Logo Yükle"
                                        >
                                            <Camera size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Club Name and Description */}
                            <div style={{ marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
                                <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {club.name}
                                </h1>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
                                    {club.description || 'Açıklama yok'}
                                </p>
                            </div>

                            {/* Stats and Actions */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                flexWrap: 'wrap', 
                                gap: '1rem',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid var(--navbar-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                        <Users size={18} style={{ color: 'var(--accent-color)' }} />
                                        <span><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{club.memberCount}</strong> üye</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                        <MessageSquare size={18} style={{ color: 'var(--accent-color)' }} />
                                        <span><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{threads.length}</strong> konu</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {isAdminOrPresident && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/club/${id}/manage`)}
                                            className="btn-primary"
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.5rem',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            }}
                                        >
                                            <Settings size={16} />
                                            Yönet
                                        </button>
                                    )}
                                    {isAuthenticated && (
                                        <>
                                            {club.isMember ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setLeaveModalOpen(true)}
                                                    className="btn-secondary"
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.5rem',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                                    }}
                                                >
                                                    <LogOut size={16} />
                                                    Ayrıl
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setJoinModalOpen(true)}
                                                    className="btn-primary"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    <Plus size={16} />
                                                    {club.requiresApproval ? 'Başvuru Yap' : 'Katıl'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main style={{ gridColumn: '1 / -2' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--navbar-border)',
                        borderRadius: '16px',
                        padding: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                                <MessageSquare size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                Konular
                            </h2>
                            {isAuthenticated && club.isMember && (
                                <button 
                                    onClick={() => setIsThreadModalOpen(true)}
                                    className="btn-primary" 
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={16} />
                                    Yeni Konu
                                </button>
                            )}
                        </div>

                        {threadsLoading ? (
                            <div className="loading-state">Konular yükleniyor...</div>
                        ) : threads.length === 0 ? (
                            <div className="empty-state">
                                <MessageSquare size={48} />
                                <p>Henüz hiç konu açılmamış.</p>
                            </div>
                        ) : (
                            <div className="thread-list">
                                {threads.map(thread => (
                                    <div
                                        key={thread.id}
                                        onClick={() => navigate(`/thread/${thread.id}`)}
                                        style={{
                                            padding: '1rem',
                                            border: '1px solid var(--navbar-border)',
                                            borderRadius: '12px',
                                            marginBottom: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-secondary)';
                                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-card)';
                                            e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                        }}
                                    >
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                                            {thread.title}
                                        </h3>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {thread.user?.username && `@${thread.user.username}`} • {new Date(thread.createdAt).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="forum-right-panel">
                    {/* Categories Widget */}
                    <div className="widget-card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FolderOpen size={18} style={{ color: 'var(--accent-color)' }} />
                                Kategoriler
                            </h3>
                            {isAdminOrPresident && (
                                <button
                                    onClick={handleCreateCategory}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '6px',
                                        background: 'var(--accent-color)',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.opacity = '0.9';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.opacity = '1';
                                    }}
                                >
                                    <Plus size={14} />
                                    Yeni
                                </button>
                            )}
                        </div>
                        
                        {categoriesLoading ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Yükleniyor...
                            </div>
                        ) : categories.length === 0 ? (
                            <div style={{ 
                                padding: '1.5rem', 
                                textAlign: 'center', 
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem'
                            }}>
                                <FolderOpen size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p style={{ margin: 0 }}>Henüz kategori oluşturulmamış</p>
                            </div>
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.5rem',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                paddingRight: '0.5rem'
                            }}>
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => navigate(`/category/${category.slug}`)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--navbar-border)',
                                            background: 'var(--bg-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-secondary)';
                                            e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <FolderOpen size={16} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ 
                                                fontWeight: 600, 
                                                fontSize: '0.875rem',
                                                color: 'var(--text-primary)',
                                                marginBottom: '0.25rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {category.title}
                                            </div>
                                            {category.description && (
                                                <div style={{ 
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {category.description}
                                                </div>
                                            )}
                                            <div style={{ 
                                                fontSize: '0.7rem',
                                                color: 'var(--text-tertiary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                {category.threadCount} konu
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Club Info Widget */}
                    <div className="widget-card">
                        <h3>Kulüp Bilgileri</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Kurucu</strong>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>@{club.founderUsername}</p>
                            </div>
                            <div>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Oluşturulma</strong>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                                    {new Date(club.createdAt).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            <div>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Durum</strong>
                                <div style={{ marginTop: '0.25rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        background: club.isPublic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: club.isPublic ? '#10b981' : '#f59e0b'
                                    }}>
                                        {club.isPublic ? 'Herkese Açık' : 'Özel'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Join Club Modal */}
            <Modal
                isOpen={joinModalOpen}
                onClose={() => {
                    setJoinModalOpen(false);
                    setJoinNote('');
                }}
                title={club?.requiresApproval ? 'Kulübe Başvuru Yap' : 'Kulübe Katıl'}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleJoinClub(); }} className="modal-form">
                    {club && (
                        <>
                            <div style={{ 
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                border: '1px solid rgba(102, 126, 234, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <Building2 size={20} style={{ color: '#667eea' }} />
                                    <strong style={{ fontSize: '0.95rem', color: '#667eea' }}>{club.name}</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {club.requiresApproval 
                                        ? 'Bu kulübe katılmak için yönetici onayı gereklidir. Başvurunuz incelendikten sonra bilgilendirileceksiniz.'
                                        : 'Bu kulübe katılmak için onay gerekmez. Hemen üye olabilirsiniz.'}
                                </p>
                            </div>

                            {club.requiresApproval && (
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <FileText size={16} style={{ color: 'var(--primary)' }} />
                                        Başvuru Notu (Opsiyonel)
                                    </label>
                                    <textarea
                                        value={joinNote}
                                        onChange={(e) => setJoinNote(e.target.value)}
                                        placeholder="Kulübe katılmak istediğiniz nedenleri belirtin..."
                                        rows={4}
                                        maxLength={500}
                                        style={{ fontSize: '1rem', padding: '0.75rem', resize: 'vertical', width: '100%' }}
                                    />
                                    <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {joinNote.length}/500 karakter
                                    </small>
                                </div>
                            )}

                            {!club.requiresApproval && (
                                <div style={{ 
                                    background: 'rgba(16, 185, 129, 0.05)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                                        <strong style={{ fontSize: '0.875rem', color: '#10b981' }}>Hemen Katılabilirsiniz</strong>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Bu kulüp herkese açık ve onay gerektirmiyor. Katıldığınızda hemen üye olacaksınız.
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
                            onClick={() => {
                                setJoinModalOpen(false);
                                setJoinNote('');
                            }}
                            className="btn-secondary"
                            disabled={actionLoading}
                            style={{ minWidth: '100px' }}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={actionLoading}
                            style={{ 
                                minWidth: '140px',
                                background: actionLoading ? 'var(--text-secondary)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none'
                            }}
                        >
                            {actionLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                    {club?.requiresApproval ? 'Gönderiliyor...' : 'Katılıyor...'}
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <CheckCircle size={16} />
                                    {club?.requiresApproval ? 'Başvuru Yap' : 'Katıl'}
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Leave Club Modal */}
            <Modal
                isOpen={leaveModalOpen}
                onClose={() => setLeaveModalOpen(false)}
                title="Kulüpten Ayrıl"
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
                        <LogOut size={40} style={{ color: '#ef4444' }} />
                    </div>
                    
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ 
                            margin: 0, 
                            marginBottom: '0.75rem', 
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                        }}>
                            <strong style={{ color: '#ef4444' }}>{club?.name}</strong> kulübünden ayrılmak istediğinize emin misiniz?
                        </h3>
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.05)',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            textAlign: 'left',
                            marginTop: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <AlertCircle size={18} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Bu işlem şunları içerir:</strong>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                        <li>Kulüp üyeliğiniz sonlandırılacak</li>
                                        <li>Kulüp içeriğine erişiminiz kısıtlanacak</li>
                                        <li>Tekrar katılmak için başvuru yapmanız gerekebilir</li>
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
                            onClick={() => setLeaveModalOpen(false)}
                            className="btn-secondary"
                            disabled={actionLoading}
                            style={{ minWidth: '100px' }}
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleLeaveClub}
                            className="btn-danger"
                            disabled={actionLoading}
                            style={{ 
                                minWidth: '140px',
                                background: actionLoading ? 'var(--text-secondary)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                border: 'none'
                            }}
                        >
                            {actionLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                    Ayrılıyor...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <LogOut size={16} />
                                    Evet, Ayrıl
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Upload Image Modal */}
            <Modal
                isOpen={uploadModalOpen}
                onClose={() => {
                    console.log('Modal onClose çağrıldı');
                    setUploadModalOpen(false);
                    setSelectedLogo(null);
                    setSelectedBanner(null);
                    setLogoPreview(null);
                    setBannerPreview(null);
                    if (logoInputRef.current) logoInputRef.current.value = '';
                    if (bannerInputRef.current) bannerInputRef.current.value = '';
                }}
                title={uploadType === 'logo' ? 'Logo Yükle' : 'Kapak Fotoğrafı Yükle'}
            >
                <div className="modal-form">
                    <div style={{ 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Upload size={16} style={{ color: '#667eea' }} />
                            <strong style={{ fontSize: '0.875rem', color: '#667eea' }}>
                                {uploadType === 'logo' ? 'Logo' : 'Banner'} Yükleme
                            </strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {uploadType === 'logo' 
                                ? 'Logo görseli kulüp kartlarında ve detay sayfasında görüntülenecektir. (Önerilen: 200x200px, maksimum 5MB)'
                                : 'Banner görseli kulüp detay sayfasının üst kısmında görüntülenecektir. (Önerilen: 1200x300px, maksimum 10MB)'}
                        </p>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Camera size={16} style={{ color: 'var(--primary)' }} />
                            {uploadType === 'logo' ? 'Logo' : 'Banner'} Seç
                        </label>
                        <input
                            ref={uploadType === 'logo' ? logoInputRef : bannerInputRef}
                            type="file"
                            accept="image/*"
                            onChange={uploadType === 'logo' ? handleLogoSelect : handleBannerSelect}
                            style={{ fontSize: '1rem', padding: '0.75rem' }}
                        />
                        <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {uploadType === 'logo' 
                                ? 'PNG, JPG veya GIF formatında, maksimum 5MB'
                                : 'PNG, JPG veya GIF formatında, maksimum 10MB'}
                        </small>
                    </div>

                    {(logoPreview || bannerPreview) && (
                        <div style={{ 
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <strong style={{ fontSize: '0.875rem' }}>Önizleme</strong>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (uploadType === 'logo') {
                                            setSelectedLogo(null);
                                            setLogoPreview(null);
                                            if (logoInputRef.current) logoInputRef.current.value = '';
                                        } else {
                                            setSelectedBanner(null);
                                            setBannerPreview(null);
                                            if (bannerInputRef.current) bannerInputRef.current.value = '';
                                        }
                                    }}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '4px',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    <X size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                    Kaldır
                                </button>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <img 
                                    src={uploadType === 'logo' ? logoPreview! : bannerPreview!}
                                    alt="Preview"
                                    style={{
                                        maxWidth: uploadType === 'logo' ? '200px' : '100%',
                                        maxHeight: uploadType === 'logo' ? '200px' : '200px',
                                        borderRadius: '8px',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                        </div>
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
                            onClick={() => {
                                setUploadModalOpen(false);
                                setSelectedLogo(null);
                                setSelectedBanner(null);
                                setLogoPreview(null);
                                setBannerPreview(null);
                                if (logoInputRef.current) logoInputRef.current.value = '';
                                if (bannerInputRef.current) bannerInputRef.current.value = '';
                            }}
                            className="btn-secondary"
                            disabled={uploadLoading}
                            style={{ minWidth: '100px' }}
                        >
                            İptal
                        </button>
                        <button
                            type="button"
                            onClick={() => handleUploadImage(uploadType)}
                            className="btn-primary"
                            disabled={uploadLoading || !(uploadType === 'logo' ? selectedLogo : selectedBanner)}
                            style={{ 
                                minWidth: '140px',
                                background: uploadLoading || !(uploadType === 'logo' ? selectedLogo : selectedBanner)
                                    ? 'var(--text-secondary)' 
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none'
                            }}
                        >
                            {uploadLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                    Yükleniyor...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <Upload size={16} />
                                    Yükle
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Thread Modal */}
            <ThreadModal
                isOpen={isThreadModalOpen}
                onClose={() => setIsThreadModalOpen(false)}
                onSubmit={handleThreadModalSubmit}
                clubId={id ? parseInt(id) : null}
            />

            {/* Category Modal */}
            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setSelectedCategory(null);
                }}
                onSubmit={handleCategoryModalSubmit}
                editCategory={selectedCategory}
                categories={categories}
            />
        </div>
    );
};

export default ClubDetail;
