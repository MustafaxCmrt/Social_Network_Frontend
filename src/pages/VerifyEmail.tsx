import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import '../styles/Auth.css';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    const verifyCalled = React.useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Doğrulama tokeni bulunamadı.');
            return;
        }

        if (verifyCalled.current) return;
        verifyCalled.current = true;

        const verify = async () => {
            try {
                const response = await authService.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || 'Email adresiniz başarıyla doğrulandı.');

                // Başarılı olduktan 3 saniye sonra login sayfasına yönlendir
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Email doğrulama işlemi başarısız oldu. Linkin süresi dolmuş olabilir.');
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                {status === 'loading' && (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                        <Loader2 className="animate-spin" size={48} color="#4f46e5" />
                        <h2 className="auth-title" style={{ fontSize: '1.5rem' }}>Doğrulanıyor...</h2>
                        <p className="auth-subtitle">Lütfen bekleyin, email adresiniz doğrulanıyor.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                        <CheckCircle size={64} color="#10B981" />
                        <h2 className="auth-title" style={{ fontSize: '1.5rem', color: '#10B981' }}>Başarılı!</h2>
                        <p className="auth-subtitle" style={{ fontSize: '1.1rem', color: '#374151' }}>
                            {message}
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '1rem' }}>
                            3 saniye içinde giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                        <Link to="/login" className="btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                            Hemen Giriş Yap
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                        <XCircle size={64} color="#EF4444" />
                        <h2 className="auth-title" style={{ fontSize: '1.5rem', color: '#EF4444' }}>Hata!</h2>
                        <p className="auth-subtitle" style={{ fontSize: '1.1rem', color: '#374151' }}>
                            {message}
                        </p>
                        <Link to="/login" className="btn-primary" style={{ marginTop: '1rem', textDecoration: 'none', backgroundColor: '#6b7280' }}>
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
