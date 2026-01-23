import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, LogOut, Settings, ChevronDown } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-content">
                    {/* Logo */}
                    <div className="navbar-logo">
                        <Link to="/" className="logo-text" style={{ textDecoration: 'none' }}>SocialNet</Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="navbar-desktop">


                        <div className="auth-buttons">
                            {isAuthenticated && user ? (
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
