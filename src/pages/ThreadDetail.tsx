import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { threadService } from '../services/threadService';
import { postService } from '../services/postService';
import { categoryService } from '../services/categoryService';
import type { Thread } from '../types/thread';
import type { Post } from '../types/post';
import type { Category } from '../types/category';
import { Pin, MessageSquare, Eye, ArrowLeft, Send, User, Calendar, Hash } from 'lucide-react';
import '../styles/Home.css';

const ThreadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [thread, setThread] = useState<Thread | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchThreadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [threadData, postResponse, categoryData] = await Promise.all([
                threadService.getById(Number(id)),
                postService.getAllByThreadId(Number(id), { page: 1, pageSize: 50 }),
                categoryService.getAll()
            ]);

            setThread(threadData);
            setPosts(postResponse.items);
            setCategories(categoryData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Konu detayları yüklenirken bir hata oluştu veya konu bulunamadı.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThreadData();
        window.scrollTo(0, 0);
    }, [id]);

    const handleBack = () => {
        navigate('/');
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim() || !id) return;

        setSubmitting(true);
        try {
            await postService.create({
                threadId: Number(id),
                content: newPostContent,
            });
            setNewPostContent('');
            const postResponse = await postService.getAllByThreadId(Number(id), { page: 1, pageSize: 50 });
            setPosts(postResponse.items);
        } catch (err) {
            console.error(err);
            alert('Yorum gönderilirken bir hata oluştu.');
        } finally {
            setSubmitting(false);
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

    if (loading) {
        return (
            <div className="home-container flex-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error || !thread) {
        return (
            <div className="home-container">
                <button onClick={handleBack} className="back-btn">
                    <ArrowLeft size={20} />
                    Geri Dön
                </button>
                <div className="error-state">{error || 'Konu bulunamadı.'}</div>
            </div>
        );
    }

    return (
        <div className="home-container">
            {/* Header Navigation */}
            <div className="page-header">
                <button onClick={handleBack} className="back-btn">
                    <ArrowLeft size={18} />
                    <span>Foruma Dön</span>
                </button>
            </div>

            <div className="forum-layout">
                {/* Left Sidebar */}
                <aside className="forum-sidebar">
                    <div className="sidebar-header">
                        <h2>Kategoriler</h2>
                    </div>
                    <div className="category-list">
                        {categories.map(category => (
                            <div
                                key={category.id}
                                className={`category-card ${thread.categoryId === category.id ? 'active' : ''}`}
                                onClick={() => navigate('/')}
                            >
                                <div className="category-header">
                                    <span className="category-icon">
                                        <Hash size={20} />
                                    </span>
                                    <div className="category-info">
                                        <h4 className="category-title">{category.title}</h4>
                                        <p className="category-description">{category.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="forum-main">
                    {/* Main Thread Card */}
                    <article className="thread-detail-card">
                        <div className="thread-detail-header">
                            <div className="thread-author-section">
                                <img
                                    src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username || 'K'}&background=random`}
                                    alt={thread.author?.username}
                                    className="detail-avatar"
                                />
                                <div className="thread-meta-info">
                                    <h1 className="thread-detail-title">{thread.title}</h1>
                                    <div className="thread-badges">
                                        {thread.isPinned && (
                                            <span className="thread-badge pinned">
                                                <Pin size={12} className="badge-icon" />
                                                Sabit
                                            </span>
                                        )}
                                        <span className="thread-badge category">
                                            {thread.categoryName || 'Genel'}
                                        </span>
                                        <span className="meta-item">
                                            <User size={14} />
                                            @{thread.author?.username || 'Kullanıcı'}
                                        </span>
                                        <span className="meta-item">
                                            <Calendar size={14} />
                                            {formatDate(thread.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="thread-detail-body">
                            {thread.content}
                        </div>

                        <div className="thread-detail-footer">
                            <div className="detail-stats">
                                <span className="stat-pill" title="Görüntülenme">
                                    <Eye size={16} />
                                    {thread.viewCount} Görüntülenme
                                </span>
                                <span className="stat-pill" title="Cevaplar">
                                    <MessageSquare size={16} />
                                    {posts.length} Cevap
                                </span>
                            </div>
                        </div>
                    </article>

                    {/* Reply Form */}
                    <div className="reply-section">
                        <div className="reply-header">
                            <MessageSquare size={20} className="text-accent" />
                            <h3>Cevap Yaz</h3>
                        </div>
                        <form onSubmit={handlePostSubmit} className="reply-form">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Bu konu hakkında ne düşünüyorsun? Detaylı bir cevap yaz..."
                                className="reply-textarea"
                            />
                            <div className="form-actions">
                                <button
                                    type="submit"
                                    disabled={submitting || !newPostContent.trim()}
                                    className="btn-primary submit-btn"
                                >
                                    {submitting ? 'Gönderiliyor...' : (
                                        <>
                                            <Send size={18} />
                                            Cevabı Gönder
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Posts List */}
                    <div className="posts-container">
                        <div className="posts-header">
                            <h3>Yorumlar</h3>
                            <span className="count-badge">{posts.length}</span>
                        </div>

                        <div className="posts-list">
                            {posts.map(post => (
                                <div key={post.id} className={`post-card ${post.author?.username === thread.author?.username ? 'is-author' : ''}`}>
                                    <div className="post-sidebar">
                                        <img
                                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.username || 'U'}&background=random`}
                                            alt={post.author?.username}
                                            className="post-avatar"
                                        />
                                    </div>
                                    <div className="post-content-wrapper">
                                        <div className="post-header">
                                            <div className="post-user-info">
                                                <span className="post-username">@{post.author?.username || 'Kullanıcı'}</span>
                                                {post.author?.username === thread.author?.username && (
                                                    <span className="author-badge">Yazar</span>
                                                )}
                                            </div>
                                            <span className="post-date">{formatDate(post.createdAt)}</span>
                                        </div>

                                        <div className="post-body">
                                            {post.content}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {posts.length === 0 && (
                                <div className="empty-posts">
                                    <div className="empty-icon">
                                        <MessageSquare size={32} />
                                    </div>
                                    <h3>Henüz yorum yok</h3>
                                    <p>Bu konu hakkında ilk yorumu yazarak tartışmayı başlatabilirsin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="forum-right-panel">
                    <div className="widget-card info-widget">
                        <h3>Konu Bilgileri</h3>
                        <div className="info-list">
                            <div className="info-row">
                                <span className="label">Oluşturulma</span>
                                <span className="value">{new Date(thread.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Son Aktivite</span>
                                <span className="value">{new Date(thread.updatedAt || thread.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Durum</span>
                                <span className={`status-badge ${thread.isSolved ? 'solved' : 'open'}`}>
                                    {thread.isSolved ? 'Çözüldü' : 'Açık'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="widget-card">
                        <h3>Popüler Etiketler</h3>
                        <div className="tags-cloud">
                            <span className="tag">#yazılım</span>
                            <span className="tag">#tasarım</span>
                            <span className="tag">#react</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ThreadDetail;
