import React, { useState, useEffect } from 'react';
import '../styles/Auth.css';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        newPassword: false,
        confirmPassword: false
    });

    useEffect(() => {
        if (!token) {
            setError('Geçersiz veya eksik token. Lütfen linke tekrar tıklayınız.');
        }
    }, [token]);

    // Auto-redirect after success
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                navigate('/login');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
        if (error) setError(null);
    };

    const togglePasswordVisibility = (field: 'newPassword' | 'confirmPassword') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = (): boolean => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,100}$/;

        if (!formData.newPassword || !passwordRegex.test(formData.newPassword)) {
            setError('Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.');
            return false;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) return;
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            await authService.resetPassword({
                token,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });
            setSuccess('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');
        } catch (err: any) {
            setError(err.message || 'Şifre sıfırlanırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Hata</h2>
                    <p className="auth-error">Token bulunamadı.</p>
                    <Link to="/login">Giriş Yap</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Yeni Şifre Belirle</h2>
                <p className="auth-subtitle">Güvenli bir şifre seçiniz</p>

                {/* Success Notification */}
                {success && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.1))',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '12px',
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.2)',
                            flexShrink: 0
                        }}>
                            <CheckCircle size={24} color="#10b981" />
                        </div>
                        <div>
                            <p style={{
                                margin: 0,
                                color: '#10b981',
                                fontWeight: 600,
                                fontSize: '0.95rem'
                            }}>
                                Başarılı!
                            </p>
                            <p style={{
                                margin: '0.25rem 0 0',
                                color: '#6ee7b7',
                                fontSize: '0.85rem'
                            }}>
                                {success}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Notification */}
                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.1))',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.2)',
                            flexShrink: 0
                        }}>
                            <XCircle size={24} color="#ef4444" />
                        </div>
                        <div>
                            <p style={{
                                margin: 0,
                                color: '#ef4444',
                                fontWeight: 600,
                                fontSize: '0.95rem'
                            }}>
                                Hata!
                            </p>
                            <p style={{
                                margin: '0.25rem 0 0',
                                color: '#fca5a5',
                                fontSize: '0.85rem'
                            }}>
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {!success && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="newPassword">Yeni Şifre</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.newPassword ? "text" : "password"}
                                    id="newPassword"
                                    placeholder="••••••••"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('newPassword')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#94a3b8',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    {showPasswords.newPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.confirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirmPassword')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#94a3b8',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    {showPasswords.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>
                    </form>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default ResetPassword;
