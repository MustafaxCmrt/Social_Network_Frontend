import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-content">
                    {/* Logo */}
                    <div className="navbar-logo">
                        <span className="logo-text">SocialNet</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="navbar-desktop">
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="auth-buttons">
                            <Link to="/login" className="btn-login">
                                Giriş Yap
                            </Link>
                            <Link to="/register" className="btn-register">
                                Kayıt Ol
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="navbar-mobile-toggle">
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle-mobile"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
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
                    <Link to="/login" className="btn-login mobile-btn">
                        Giriş Yap
                    </Link>
                    <Link to="/register" className="btn-register mobile-btn">
                        Kayıt Ol
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
