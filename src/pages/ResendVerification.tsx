import React, { useState } from 'react';
import '../styles/Auth.css';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ResendVerification: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setStatus({ type: 'error', message: 'Lütfen email adresinizi girin' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            await authService.resendVerificationEmail({ email });
            setStatus({
                type: 'success',
                message: 'Doğrulama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
            });
            setEmail(''); // Clear input on success
        } catch (err: any) {
            setStatus({
                type: 'error',
                message: err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Aktivasyon Kodu</h2>
                <p className="auth-subtitle">E-posta doğrulama bağlantısını tekrar gönder</p>

                {status && (
                    <div className="auth-error" style={{
                        color: status.type === 'error' ? '#ef4444' : '#10b981',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        padding: '10px',
                        borderRadius: '4px'
                    }}>
                        {status.message}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Adresi</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="ornek@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Gönderiliyor...' : 'Doğrulama Kodunu Gönder'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>veya</span>
                </div>

                <p className="auth-redirect">
                    <Link to="/login">Giriş sayfasına dön</Link>
                </p>
            </div>
        </div>
    );
};

export default ResendVerification;
