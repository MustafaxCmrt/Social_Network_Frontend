import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { reportService } from '../../services/reportService';
import { ReportReason, getReportReasonText, type CreateReportDto } from '../../types/report';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle } from 'lucide-react';
import '../../styles/Auth.css';
import '../../styles/Modal.css';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportedUserId?: number | null;
    reportedPostId?: number | null;
    reportedThreadId?: number | null;
    targetName?: string; // Raporlanan nesnenin adı (kullanıcı adı, konu başlığı vb.)
}

export const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    reportedUserId,
    reportedPostId,
    reportedThreadId,
    targetName
}) => {
    const toast = useToast();
    const [reason, setReason] = useState<ReportReason>(ReportReason.Other);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setReason(ReportReason.Other);
            setDescription('');
            setError(null);
        }
    }, [isOpen]);

    const getTargetType = () => {
        if (reportedUserId) return 'kullanıcıyı';
        if (reportedPostId) return 'gönderiyi';
        if (reportedThreadId) return 'konuyu';
        return 'içeriği';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!reportedUserId && !reportedPostId && !reportedThreadId) {
            setError('Raporlanacak bir hedef belirtilmemiş.');
            return;
        }

        if (description.trim().length < 10) {
            setError('Açıklama en az 10 karakter olmalıdır.');
            return;
        }

        if (description.length > 1000) {
            setError('Açıklama en fazla 1000 karakter olabilir.');
            return;
        }

        setLoading(true);
        try {
            const data: CreateReportDto = {
                reportedUserId: reportedUserId || null,
                reportedPostId: reportedPostId || null,
                reportedThreadId: reportedThreadId || null,
                reason,
                description: description.trim()
            };

            await reportService.create(data);
            toast.success('Başarılı', 'Raporunuz alındı. İnceleme sürecine alınacaktır.');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Rapor gönderilirken bir hata oluştu.');
            toast.error('Hata', err.message || 'Rapor gönderilemedi.');
        } finally {
            setLoading(false);
        }
    };

    const reasons = [
        { value: ReportReason.Spam, label: getReportReasonText(ReportReason.Spam), description: 'Gereksiz veya tekrarlayan içerik' },
        { value: ReportReason.Harassment, label: getReportReasonText(ReportReason.Harassment), description: 'Hakaret, taciz veya zorbalık' },
        { value: ReportReason.InappropriateContent, label: getReportReasonText(ReportReason.InappropriateContent), description: 'Topluluk kurallarına aykırı içerik' },
        { value: ReportReason.Misinformation, label: getReportReasonText(ReportReason.Misinformation), description: 'Yanlış veya yanıltıcı bilgi' },
        { value: ReportReason.Other, label: getReportReasonText(ReportReason.Other), description: 'Diğer sebepler' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="İçerik Raporla"
        >
            <form onSubmit={handleSubmit} className="modal-form">
                {error && <div className="error-message">{error}</div>}

                {/* Header with icon */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <AlertTriangle size={32} style={{ color: '#ef4444' }} />
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                            Rapor Gönder
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {targetName ? (
                                <>
                                    <strong style={{ color: 'var(--text-primary)' }}>{targetName}</strong> {getTargetType()} raporluyorsunuz
                                </>
                            ) : (
                                <>Bu {getTargetType()} raporluyorsunuz</>
                            )}
                        </p>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="reason">Rapor Sebebi *</label>
                    <div className="input-wrapper">
                        <select
                            className="modal-input"
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(Number(e.target.value) as ReportReason)}
                            disabled={loading}
                            style={{ cursor: 'pointer' }}
                            required
                        >
                            {reasons.map(r => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                        {reasons.find(r => r.value === reason)?.description}
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Açıklama * (min 10 karakter)</label>
                    <div className="input-wrapper">
                        <textarea
                            className="modal-textarea"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Raporunuzla ilgili detaylı açıklama yazın... (min 10 karakter)"
                            rows={5}
                            disabled={loading}
                        />
                    </div>
                    <small style={{ 
                        color: description.length > 1000 ? '#ef4444' : 'var(--text-secondary)', 
                        fontSize: '0.85rem', 
                        marginTop: '0.25rem', 
                        display: 'block' 
                    }}>
                        {description.length} / 1000 karakter
                    </small>
                </div>

                <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem'
                }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        ℹ️ Raporunuz moderatörler tarafından incelenecek ve gerekli işlemler yapılacaktır. 
                        Yanlış veya kötü niyetli raporlar hesabınıza yaptırım uygulanmasına sebep olabilir.
                    </p>
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || description.trim().length < 10}
                        style={{ 
                            background: loading || description.trim().length < 10 ? undefined : '#ef4444',
                            borderColor: loading || description.trim().length < 10 ? undefined : '#ef4444'
                        }}
                    >
                        {loading ? 'Gönderiliyor...' : 'Raporu Gönder'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
