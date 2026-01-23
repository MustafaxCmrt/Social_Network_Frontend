import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Auth.css';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
        if (error) setError(null);
    };

    const validateForm = (): boolean => {
        // Regex Patterns from backend
        const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ ]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,100}$/;

        if (!formData.firstName || !nameRegex.test(formData.firstName) || formData.firstName.length < 2) {
            setError('Ad sadece harf içermeli ve en az 2 karakter olmalıdır.');
            return false;
        }
        if (!formData.lastName || !nameRegex.test(formData.lastName) || formData.lastName.length < 2) {
            setError('Soyad sadece harf içermeli ve en az 2 karakter olmalıdır.');
            return false;
        }
        if (!formData.username || !usernameRegex.test(formData.username) || formData.username.length < 4) {
            setError('Kullanıcı adı en az 4 karakter olmalı; harf, rakam ve alt çizgi içerebilir.');
            return false;
        }
        if (!formData.email || !emailRegex.test(formData.email)) {
            setError('Geçerli bir email adresi giriniz.');
            return false;
        }
        if (!formData.password || !passwordRegex.test(formData.password)) {
            setError('Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            await authService.register(formData);
            // On success, redirect to login
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Kayıt olurken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Hesap Oluştur</h2>
                <p className="auth-subtitle">Ücretsiz binlerce kaynağa erişin</p>

                {error && <div className="auth-error" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'left', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="firstName">Ad</label>
                            <input
                                type="text"
                                id="firstName"
                                placeholder="Adınız"
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="lastName">Soyad</label>
                            <input
                                type="text"
                                id="lastName"
                                placeholder="Soyadınız"
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Kullanıcı Adı</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="kullaniciadi"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="ornek@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Şifre</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Şifre Tekrar</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={loading}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>veya</span>
                </div>

                <button className="btn-social google">
                    <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                    Google ile devam et
                </button>

                <p className="auth-redirect">
                    Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
