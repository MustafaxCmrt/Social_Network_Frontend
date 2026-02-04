import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, MessageSquare, FileText } from 'lucide-react';
import { clubService } from '../services/clubService';
import type { UserClubMembership } from '../types/club';
import { getClubRoleText, getMembershipStatusText } from '../types/club';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/Home.css';

const MyClubs: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    const [userClubs, setUserClubs] = useState<UserClubMembership[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadUserClubs();
    }, [isAuthenticated, navigate]);

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

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="home-container">
            <div style={{ marginBottom: '2rem' }}>
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
        </div>
    );
};

export default MyClubs;
