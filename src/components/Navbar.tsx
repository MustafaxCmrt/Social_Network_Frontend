import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, LogOut, Settings, ChevronDown, Search, Bell, CheckCheck, Trash2, Shield, Flag } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout, isAdminOrModerator } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Notification State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const notificationRef = React.useRef<HTMLDivElement>(null);

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            setNotifLoading(true);
            const res = await notificationService.getMyNotifications(1, 10);
            setNotifications(res.items);

            // Get unread count specifically
            const summary = await notificationService.getSummary();
            setUnreadCount(summary.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setNotifLoading(false);
        }
    };

    // Initial fetch
    React.useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            // Optional: Poll every 60s
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const handleNotificationClick = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            fetchNotifications();
        }
    };

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkRead = async (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            // Decrease unread count if it was unread
            const notif = notifications.find(n => n.id === id);
            if (notif && !notif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Search dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const [previewResults, setPreviewResults] = useState<any>(null); // Type: GlobalSearchResponse | null
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Debounce ref
    const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (query.trim().length >= 2) {
            setIsSearching(true);
            setShowDropdown(true);
            searchTimeout.current = setTimeout(async () => {
                try {
                    // Import inside function to avoid circular dependency if any, or just use the imported one
                    const { searchService } = await import('../services/searchService');
                    const results = await searchService.searchAll(query.trim(), 5); // Limit 5
                    setPreviewResults(results);
                } catch (error) {
                    console.error('Search preview error:', error);
                } finally {
                    setIsSearching(false);
                }
            }, 300); // 300ms debounce
        } else {
            setShowDropdown(false);
            setPreviewResults(null);
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
            setShowDropdown(false);
        }
    };

    const handleResultClick = (path: string) => {
        navigate(path);
        setShowDropdown(false);
        setSearchQuery('');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-content">
                    {/* Logo */}
                    <div className="navbar-logo">
                        <Link to="/" className="logo-text" style={{ textDecoration: 'none' }}>SocialNet</Link>
                        {isHomePage && (
                            <span className="forum-breadcrumb">
                                <span className="breadcrumb-separator">/</span>
                                <span className="breadcrumb-text">Topluluk Forumu</span>
                            </span>
                        )}
                    </div>

                    {/* Desktop Menu */}
                    <div className="navbar-search-container" ref={dropdownRef}>
                        <form onSubmit={handleSearch} className="navbar-search-form">
                            <button type="submit" className="search-icon-btn">
                                <Search size={20} />
                            </button>
                            <input
                                type="text"
                                placeholder="Toplulukta ara..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onClick={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
                                className="navbar-search-input"
                            />
                        </form>

                        {/* Search Dropdown */}
                        {showDropdown && (
                            <div className="search-preview-dropdown">
                                {isSearching ? (
                                    <div className="preview-loading">Aranıyor...</div>
                                ) : previewResults ? (
                                    <>
                                        {/* Users */}
                                        {previewResults.users && previewResults.users.length > 0 && (
                                            <div className="preview-section">
                                                <div className="preview-header">Kullanıcılar</div>
                                                {previewResults.users.map((u: any) => (
                                                    <div
                                                        key={u.userId || u.id}
                                                        className="preview-item"
                                                        onClick={() => handleResultClick(`/user/${u.userId || u.id}`)}
                                                    >
                                                        <div className="preview-avatar">
                                                            {u.profileImg ? (
                                                                <img src={u.profileImg} alt={u.username} />
                                                            ) : (
                                                                u.username.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="preview-info">
                                                            <div className="preview-name">{u.firstName} {u.lastName}</div>
                                                            <div className="preview-sub">@{u.username}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Threads */}
                                        {previewResults.threads && previewResults.threads.length > 0 && (
                                            <div className="preview-section">
                                                <div className="preview-header">Konular</div>
                                                {previewResults.threads.map((t: any) => (
                                                    <div
                                                        key={t.id}
                                                        className="preview-item"
                                                        onClick={() => handleResultClick(`/thread/${t.id}`)}
                                                    >
                                                        <div className="preview-icon">#</div>
                                                        <div className="preview-info">
                                                            <div className="preview-name">{t.title}</div>
                                                            <div className="preview-sub">{t.categoryName || 'Genel'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {(!previewResults.users?.length && !previewResults.threads?.length) && (
                                            <div className="preview-empty">Sonuç bulunamadı.</div>
                                        )}

                                        <div
                                            className="preview-footer"
                                            onClick={() => {
                                                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            Tüm sonuçları gör ({searchQuery})
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="navbar-desktop">
                        <div className="auth-buttons">
                            {isAuthenticated && user ? (
                                <>
                                    {/* Notifications */}
                                    <div className="notification-container" ref={notificationRef} style={{ position: 'relative' }}>
                                        <button
                                            className="notification-btn"
                                            onClick={handleNotificationClick}
                                        >
                                            <Bell size={20} />
                                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                                        </button>

                                        {isNotificationOpen && (
                                            <div className="notification-dropdown">
                                                <div className="notification-header">
                                                    <h3>Bildirimler</h3>
                                                    {unreadCount > 0 && (
                                                        <button className="mark-all-read" onClick={handleMarkAllRead}>
                                                            <CheckCheck size={14} />
                                                            Tümünü Oku
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="notification-list">
                                                    {notifLoading && notifications.length === 0 ? (
                                                        <div className="notif-loading">Yükleniyor...</div>
                                                    ) : notifications.length > 0 ? (
                                                        notifications.map(notif => (
                                                            <div
                                                                key={notif.id}
                                                                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                                                onClick={() => {
                                                                    // Navigate if link exists (assuming backend calculates it or we construct it)
                                                                    // For now close dropdown
                                                                    setIsNotificationOpen(false);
                                                                    if (!notif.isRead) handleMarkRead(notif.id, {} as any);
                                                                }}
                                                            >
                                                                <div className="notif-icon">
                                                                    <Bell size={16} />
                                                                </div>
                                                                <div className="notif-content">
                                                                    <div className="notif-title">{notif.title}</div>
                                                                    <div className="notif-message">{notif.message}</div>
                                                                    <div className="notif-time">{new Date(notif.createdAt).toLocaleDateString()}</div>
                                                                </div>
                                                                <div className="notif-actions">
                                                                    {!notif.isRead && (
                                                                        <button
                                                                            title="Okundu işaretle"
                                                                            onClick={(e) => handleMarkRead(notif.id, e)}
                                                                            className="action-btn-mini"
                                                                        >
                                                                            <span className="dot"></span>
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        title="Sil"
                                                                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                                                                        className="action-btn-mini delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="notif-empty">Bildirim yok</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="user-dropdown-container" style={{ position: 'relative' }}>
                                        <button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="user-menu-btn"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '30px',
                                                cursor: 'pointer',
                                                color: 'var(--text-color)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {user.profileImg ? (
                                                <img src={user.profileImg} alt={user.username} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                                    {user.firstName?.charAt(0) || user.username?.charAt(0)}
                                                </div>
                                            )}
                                            <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{user.firstName}</span>
                                            <ChevronDown size={16} style={{ opacity: 0.7 }} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isProfileMenuOpen && (
                                            <div className="profile-dropdown" style={{
                                                position: 'absolute',
                                                top: '120%',
                                                right: 0,
                                                width: '240px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--navbar-border)',
                                                borderRadius: '16px',
                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                                                padding: '0.5rem',
                                                zIndex: 100,
                                                backdropFilter: 'blur(12px)'
                                            }}>
                                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--navbar-border)', marginBottom: '0.5rem' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{user.username}</div>
                                                </div>

                                                <button
                                                    onClick={toggleTheme}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem 1rem',
                                                        color: 'var(--text-primary)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: '0.9rem',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                                    <span>{theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
                                                </button>

                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem 1rem',
                                                        color: 'var(--text-primary)',
                                                        textDecoration: 'none',
                                                        borderRadius: '8px',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Settings size={18} />
                                                    <span>Profil Ayarları</span>
                                                </Link>

                                                {/* Raporlarım */}
                                                <Link
                                                    to="/my-reports"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem 1rem',
                                                        color: 'var(--text-primary)',
                                                        textDecoration: 'none',
                                                        borderRadius: '8px',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Flag size={18} />
                                                    <span>Raporlarım</span>
                                                </Link>

                                                {/* Admin Panel - Admin ve Moderatör için */}
                                                {isAdminOrModerator && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setIsProfileMenuOpen(false)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            padding: '0.75rem 1rem',
                                                            color: '#8b5cf6',
                                                            textDecoration: 'none',
                                                            borderRadius: '8px',
                                                            transition: 'background 0.2s',
                                                            background: 'rgba(139, 92, 246, 0.1)'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                                                    >
                                                        <Shield size={18} />
                                                        <span>Admin Panel</span>
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        setIsProfileMenuOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem 1rem',
                                                        color: '#ef4444',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: '0.9rem',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <LogOut size={18} />
                                                    <span>Çıkış Yap</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-login">
                                        Giriş Yap
                                    </Link>
                                    <Link to="/register" className="btn-register">
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="navbar-mobile-toggle">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="menu-toggle"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    {isAuthenticated && user ? (
                        <>
                            <div className="mobile-user-info" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                        {user.firstName?.charAt(0) || user.username?.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>@{user.username}</div>
                                    </div>
                                </div>
                                <Link to="/profile" className="btn-login mobile-btn" style={{ marginBottom: '0.5rem', textAlign: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    Profil Ayarları
                                </Link>
                                {/* Raporlarım - Mobil */}
                                <Link
                                    to="/my-reports"
                                    className="btn-login mobile-btn"
                                    style={{
                                        marginBottom: '0.5rem',
                                        textAlign: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        color: '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Flag size={18} />
                                    <span>Raporlarım</span>
                                </Link>
                                {/* Admin Panel - Mobil - Admin ve Moderatör için */}
                                {isAdminOrModerator && (
                                    <Link
                                        to="/admin"
                                        className="btn-login mobile-btn"
                                        style={{
                                            marginBottom: '0.5rem',
                                            textAlign: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            color: '#8b5cf6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Shield size={18} />
                                        <span>Admin Panel</span>
                                    </Link>
                                )}
                                <button
                                    onClick={toggleTheme}
                                    className="btn-login mobile-btn"
                                    style={{ marginBottom: '0.5rem', textAlign: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                    <span>{theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
                                </button>
                            </div>
                            <button onClick={logout} className="btn-login mobile-btn" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                Çıkış Yap
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-login mobile-btn">
                                Giriş Yap
                            </Link>
                            <Link to="/register" className="btn-register mobile-btn">
                                Kayıt Ol
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
