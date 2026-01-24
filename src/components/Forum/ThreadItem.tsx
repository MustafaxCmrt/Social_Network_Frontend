import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Thread } from '../../types/thread';
import { Edit2, Trash2, Pin, MessageSquare, Eye } from 'lucide-react';

interface ThreadItemProps {
    thread: Thread;
    currentUserId?: number; // Gelecekte auth user id'si eklenecek
    onEdit?: (thread: Thread) => void;
    onDelete?: (thread: Thread) => void;
}

export const ThreadItem: React.FC<ThreadItemProps> = ({ thread, onEdit, onDelete }) => {
    const navigate = useNavigate();

    // Statik veriler veya fallback değerler
    const authorName = thread.author?.username || 'Kullanıcı';
    const authorAvatar = thread.author?.avatar || `https://ui-avatars.com/api/?name=${authorName}&background=random`;
    const replyCount = thread.replyCount || 0;
    const categoryName = thread.categoryName || 'Genel';
    const tags = thread.tags || [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleCardClick = () => {
        navigate(`/thread/${thread.id}`);
    };

    const handleUserClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // İlerde user profiline gidebilir
    };

    return (
        <div
            className="thread-item group relative cursor-pointer hover:bg-opacity-50 transition-colors"
            onClick={handleCardClick}
        >
            <img
                src={authorAvatar}
                alt={authorName}
                className="thread-avatar cursor-pointer"
                onClick={handleUserClick}
            />
            <div className="thread-content">
                <div className="thread-meta-top">
                    {thread.isPinned && (
                        <span className="thread-badge pinned">
                            <Pin size={12} className="badge-icon" />
                            Sabit
                        </span>
                    )}
                    <span className="thread-badge category">
                        {categoryName}
                    </span>
                    <span className="thread-date">• {formatDate(thread.createdAt)}</span>
                </div>

                <h3 className="thread-title" style={{ paddingRight: '20px' }}>
                    {thread.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {thread.content.length > 200 ? thread.content.substring(0, 200) + '...' : thread.content}
                </p>

                <div className="thread-meta-bottom">
                    <span className="meta-user">
                        @{authorName}
                    </span>
                    <span className="meta-stat">
                        <Eye size={14} className="meta-icon" />
                        {thread.viewCount}
                    </span>
                    <span className="meta-stat">
                        <MessageSquare size={14} className="meta-icon" />
                        {replyCount} Cevap
                    </span>
                    <div className="spacer"></div>
                    <div className="thread-tags">
                        {tags.map(tag => (
                            <span key={tag} className="thread-tag">#{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Buttons - Absolute positioned top-right of the CARD */}
            <div className="thread-actions" style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                opacity: 0,
                transition: 'opacity 0.2s',
                zIndex: 20
            }}>
                {onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(thread); }}
                        className="action-btn-minimal edit"
                        title="Düzenle"
                        style={{
                            padding: '0.4rem',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Edit2 size={16} />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(thread); }}
                        className="action-btn-minimal delete"
                        title="Sil"
                        style={{
                            padding: '0.4rem',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* CSS override to show actions on hover - inline for quick fix or add to CSS file */}
            <style>{`
                .thread-item:hover .thread-actions {
                    opacity: 1 !important;
                }
                .action-btn-minimal:hover {
                    transform: translateY(-2px);
                    filter: brightness(0.95);
                }
            `}</style>
        </div>
    );
};
