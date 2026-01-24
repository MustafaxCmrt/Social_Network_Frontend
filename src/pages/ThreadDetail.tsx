import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { threadService } from '../services/threadService';
import { postService } from '../services/postService';
import type { Thread } from '../types/thread';
import type { Post } from '../types/post';
import {
    Pin, MessageSquare, Eye, ArrowLeft, Send, User, Calendar,
    ThumbsUp, CheckCircle, Image, Reply, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import '../styles/Home.css';

const ThreadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const [thread, setThread] = useState<Thread | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reply form state
    const [newPostContent, setNewPostContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);

    // Upvote tracking
    const [upvotedPosts, setUpvotedPosts] = useState<Set<number>>(new Set());
    const [postUpvotes, setPostUpvotes] = useState<Map<number, number>>(new Map());

    // Replies state
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const [postReplies, setPostReplies] = useState<Map<number, Post[]>>(new Map());
    const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());

    const fetchThreadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [threadData, postResponse] = await Promise.all([
                threadService.getById(Number(id)),
                postService.getAllByThreadId(Number(id), { page: 1, pageSize: 50 })
            ]);

            setThread(threadData);
            setPosts(postResponse.items);

            // Initialize upvote counts
            const upvoteMap = new Map<number, number>();
            postResponse.items.forEach(post => {
                upvoteMap.set(post.id, post.upvoteCount);
            });
            setPostUpvotes(upvoteMap);

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

    // Image handling
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Submit post/reply
    const handlePostSubmit = async (e: React.FormEvent, parentPostId?: number) => {
        e.preventDefault();
        if (!newPostContent.trim() || !id) return;

        setSubmitting(true);
        try {
            let imageUrl: string | undefined;

            // Upload image if selected
            if (selectedImage) {
                imageUrl = await postService.uploadImage(selectedImage);
            }

            await postService.create({
                threadId: Number(id),
                content: newPostContent,
                img: imageUrl,
                parentPostId: parentPostId || undefined
            });

            setNewPostContent('');
            removeImage();
            setReplyingToPostId(null);

            // Refresh posts
            const postResponse = await postService.getAllByThreadId(Number(id), { page: 1, pageSize: 50 });
            setPosts(postResponse.items);

            // Initialize upvote counts for new posts
            const upvoteMap = new Map<number, number>();
            postResponse.items.forEach(post => {
                upvoteMap.set(post.id, post.upvoteCount);
            });
            setPostUpvotes(upvoteMap);

            // If it was a reply, refresh replies for the parent post
            if (parentPostId) {
                const response = await postService.getReplies(parentPostId, { page: 1, pageSize: 20 });
                setPostReplies(prev => new Map(prev).set(parentPostId, response.items));
                setExpandedReplies(prev => new Set(prev).add(parentPostId));
            }

        } catch (err) {
            console.error(err);
            toast.error('Hata', 'Yorum gönderilirken bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    // Upvote handling
    const handleUpvote = async (postId: number) => {
        try {
            const isUpvoted = upvotedPosts.has(postId);

            if (isUpvoted) {
                const response = await postService.removeUpvote(postId);
                setUpvotedPosts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(postId);
                    return newSet;
                });
                setPostUpvotes(prev => new Map(prev).set(postId, response.totalUpvotes));
            } else {
                const response = await postService.upvote(postId);
                setUpvotedPosts(prev => new Set(prev).add(postId));
                setPostUpvotes(prev => new Map(prev).set(postId, response.totalUpvotes));
            }
        } catch (err) {
            console.error(err);
            toast.error('Hata', 'Beğeni işlemi başarısız oldu.');
        }
    };

    // Mark solution
    const handleMarkSolution = async (postId: number) => {
        if (!thread || !id) return;

        try {
            await postService.markSolution({
                threadId: Number(id),
                postId: postId
            });

            // Update thread status
            setThread(prev => prev ? { ...prev, isSolved: true } : null);

            // Update posts to show solution badge
            setPosts(prev => prev.map(post => ({
                ...post,
                isSolution: post.id === postId
            })));

            toast.success('Çözüm İşaretlendi', 'Bu yorum çözüm olarak işaretlendi.');

        } catch (err) {
            console.error(err);
            toast.error('Hata', 'Çözüm işaretleme başarısız oldu.');
        }
    };

    // Load replies
    const toggleReplies = async (postId: number) => {
        if (expandedReplies.has(postId)) {
            setExpandedReplies(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
            return;
        }

        setLoadingReplies(prev => new Set(prev).add(postId));

        try {
            const response = await postService.getReplies(postId, { page: 1, pageSize: 20 });
            setPostReplies(prev => new Map(prev).set(postId, response.items));
            setExpandedReplies(prev => new Set(prev).add(postId));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingReplies(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    // Start replying to a post
    const startReply = (postId: number) => {
        setReplyingToPostId(postId);
        setNewPostContent('');
        removeImage();
    };

    // Cancel reply
    const cancelReply = () => {
        setReplyingToPostId(null);
        setNewPostContent('');
        removeImage();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
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

    // TODO: Replace with actual logged-in user ID from auth context
    const currentUserId = 1;
    const isThreadOwner = thread.userId === currentUserId;

    const mainPosts = posts.filter(p => !p.parentPostId);

    return (
        <div className="home-container">
            {/* Header Navigation */}
            <div className="page-header">
                <button onClick={handleBack} className="back-btn">
                    <ArrowLeft size={18} />
                    <span>Foruma Dön</span>
                </button>
            </div>

            <div className="thread-detail-layout">
                {/* Left Side - Thread Content */}
                <div className="thread-content-side">
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
                                        {thread.isSolved && (
                                            <span className="thread-badge solved">
                                                <CheckCircle size={12} className="badge-icon" />
                                                Çözüldü
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
                                    {thread.viewCount}
                                </span>
                                <span className="stat-pill" title="Cevaplar">
                                    <MessageSquare size={16} />
                                    {posts.length}
                                </span>
                            </div>
                        </div>
                    </article>

                    {/* New Comment Form (for main thread) */}
                    {!replyingToPostId && (
                        <div className="main-reply-section">
                            <div className="reply-header">
                                <MessageSquare size={20} className="text-accent" />
                                <h3>Yorum Yaz</h3>
                            </div>
                            <form onSubmit={(e) => handlePostSubmit(e)} className="reply-form">
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="Bu konu hakkında ne düşünüyorsun?"
                                    className="reply-textarea"
                                    rows={4}
                                />

                                {imagePreview && (
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                        <button type="button" className="remove-image-btn" onClick={removeImage}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        className="attach-image-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Image size={18} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !newPostContent.trim()}
                                        className="btn-primary submit-btn"
                                    >
                                        {submitting ? '...' : <Send size={18} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Thread Info Widget */}
                    <div className="widget-card info-widget">
                        <h3>Konu Bilgileri</h3>
                        <div className="info-list">
                            <div className="info-row">
                                <span className="label">Kategori</span>
                                <span className="value">{thread.categoryName || 'Genel'}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Oluşturulma</span>
                                <span className="value">{new Date(thread.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Durum</span>
                                <span className={`status-badge ${thread.isSolved ? 'solved' : 'open'}`}>
                                    {thread.isSolved ? 'Çözüldü' : 'Açık'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Comments */}
                <div className="comments-side">
                    <div className="comments-panel">
                        <div className="comments-panel-header">
                            <MessageSquare size={20} />
                            <h2>Yorumlar</h2>
                            <span className="comments-count">{mainPosts.length}</span>
                        </div>

                        <div className="comments-scroll">
                            {mainPosts.length === 0 ? (
                                <div className="empty-comments">
                                    <MessageSquare size={40} strokeWidth={1} />
                                    <p>Henüz yorum yok</p>
                                    <span>İlk yorumu sen yaz!</span>
                                </div>
                            ) : (
                                mainPosts.map(post => (
                                    <div
                                        key={post.id}
                                        className={`comment-card ${post.isSolution ? 'is-solution' : ''}`}
                                    >
                                        {/* Comment Header */}
                                        <div className="comment-header">
                                            <img
                                                src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.username || 'U'}&background=random&size=32`}
                                                alt={post.author?.username}
                                                className="comment-avatar"
                                            />
                                            <div className="comment-meta">
                                                <span className="comment-author">
                                                    @{post.author?.username || 'Kullanıcı'}
                                                    {post.author?.username === thread.author?.username && (
                                                        <span className="op-badge">OP</span>
                                                    )}
                                                </span>
                                                <span className="comment-time">{formatDate(post.createdAt)}</span>
                                            </div>
                                            {post.isSolution && (
                                                <span className="solution-indicator">
                                                    <CheckCircle size={16} />
                                                    Çözüm
                                                </span>
                                            )}
                                        </div>

                                        {/* Comment Body */}
                                        <div className="comment-body">
                                            {post.content}
                                            {post.img && (
                                                <div className="comment-image">
                                                    <img src={post.img} alt="Post" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Comment Actions */}
                                        <div className="comment-actions">
                                            <button
                                                className={`action-btn upvote ${upvotedPosts.has(post.id) ? 'active' : ''}`}
                                                onClick={() => handleUpvote(post.id)}
                                            >
                                                <ThumbsUp size={14} />
                                                <span>{postUpvotes.get(post.id) || post.upvoteCount}</span>
                                            </button>

                                            <button
                                                className="action-btn reply"
                                                onClick={() => startReply(post.id)}
                                            >
                                                <Reply size={14} />
                                                Yanıtla
                                            </button>

                                            {isThreadOwner && !thread.isSolved && (
                                                <button
                                                    className="action-btn solution"
                                                    onClick={() => handleMarkSolution(post.id)}
                                                >
                                                    <CheckCircle size={14} />
                                                    Çözüm
                                                </button>
                                            )}

                                            {(post.replyCount || 0) > 0 && (
                                                <button
                                                    className="action-btn replies"
                                                    onClick={() => toggleReplies(post.id)}
                                                >
                                                    {loadingReplies.has(post.id) ? (
                                                        '...'
                                                    ) : expandedReplies.has(post.id) ? (
                                                        <>
                                                            <ChevronUp size={14} />
                                                            Gizle
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown size={14} />
                                                            {post.replyCount} yanıt
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Inline Reply Form */}
                                        {replyingToPostId === post.id && (
                                            <div className="inline-reply-form">
                                                <div className="inline-reply-header">
                                                    <span>@{post.author?.username} kullanıcısına yanıt</span>
                                                    <button className="cancel-btn" onClick={cancelReply}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <form onSubmit={(e) => handlePostSubmit(e, post.id)}>
                                                    <textarea
                                                        value={newPostContent}
                                                        onChange={(e) => setNewPostContent(e.target.value)}
                                                        placeholder="Yanıtını yaz..."
                                                        className="inline-reply-textarea"
                                                        rows={3}
                                                        autoFocus
                                                    />
                                                    {imagePreview && (
                                                        <div className="image-preview small">
                                                            <img src={imagePreview} alt="Preview" />
                                                            <button type="button" className="remove-image-btn" onClick={removeImage}>
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="inline-reply-actions">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageSelect}
                                                            style={{ display: 'none' }}
                                                            id={`image-upload-${post.id}`}
                                                        />
                                                        <label htmlFor={`image-upload-${post.id}`} className="attach-btn">
                                                            <Image size={16} />
                                                        </label>
                                                        <button
                                                            type="submit"
                                                            disabled={submitting || !newPostContent.trim()}
                                                            className="send-reply-btn"
                                                        >
                                                            {submitting ? '...' : <><Send size={14} /> Gönder</>}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        {/* Nested Replies */}
                                        {expandedReplies.has(post.id) && postReplies.get(post.id) && (
                                            <div className="nested-replies">
                                                {postReplies.get(post.id)!.map(reply => (
                                                    <div key={reply.id} className="nested-reply">
                                                        <img
                                                            src={reply.author?.avatar || `https://ui-avatars.com/api/?name=${reply.author?.username || 'U'}&background=random&size=24`}
                                                            alt={reply.author?.username}
                                                            className="nested-reply-avatar"
                                                        />
                                                        <div className="nested-reply-content">
                                                            <div className="nested-reply-meta">
                                                                <span className="nested-reply-author">@{reply.author?.username}</span>
                                                                <span className="nested-reply-time">{formatDate(reply.createdAt)}</span>
                                                            </div>
                                                            <p>{reply.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreadDetail;
