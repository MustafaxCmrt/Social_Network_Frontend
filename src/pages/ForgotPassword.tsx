import React, { useState } from 'react';
import '../styles/Auth.css';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Lütfen email adresinizi giriniz.');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            await authService.forgotPassword({ email });
            setMessage('Şifre sıfırlama bağlantısı email adresinize gönderildi.');
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Şifremi Unuttum</h2>
                <p className="auth-subtitle">Hesabınıza ait email adresini giriniz</p>

                {error && <div className="auth-error" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                {message && <div className="auth-success" style={{ color: '#22c55e', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="ornek@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading || !!message}
                            required
                        />
                    </div>

                    {!message && (
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                        </button>
                    )}
                </form>

                <p className="auth-redirect">
                    <Link to="/login">Giriş Yap sayfasına dön</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
