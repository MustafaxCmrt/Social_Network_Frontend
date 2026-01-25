import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchService } from '../services/searchService';
import type { GlobalSearchResponse, ThreadSearchResponse, PostSearchResponse, UserSearchResponse } from '../services/searchService';
import type { Thread } from '../types/thread';
import type { Post } from '../types/post';
import type { User } from '../types/index';
import { Loader2, MessageSquare, User as UserIcon, FileText, Calendar, Eye, CheckCircle } from 'lucide-react';
import '../styles/Search.css';

type TabType = 'all' | 'threads' | 'users' | 'posts';

const Search: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [loading, setLoading] = useState(false);

    // Data States
    const [globalData, setGlobalData] = useState<GlobalSearchResponse | null>(null);
    const [threadData, setThreadData] = useState<ThreadSearchResponse | null>(null);
    const [postData, setPostData] = useState<PostSearchResponse | null>(null);
    const [userData, setUserData] = useState<UserSearchResponse | null>(null);

    // Pagination
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!query) return;
        setPage(1); // Reset page on new query
        fetchData(1);
    }, [query, activeTab]);

    useEffect(() => {
        if (!query || page === 1) return; // Skip if handled by above useEffect
        fetchData(page);
    }, [page]);

    const fetchData = async (pageNum: number) => {
        setLoading(true);
        try {
            if (activeTab === 'all') {
                const data = await searchService.searchAll(query);
                setGlobalData(data);
            } else if (activeTab === 'threads') {
                const data = await searchService.searchThreads(query, pageNum);
                setThreadData(data);
            } else if (activeTab === 'posts') {
                const data = await searchService.searchPosts(query, pageNum);
                setPostData(data);
            } else if (activeTab === 'users') {
                const data = await searchService.searchUsers(query, pageNum);
                setUserData(data);
            }
        } catch (error) {
            console.error('Search error', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setPage(1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // --- Render Helpers ---

    const renderThreadItem = (thread: Thread) => (
        <div key={thread.id} className="search-card" onClick={() => navigate(`/thread/${thread.id}`)}>
            <div className="search-card-header">
                <span className="search-category-badge">
                    {thread.categoryName || 'Genel'}
                </span>
                <span className="search-date">
                    <Calendar size={14} />
                    {formatDate(thread.createdAt)}
                </span>
            </div>

            <h3 className="search-card-title">{thread.title}</h3>

            <p className="search-card-description">
                {thread.content.substring(0, 150)}{thread.content.length > 150 ? '...' : ''}
            </p>

            <div className="search-card-footer">
                <div className="search-author">
                    <div className="author-avatar">
                        <img
                            src={thread.user?.profileImg || `https://ui-avatars.com/api/?name=${thread.username || 'U'}&background=random`}
                            alt={thread.username}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${thread.username || 'U'}&background=random`
                            }}
                        />
                    </div>
                    <span className="author-name">{thread.username}</span>
                </div>
                <div className="search-stats">
                    <span className="stat-item" title="Görüntülenme">
                        <Eye size={16} /> {thread.viewCount}
                    </span>
                    <span className="stat-item" title="Yorumlar">
                        <MessageSquare size={16} /> {thread.postCount}
                    </span>
                    {thread.isSolved && (
                        <span className="stat-item" title="Çözüldü" style={{ color: '#10B981' }}>
                            <CheckCircle size={16} />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPostItem = (post: Post) => (
        <div key={post.id} className="search-card" onClick={() => navigate(`/thread/${post.threadId}`)}>
            <div className="search-card-header">
                <span className="search-category-badge" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    Yorum
                </span>
                <span className="search-date">
                    {formatDate(post.createdAt)}
                </span>
            </div>

            <p className="search-card-description" style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>
                "{post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}"
            </p>

            <div className="search-card-footer">
                <div className="search-author">
                    <span className="author-name">Yazar: {post.username}</span>
                </div>
                <div className="search-stats">
                    <span style={{ fontSize: '0.85rem' }}>
                        Konu: <strong>{post.threadTitle}</strong>
                    </span>
                </div>
            </div>
        </div>
    );

    const renderUserItem = (user: User) => (
        <div key={user.userId} className="search-card user-card" onClick={() => navigate(`/user/${user.userId}`)}>
            <div className="user-avatar-large">
                {user.profileImg ? (
                    <img src={user.profileImg} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    (user.firstName?.charAt(0) || user.username?.charAt(0)).toUpperCase()
                )}
            </div>
            <div className="user-info">
                <h3>{user.firstName} {user.lastName}</h3>
                <div className="user-handle">@{user.username}</div>
                <div className="user-meta">
                    <span>Katılma: {formatDate(user.createdAt)}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="search-container">
            <div className="search-header">
                <h1 className="search-title">
                    Aranan: <span className="search-query-highlight">"{query}"</span>
                </h1>
            </div>

            <div className="search-tabs">
                <button onClick={() => handleTabChange('all')} className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}>
                    Tümü
                </button>
                <button onClick={() => handleTabChange('threads')} className={`tab-btn ${activeTab === 'threads' ? 'active' : ''}`}>
                    Konular
                </button>
                <button onClick={() => handleTabChange('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>
                    Kullanıcılar
                </button>
                <button onClick={() => handleTabChange('posts')} className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}>
                    Yorumlar
                </button>
            </div>

            {loading ? (
                <div className="loader-container">
                    <Loader2 className="animate-spin" size={48} color="#4f46e5" />
                </div>
            ) : (
                <div className="results-section">
                    {/* ALL TAB */}
                    {activeTab === 'all' && globalData && (
                        <div className="results-list">
                            {/* Threads Section */}
                            <section>
                                <div className="section-title">
                                    <FileText size={24} className="section-icon" /> Konular
                                </div>
                                {globalData.threads.length > 0 ? (
                                    <div className="results-list">
                                        {globalData.threads.map(renderThreadItem)}
                                        <button onClick={() => setActiveTab('threads')} className="btn-secondary btn-full-width">
                                            Tüm konuları gör
                                        </button>
                                    </div>
                                ) : (
                                    <p className="empty-state">Konu bulunamadı.</p>
                                )}
                            </section>

                            {/* Users Section */}
                            {globalData.users && globalData.users.length > 0 && (
                                <section style={{ marginTop: '2rem' }}>
                                    <div className="section-title">
                                        <UserIcon size={24} className="section-icon" /> Kullanıcılar
                                    </div>
                                    <div className="users-grid" style={{ marginBottom: '1rem' }}>
                                        {globalData.users.slice(0, 4).map(renderUserItem)}
                                    </div>
                                    <button onClick={() => setActiveTab('users')} className="btn-secondary btn-full-width">
                                        Tüm kullanıcıları gör
                                    </button>
                                </section>
                            )}

                            {/* Posts Section */}
                            <section style={{ marginTop: '2rem' }}>
                                <div className="section-title">
                                    <MessageSquare size={24} className="section-icon" /> Yorumlar
                                </div>
                                {globalData.posts.length > 0 ? (
                                    <div className="results-list">
                                        {globalData.posts.map(renderPostItem)}
                                        <button onClick={() => setActiveTab('posts')} className="btn-secondary btn-full-width">
                                            Tüm yorumları gör
                                        </button>
                                    </div>
                                ) : (
                                    <p className="empty-state">Yorum bulunamadı.</p>
                                )}
                            </section>
                        </div>
                    )}

                    {/* THREADS TAB */}
                    {activeTab === 'threads' && threadData && (
                        <div>
                            <div className="results-list">
                                {threadData.results.length > 0 ? (
                                    threadData.results.map(renderThreadItem)
                                ) : (
                                    <div className="empty-state">Sonuç bulunamadı.</div>
                                )}
                            </div>
                            {threadData.totalPages > 1 && (
                                <div className="pagination">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">Önceki</button>
                                    <span>Sayfa {page} / {threadData.totalPages}</span>
                                    <button disabled={page === threadData.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary">Sonraki</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && userData && (
                        <div>
                            <div className="users-grid">
                                {userData.results.length > 0 ? (
                                    userData.results.map(renderUserItem)
                                ) : (
                                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>Kullanıcı bulunamadı.</div>
                                )}
                            </div>
                            {userData.totalPages > 1 && (
                                <div className="pagination">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">Önceki</button>
                                    <span>Sayfa {page} / {userData.totalPages}</span>
                                    <button disabled={page === userData.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary">Sonraki</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* POSTS TAB */}
                    {activeTab === 'posts' && postData && (
                        <div>
                            <div className="results-list">
                                {postData.results.length > 0 ? (
                                    postData.results.map(renderPostItem)
                                ) : (
                                    <div className="empty-state">Yorum bulunamadı.</div>
                                )}
                            </div>
                            {postData.totalPages > 1 && (
                                <div className="pagination">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">Önceki</button>
                                    <span>Sayfa {page} / {postData.totalPages}</span>
                                    <button disabled={page === postData.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary">Sonraki</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;
