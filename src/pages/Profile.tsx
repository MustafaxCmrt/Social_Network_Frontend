import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import type { UpdateProfileRequest } from '../services/userService';
import { Eye, EyeOff, Camera, AlertTriangle, Mail, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clubService } from '../services/clubService';
import type { UserClubMembership } from '../types/club';
import { getClubRoleText } from '../types/club';
import '../styles/Auth.css';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'clubs'>('general');
    const [loading, setLoading] = useState(false);
    
    // Clubs state
    const [userClubs, setUserClubs] = useState<UserClubMembership[]>([]);
    const [clubsLoading, setClubsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState<{ current: boolean, new: boolean, confirm: boolean }>({
        current: false,
        new: false,
        confirm: false
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Email change modals
    const [emailConfirmModal, setEmailConfirmModal] = useState(false);
    const [emailSuccessModal, setEmailSuccessModal] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');

    // Form States
    const [formData, setFormData] = useState<UpdateProfileRequest>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: ''
    });

    const [originalEmail, setOriginalEmail] = useState('');

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email
            }));
            setOriginalEmail(user.email);
            // Load clubs on mount to show tab if user has clubs
            loadUserClubs();
        }
    }, [user]);

    // Load user clubs when clubs tab is active
    useEffect(() => {
        if (activeTab === 'clubs' && user) {
            loadUserClubs();
        }
    }, [activeTab]);

    const loadUserClubs = async () => {
        setClubsLoading(true);
        try {
            const clubs = await clubService.getMine();
            setUserClubs(clubs);
        } catch (error) {
            console.error('Failed to load clubs:', error);
        } finally {
            setClubsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLoading(true);
            try {
                await userService.uploadProfileImage(e.target.files[0]);
                window.location.reload();
            } catch (error: any) {
                setMessage({ type: 'error', text: error.message || 'Resim yuklenirken hata olustu.' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Check if email is being changed
        if (activeTab === 'general' && formData.email !== originalEmail) {
            setPendingEmail(formData.email || '');
            setEmailConfirmModal(true);
            return;
        }

        await performUpdate();
    };

    const performUpdate = async (isEmailChange: boolean = false) => {
        setLoading(true);

        try {
            const dataToSend: UpdateProfileRequest = {};
            if (activeTab === 'general') {
                dataToSend.firstName = formData.firstName;
                dataToSend.lastName = formData.lastName;
                dataToSend.username = formData.username;
                if (isEmailChange) {
                    dataToSend.email = formData.email;
                }
            } else {
                if (formData.newPassword !== formData.newPasswordConfirm) {
                    throw new Error('Yeni sifreler eslesmiyor.');
                }
                dataToSend.currentPassword = formData.currentPassword;
                dataToSend.newPassword = formData.newPassword;
                dataToSend.newPasswordConfirm = formData.newPasswordConfirm;
            }

            await userService.updateProfile(dataToSend);

            // Email degisikligi basarili olduysa
            if (isEmailChange) {
                setEmailConfirmModal(false);
                setEmailSuccessModal(true);
                setLoading(false);

                // 5 saniye sonra otomatik logout
                setTimeout(() => {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }, 5000);
                return;
            }

            setMessage({ type: 'success', text: 'Profil basariyla guncellendi.' });

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                newPasswordConfirm: ''
            }));

        } catch (error: any) {
            setEmailConfirmModal(false);
            setMessage({ type: 'error', text: error.message || 'Guncelleme sirasinda hata olustu.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChangeConfirm = async () => {
        await performUpdate(true);
    };

    const handleEmailChangeCancel = () => {
        setEmailConfirmModal(false);
        setFormData(prev => ({ ...prev, email: originalEmail }));
    };

    const handleEmailSuccessClose = async () => {
        setEmailSuccessModal(false);
        // Logout and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Hesabinizi kalici olarak silmek istediginize emin misiniz? Bu islem geri alinamaz!')) {
            try {
                await userService.deleteAccount();
                window.location.href = '/login';
            } catch (error: any) {
                setMessage({ type: 'error', text: error.message || 'Hesap silinirken hata olustu.' });
            }
        }
    };

    if (!user) return <div className="text-center p-10 text-white">Yukleniyor...</div>;

    return (
        <div className="auth-container" style={{ padding: '2rem' }}>
            <div className="auth-card" style={{ maxWidth: '800px', width: '100%' }}>
                <h2 className="auth-title">Profil Ayarlari</h2>

                {/* Header / Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--navbar-border)' }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('file-upload')?.click()}>
                        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '50%', width: 100, height: 100, border: '4px solid var(--navbar-border)' }}>
                            {user.profileImg ? (
                                <img src={user.profileImg} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'white', fontWeight: 'bold' }}>
                                    {user.firstName?.charAt(0)}
                                </div>
                            )}
                            <div className="avatar-overlay" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                                <Camera color="white" size={24} />
                            </div>
                        </div>
                        <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</h3>
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>@{user.username}</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: user.isActive ? '#10b981' : '#ef4444' }}>
                            {user.isActive ? '* Aktif Hesap' : '* Pasif Hesap'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('general')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            background: activeTab === 'general' ? '#3b82f6' : 'var(--bg-secondary)',
                            color: activeTab === 'general' ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--navbar-border)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                    >
                        Genel Bilgiler
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            background: activeTab === 'security' ? '#3b82f6' : 'var(--bg-secondary)',
                            color: activeTab === 'security' ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--navbar-border)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                    >
                        Guvenlik & Sifre
                    </button>
                    {userClubs.length > 0 && (
                        <button
                            onClick={() => setActiveTab('clubs')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                background: activeTab === 'clubs' ? '#3b82f6' : 'var(--bg-secondary)',
                                color: activeTab === 'clubs' ? 'white' : 'var(--text-secondary)',
                                border: '1px solid var(--navbar-border)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Building2 size={16} />
                            Kulüplerim ({userClubs.length})
                        </button>
                    )}
                </div>

                {message && (
                    <div className="auth-error" style={{
                        color: message.type === 'error' ? '#ef4444' : '#10b981',
                        marginBottom: '1rem',
                        backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        padding: '10px',
                        borderRadius: '4px'
                    }}>
                        {message.text}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {activeTab === 'general' ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Ad</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={loading} />
                                </div>
                                <div className="form-group">
                                    <label>Soyad</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={loading} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Kullanici Adi</label>
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={loading} />
                                {formData.email !== originalEmail && (
                                    <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertTriangle size={14} />
                                        Email degistirdiginizde dogrulama gerekecektir
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Mevcut Sifre</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleInputChange}
                                        placeholder="Degisiklik icin gerekli"
                                        style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                    >
                                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Yeni Sifre</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                    >
                                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Yeni Sifre (Tekrar)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        name="newPasswordConfirm"
                                        value={formData.newPasswordConfirm}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                    >
                                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                        {loading ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
                    </button>
                </form>

                {/* Danger Zone */}
                {activeTab === 'clubs' && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
                            <Building2 size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Katıldığım Kulüpler
                        </h3>
                        
                        {clubsLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Yükleniyor...
                            </div>
                        ) : userClubs.length === 0 ? (
                            <div style={{ 
                                padding: '3rem', 
                                textAlign: 'center', 
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '1px solid var(--navbar-border)'
                            }}>
                                <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ margin: 0, fontSize: '1rem' }}>Henüz hiç kulübe katılmadınız</p>
                            </div>
                        ) : (
                            <div style={{ 
                                display: 'grid', 
                                gap: '1rem',
                                maxHeight: '600px',
                                overflowY: 'auto',
                                paddingRight: '0.5rem'
                            }}>
                                {userClubs.map((club) => (
                                    <div
                                        key={club.clubId}
                                        onClick={() => navigate(`/club/${club.clubId}`)}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--navbar-border)',
                                            background: 'var(--bg-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-secondary)';
                                            e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        {club.logoUrl ? (
                                            <img 
                                                src={club.logoUrl} 
                                                alt={club.clubName}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '10px',
                                                    objectFit: 'cover',
                                                    flexShrink: 0
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '10px',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.25rem',
                                                flexShrink: 0
                                            }}>
                                                {club.clubName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ 
                                                margin: 0, 
                                                marginBottom: '0.25rem',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {club.clubName}
                                            </h4>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.75rem',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '6px',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: '#3b82f6',
                                                    fontWeight: 500
                                                }}>
                                                    {getClubRoleText(club.myRole)}
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(club.joinedAt).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'security' && (
                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                        <h3 style={{ color: '#ef4444', marginTop: 0 }}>Hesap Sil</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Hesabinizi sildiginizde tum verileriniz kalici olarak silinecektir.</p>
                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.3)',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                marginTop: '1rem'
                            }}
                        >
                            Hesabimi Sil
                        </button>
                    </div>
                )}
            </div>

            {/* Email Change Confirmation Modal */}
            {emailConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '450px',
                        width: '90%',
                        border: '1px solid var(--navbar-border)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <AlertTriangle size={32} color="#f59e0b" />
                            </div>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Email Degisikligi Onayi</h3>
                        </div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '1rem' }}>
                                Email adresinizi <strong style={{ color: 'var(--text-primary)' }}>{pendingEmail}</strong> olarak degistirmek uzeresiniz.
                            </p>
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#f59e0b' }}>
                                    <strong>Onemli:</strong> Email degistirdiginizde:
                                </p>
                                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                                    <li>Oturumunuz kapatilacak</li>
                                    <li>Yeni email adresinize dogrulama linki gonderilecek</li>
                                    <li>Dogrulayana kadar giris yapamazsaniz</li>
                                </ul>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleEmailChangeCancel}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--navbar-border)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Iptal
                            </button>
                            <button
                                onClick={handleEmailChangeConfirm}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#f59e0b',
                                    color: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: 500,
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Kaydediliyor...' : 'Onayla ve Degistir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Change Success Modal */}
            {emailSuccessModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '450px',
                        width: '90%',
                        border: '1px solid var(--navbar-border)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <Mail size={32} color="#10b981" />
                            </div>
                            <h3 style={{ color: '#10b981', margin: 0 }}>Email Degistirildi!</h3>
                        </div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'center' }}>
                            <p style={{ marginBottom: '1rem' }}>
                                Email adresiniz basariyla degistirildi.
                            </p>
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                    <strong style={{ color: '#10b981' }}>{pendingEmail}</strong> adresine dogrulama linki gonderildi.
                                </p>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Lutfen email kutunuzu kontrol edin ve dogrulama linkine tiklayin.
                                </p>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#f59e0b', marginBottom: '1rem' }}>
                                Dogrulama yapana kadar giris yapamazsiniz.
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                5 saniye icinde otomatik cikis yapilacak...
                            </p>
                        </div>

                        <button
                            onClick={handleEmailSuccessClose}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#10b981',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 500,
                                marginTop: '1rem'
                            }}
                        >
                            Hemen Cikis Yap
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
