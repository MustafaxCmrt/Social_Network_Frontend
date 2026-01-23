import React, { useState, useEffect } from 'react';
import '../styles/Auth.css';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Geçersiz veya eksik token. Lütfen linke tekrar tıklayınız.');
        }
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
        if (error) setError(null);
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
            // Redirect to login with success indicator? 
            // Ideally show a toast, but for now just redirect
            alert('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.');
            navigate('/login');
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

                {error && <div className="auth-error" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'left', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="newPassword">Yeni Şifre</label>
                        <input
                            type="password"
                            id="newPassword"
                            placeholder="••••••••"
                            value={formData.newPassword}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
