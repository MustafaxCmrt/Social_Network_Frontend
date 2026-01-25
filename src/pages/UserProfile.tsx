import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService, type UserProfile as UserProfileType } from '../services/userService';
import { Calendar, MessageSquare, FileText, ArrowLeft, UserX } from 'lucide-react';
import '../styles/Home.css'; // Reusing general styles

const UserProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            console.log('Fetching profile for userId:', userId);
            if (!userId) return;
            setLoading(true);
            try {
                const data = await userService.getUserProfile(Number(userId));
                console.log('Profile data received:', data);
                setProfile(data);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setError('Kullanıcı bulunamadı.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    const handleBack = () => {
        navigate(-1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="home-container flex-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="home-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '3rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <UserX size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Kullanıcı Bulunamadı</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Aradığınız kullanıcı mevcut değil veya silinmiş.</p>
                    <button onClick={handleBack} className="back-btn" style={{ margin: '0 auto' }}>
                        <ArrowLeft size={18} />
                        <span>Geri Dön</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="page-header">
                <button onClick={handleBack} className="back-btn">
                    <ArrowLeft size={18} />
                    <span>Geri Dön</span>
                </button>
            </div>

            <div className="profile-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="profile-header-card" style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    {/* Banner area (optional, using gradient for now) */}
                    <div style={{
                        height: '120px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        position: 'relative'
                    }}></div>

                    <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '4px solid var(--bg-card)',
                            marginTop: '-60px',
                            background: 'var(--bg-secondary)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: 'var(--text-secondary)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            {profile.profileImg ? (
                                <img src={profile.profileImg} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                ((profile.firstName || '').charAt(0) || (profile.username || '').charAt(0) || '?').toUpperCase()
                            )}
                        </div>

                        {/* User Info */}
                        <div style={{ marginTop: '1rem' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                                {profile.firstName} {profile.lastName}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                                @{profile.username}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <Calendar size={16} />
                                <span>Katılma: {formatDate(profile.createdAt)}</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1rem',
                            marginTop: '2rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                padding: '1rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <FileText size={24} style={{ color: '#3b82f6' }} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {profile.totalThreads}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Konu</span>
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <MessageSquare size={24} style={{ color: '#10b981' }} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {profile.totalPosts}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Yorum</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
