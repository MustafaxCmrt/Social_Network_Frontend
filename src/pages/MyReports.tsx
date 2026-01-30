import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import type { MyReport } from '../types/report';
import { getReportReasonText, getReportStatusText, ReportStatus } from '../types/report';
import { ArrowLeft, Flag, User, MessageSquare, FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import '../styles/Home.css';

const MyReports: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<MyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        fetchReports();
    }, [currentPage]);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await reportService.getMyReports(currentPage, pageSize);
            setReports(data.items);
            setTotalPages(data.totalPages);
            setTotalCount(data.totalCount);
        } catch (err: any) {
            setError(err.message || 'Raporlar yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'User':
                return <User size={18} />;
            case 'Post':
                return <MessageSquare size={18} />;
            case 'Thread':
                return <FileText size={18} />;
            default:
                return <Flag size={18} />;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'User':
                return 'Kullanıcı';
            case 'Post':
                return 'Gönderi';
            case 'Thread':
                return 'Konu';
            default:
                return 'Bilinmiyor';
        }
    };

    const getStatusColor = (status: ReportStatus) => {
        switch (status) {
            case ReportStatus.Pending:
                return '#f59e0b'; // amber
            case ReportStatus.Reviewed:
                return '#3b82f6'; // blue
            case ReportStatus.Resolved:
                return '#10b981'; // green
            case ReportStatus.Rejected:
                return '#ef4444'; // red
            default:
                return '#6b7280'; // gray
        }
    };

    const getStatusIcon = (status: ReportStatus) => {
        switch (status) {
            case ReportStatus.Pending:
                return <Clock size={16} />;
            case ReportStatus.Reviewed:
                return <Eye size={16} />;
            case ReportStatus.Resolved:
                return <CheckCircle size={16} />;
            case ReportStatus.Rejected:
                return <XCircle size={16} />;
            default:
                return <Flag size={16} />;
        }
    };

    if (loading && reports.length === 0) {
        return (
            <div className="home-container flex-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="home-container">
            {/* Header */}
            <div className="page-header">
                <button onClick={handleBack} className="back-btn">
                    <ArrowLeft size={18} />
                    <span>Geri Dön</span>
                </button>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {/* Page Title */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
                        }}>
                            <Flag size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                Raporlarım
                            </h1>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Gönderdiğiniz {totalCount} raporun durumunu görüntüleyin
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="error-state" style={{ marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                {/* Reports List */}
                {reports.length === 0 && !loading ? (
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        padding: '3rem',
                        textAlign: 'center',
                        border: '1px solid var(--border-color)'
                    }}>
                        <Flag size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                            Henüz rapor göndermediniz
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            Uygunsuz içerik gördüğünüzde bildirebilirsiniz.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {reports.map((report, index) => {
                            const reportNumber = (currentPage - 1) * pageSize + index + 1;
                            return (
                                <div
                                    key={report.id}
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: '14px',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                    }}
                                >
                                    {/* Card Header with Number and Status */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem 1.5rem',
                                        background: 'var(--bg-secondary)',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                minWidth: '48px',
                                                height: '36px',
                                                padding: '0 1rem',
                                                borderRadius: '10px',
                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: '700',
                                                fontSize: '0.95rem',
                                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                            }}>
                                                #{reportNumber}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.45rem 0.85rem',
                                                borderRadius: '20px',
                                                background: `${getStatusColor(report.status)}15`,
                                                border: `1.5px solid ${getStatusColor(report.status)}40`,
                                                color: getStatusColor(report.status),
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                            }}>
                                                {getStatusIcon(report.status)}
                                                {getReportStatusText(report.status)}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <Clock size={14} />
                                            {formatDate(report.createdAt)}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            marginBottom: '1.25rem'
                                        }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--primary-color)',
                                                flexShrink: 0
                                            }}>
                                                {getTypeIcon(report.reportedType)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: '0.35rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: '500'
                                                }}>
                                                    {getTypeText(report.reportedType)} Raporu
                                                </div>
                                                <div style={{
                                                    fontSize: '1.15rem',
                                                    fontWeight: '600',
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    {report.reportedInfo}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reason Badge */}
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            color: '#f59e0b',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}>
                                            <Flag size={14} />
                                            {getReportReasonText(report.reason)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="category-pagination" style={{ marginTop: '2rem' }}>
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Önceki
                        </button>

                        <div className="pagination-info-center">
                            Sayfa {currentPage} / {totalPages} ({totalCount} rapor)
                        </div>

                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Sonraki
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyReports;
