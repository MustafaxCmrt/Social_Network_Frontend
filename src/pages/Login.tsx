import React, { useState } from 'react';
import { Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import '../styles/Auth.css';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Email verification states
    const [emailNotVerified, setEmailNotVerified] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
        if (error) {
            setError(null);
            setEmailNotVerified(false);
            setResendSuccess(false);
        }
    };

    const validateForm = (): boolean => {
        if (!formData.usernameOrEmail) {
            setError('Kullanici adi veya email adresi bos olamaz');
            return false;
        }
        if (!formData.password) {
            setError('Sifre bos olamaz');
            return false;
        }
        if (formData.password.length < 5) {
            setError('Sifre en az 5 karakter olmalidir');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setEmailNotVerified(false);
        setResendSuccess(false);

        try {
            await login(formData);
            setLoading(false);
            setSuccess(true);

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (err: any) {
            const errorMessage = err.message || 'Giris yapilirken bir hata olustu';
            setError(errorMessage);
            setLoading(false);

            // Check if error is about email not verified
            if (errorMessage.toLowerCase().includes('dogrulanmamis') ||
                errorMessage.toLowerCase().includes('dogrulama') ||
                errorMessage.toLowerCase().includes('verified')) {
                setEmailNotVerified(true);
            }
        }
    };

    const handleResendVerification = async () => {
        // Try to extract email from usernameOrEmail field
        const email = formData.usernameOrEmail.includes('@')
            ? formData.usernameOrEmail
            : '';

        if (!email) {
            setError('Dogrulama emaili gondermek icin lutfen email adresinizi girin');
            return;
        }

        setResendLoading(true);
        try {
            await authService.resendVerificationEmail({ email });
            setResendSuccess(true);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Dogrulama emaili gonderilemedi');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {success ? (
                    <div style={{ padding: '2rem 0', animation: 'fadeIn 0.5s ease' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#10b981',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3 className="auth-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Giris Basarili!</h3>
                        <p className="auth-subtitle">Yonlendiriliyorsunuz...</p>
                    </div>
                ) : (
                    <>
                        <h2 className="auth-title">Giris Yap</h2>
                        <p className="auth-subtitle">Tekrar hosgeldiniz</p>

                        {/* Email not verified special message */}
                        {emailNotVerified && !resendSuccess && (
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <Mail size={20} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ margin: 0, color: '#f59e0b', fontWeight: 500, fontSize: '0.9rem' }}>
                                            Email Dogrulanmamis
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            Giris yapabilmek icin email adresinizi dogrulamaniz gerekiyor.
                                            Email kutunuzu kontrol edin veya yeni dogrulama linki isteyin.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleResendVerification}
                                            disabled={resendLoading}
                                            style={{
                                                marginTop: '0.75rem',
                                                padding: '0.5rem 1rem',
                                                background: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: resendLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                opacity: resendLoading ? 0.7 : 1
                                            }}
                                        >
                                            <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                                            {resendLoading ? 'Gonderiliyor...' : 'Dogrulama Emaili Gonder'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resend success message */}
                        {resendSuccess && (
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <Mail size={20} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ margin: 0, color: '#10b981', fontWeight: 500, fontSize: '0.9rem' }}>
                                            Dogrulama Emaili Gonderildi!
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            Lutfen email kutunuzu kontrol edin ve dogrulama linkine tiklayin.
                                            Dogruladiktan sonra giris yapabilirsiniz.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Regular error message (only show if not email verification error) */}
                        {error && !emailNotVerified && (
                            <div className="auth-error" style={{
                                color: '#ef4444',
                                marginBottom: '1rem',
                                fontSize: '0.9rem',
                                padding: '0.75rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '8px'
                            }}>
                                {error}
                            </div>
                        )}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="usernameOrEmail">Kullanici Adi veya Email *</label>
                                <input
                                    type="text"
                                    id="usernameOrEmail"
                                    placeholder="ornek@email.com"
                                    value={formData.usernameOrEmail}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Sifre *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="********"
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

                            <div className="form-footer">
                                <Link to="/forgot-password" className="forgot-password">Sifremi unuttum</Link>
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Giris Yapiliyor...' : 'Giris Yap'}
                            </button>
                        </form>

                        <div className="auth-footer-links" style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link to="/resend-verification" style={{ fontSize: '0.9rem', color: '#6b7280', textDecoration: 'none' }}>
                                Aktivasyon maili gelmedi mi?
                            </Link>
                        </div>

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
                            Hesabiniz yok mu? <Link to="/register">Kayit Ol</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
