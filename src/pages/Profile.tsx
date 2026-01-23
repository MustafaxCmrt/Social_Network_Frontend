import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import type { UpdateProfileRequest } from '../services/userService';
import { Eye, EyeOff, Camera } from 'lucide-react';
import '../styles/Auth.css'; // Reusing Auth styles for form elements

const Profile: React.FC = () => {
    const { user } = useAuth(); // We use login to re-fetch user data after update
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState<{ current: boolean, new: boolean, confirm: boolean }>({
        current: false,
        new: false,
        confirm: false
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email
            }));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLoading(true);
            try {
                await userService.uploadProfileImage(e.target.files[0]);
                // Refresh user data to show new image
                // Hack: we call getCurrentUser via auth context update if possible, 
                // but simpler to reload or re-fetch. Since we don't have a direct "refreshUser" method exposed in context
                // we can trigger it or just reload window for now to be safe and simple.
                window.location.reload();
            } catch (error: any) {
                setMessage({ type: 'error', text: error.message || 'Resim yüklenirken hata oluştu.' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            // Filter empty fields to avoid sending unnecessary data
            const dataToSend: UpdateProfileRequest = {};
            if (activeTab === 'general') {
                dataToSend.firstName = formData.firstName;
                dataToSend.lastName = formData.lastName;
                dataToSend.username = formData.username;
                dataToSend.email = formData.email;
            } else {
                if (formData.newPassword !== formData.newPasswordConfirm) {
                    throw new Error('Yeni şifreler eşleşmiyor.');
                }
                dataToSend.currentPassword = formData.currentPassword;
                dataToSend.newPassword = formData.newPassword;
                dataToSend.newPasswordConfirm = formData.newPasswordConfirm;
            }

            await userService.updateProfile(dataToSend);
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi.' });

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                newPasswordConfirm: ''
            }));

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Güncelleme sırasında hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
            try {
                await userService.deleteAccount();
                // Logout will handle redirection, but let's force it
                window.location.href = '/login';
            } catch (error: any) {
                setMessage({ type: 'error', text: error.message || 'Hesap silinirken hata oluştu.' });
            }
        }
    };

    if (!user) return <div className="text-center p-10 text-white">Yükleniyor...</div>;

    return (
        <div className="auth-container" style={{ padding: '2rem' }}>
            <div className="auth-card" style={{ maxWidth: '800px', width: '100%' }}>
                <h2 className="auth-title">Profil Ayarları</h2>

                {/* Header / Avatar */}
                {/* Header / Avatar */}
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
                            {/* Hover Overlay */}
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
                            {user.isActive ? '• Aktif Hesap' : '• Pasif Hesap'}
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
                        Güvenlik & Şifre
                    </button>
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
                                <label>Kullanıcı Adı</label>
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={loading} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Mevcut Şifre</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleInputChange}
                                        placeholder="Değişiklik için gerekli"
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
                                <label>Yeni Şifre</label>
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
                                <label>Yeni Şifre (Tekrar)</label>
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
                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </form>

                {/* Danger Zone */}
                {activeTab === 'security' && (
                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                        <h3 style={{ color: '#ef4444', marginTop: 0 }}>Hesap Sil</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinecektir.</p>
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
                            Hesabımı Sil
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
