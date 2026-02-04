import React, { useEffect, useState } from 'react';
import { Plus, Building2, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import { CategoryCard, ThreadItem, ReportModal } from './Forum';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category';
import { categoryService } from '../services/categoryService';
import { CategoryModal } from './Forum/CategoryModal';
import { ThreadModal } from './Forum/ThreadModal';
import { DeleteConfirmModal } from './Forum/DeleteConfirmModal';
import type { Thread, CreateThreadDto, UpdateThreadDto } from '../types/thread';
import { threadService } from '../services/threadService';
import { useAuth } from '../context/AuthContext';
import { clubService } from '../services/clubService';
import type { Club } from '../types/club';

// Tree yapısını düz listeye çevir
const flattenTree = (categories: Category[]): Category[] => {
    let result: Category[] = [];
    
    categories.forEach(category => {
        // Ana kategoriyi ekle
        result.push(category);
        
        // Alt kategorileri ekle
        if (category.subCategories && category.subCategories.length > 0) {
            result = result.concat(flattenTree(category.subCategories));
        }
    });
    
    return result;
};

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const currentUserId = user?.userId;

    const [categories, setCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Clubs state (all clubs)
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [clubsLoading, setClubsLoading] = useState(false);
    const [clubsTotalCount, setClubsTotalCount] = useState(0);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [parentCategoryIdForNew, setParentCategoryIdForNew] = useState<number | null>(null);

    // Report State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<{
        threadId?: number;
        name?: string;
    }>({});

    const fetchCategories = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            
            const paginatedData = await categoryService.getPaginated({
                page,
                pageSize,
                parentCategoryId: null // Sadece ana kategorileri getir
            });
            
            // Alt kategorileri de yükle
            const categoriesWithSubs = await Promise.all(
                paginatedData.items.map(async (category) => {
                    if (category.subCategoryCount > 0) {
                        const subs = await categoryService.getSubcategories(category.id);
                        return { ...category, subCategories: subs };
                    }
                    return category;
                })
            );

            setCategories(categoriesWithSubs);
            setCurrentPage(paginatedData.page);
            setTotalPages(paginatedData.totalPages);
            setTotalCount(paginatedData.totalCount);
            
            // Modal için tüm kategorileri al (tree'den flatten)
            const treeData = await categoryService.getTree();
            const flatData = flattenTree(treeData);
            setAllCategories(flatData);
            
            setError(null);
        } catch (err: any) {
            // 401 hatası - token sorunu, AuthContext handle edecek
            // Don't show error or update state, let AuthContext handle it
            if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('Oturum')) {
                console.log('Unauthorized - token refresh will be handled by AuthContext');
                setLoading(false);
                return;
            }
            
            setError('Kategoriler yüklenirken bir hata oluştu.');
            console.error('Category fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            if (isMounted) {
                await fetchCategories();
                await loadAllClubs();
            }
        };
        
        loadData();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const loadAllClubs = async () => {
        setClubsLoading(true);
        try {
            const response = await clubService.getAll(1, 10); // İlk 10 kulüp
            setAllClubs(response.items);
            setClubsTotalCount(response.totalCount);
        } catch (error: any) {
            // 401 hatası - token sorunu, AuthContext handle edecek
            // Don't show error or update state, let AuthContext handle it
            if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Oturum')) {
                console.log('Unauthorized - token refresh will be handled by AuthContext');
                setClubsLoading(false);
                return;
            }
            console.error('Failed to load clubs:', error);
        } finally {
            setClubsLoading(false);
        }
    };

    const handleCreateCategory = () => {
        setSelectedCategory(null);
        setParentCategoryIdForNew(null);
        setIsCategoryModalOpen(true);
    };

    const handleAddSubcategory = (parentCategory: Category) => {
        setSelectedCategory(null);
        setParentCategoryIdForNew(parentCategory.id);
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setParentCategoryIdForNew(null);
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const handleModalSubmit = async (data: CreateCategoryDto | UpdateCategoryDto) => {
        if ('id' in data) {
            await categoryService.update(data as UpdateCategoryDto);
        } else {
            await categoryService.create(data as CreateCategoryDto);
        }
        await fetchCategories(currentPage);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchCategories(newPage);
            // Scroll to top of category list
            document.querySelector('.category-list')?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Thread States
    const [threads, setThreads] = useState<Thread[]>([]);
    const [threadLoading, setThreadLoading] = useState(true);
    const [threadError, setThreadError] = useState<string | null>(null);
    const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
    const [isDeleteThreadModalOpen, setIsDeleteThreadModalOpen] = useState(false);
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);

    const fetchThreads = async () => {
        setThreadLoading(true);
        try {
            setThreadError(null);
            
            // Sadece genel forum konularını getir (kulüp konularını filtrele)
            const response = await threadService.getAll({ 
                page: 1, 
                pageSize: 20 
            });
            // Frontend'de kulüp konularını filtrele (clubId null veya undefined olanlar)
            const generalThreads = response.items.filter(thread => 
                !thread.clubId || thread.clubId === null
            );
            setThreads(generalThreads);
            setThreadError(null);
        } catch (err: any) {
            // 401 hatası - token sorunu, AuthContext handle edecek
            // Don't show error or update state, let AuthContext handle it
            if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('Oturum')) {
                console.log('Unauthorized - token refresh will be handled by AuthContext');
                setThreadLoading(false);
                return;
            }
            
            setThreadError('Konular yüklenirken bir hata oluştu.');
            console.error('Thread fetch error:', err);
        } finally {
            setThreadLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadThreads = async () => {
            if (isMounted) {
                await fetchThreads();
            }
        };
        
        loadThreads();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const handleCreateThread = () => {
        setSelectedThread(null);
        setIsThreadModalOpen(true);
    };

    const handleEditThread = (thread: Thread) => {
        setSelectedThread(thread);
        setIsThreadModalOpen(true);
    };

    const handleDeleteThread = (thread: Thread) => {
        setSelectedThread(thread);
        setIsDeleteThreadModalOpen(true);
    };

    const handleReportThread = (thread: Thread) => {
        setReportTarget({
            threadId: thread.id,
            name: thread.title
        });
        setIsReportModalOpen(true);
    };

    const handleThreadModalSubmit = async (data: CreateThreadDto | UpdateThreadDto) => {
        if ('id' in data) {
            await threadService.update(data as UpdateThreadDto);
        } else {
            // Genel forumdan oluşturulduğu için clubId null olmalı
            const threadData: CreateThreadDto = {
                ...data,
                clubId: null // Genel forum - clubId null
            };
            await threadService.create(threadData);
        }
        await fetchThreads();
    };

    const handleConfirmThreadDelete = async () => {
        if (selectedThread) {
            await threadService.delete(selectedThread.id);
            await fetchThreads();
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedCategory) {
            await categoryService.delete(selectedCategory.id);
            // Eğer sayfada tek kategori kaldıysa ve son sayfa değilse, bir önceki sayfaya git
            if (categories.length === 1 && currentPage > 1) {
                await fetchCategories(currentPage - 1);
            } else {
                await fetchCategories(currentPage);
            }
        }
    };

    return (
        <div className="home-container">
            {/* Modals */}
            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setParentCategoryIdForNew(null);
                }}
                onSubmit={handleModalSubmit}
                editCategory={selectedCategory}
                categories={allCategories}
                parentCategoryId={parentCategoryIdForNew}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={selectedCategory?.title || ''}
            />

            <ThreadModal
                isOpen={isThreadModalOpen}
                onClose={() => setIsThreadModalOpen(false)}
                onSubmit={handleThreadModalSubmit}
                editThread={selectedThread}
            />

            <DeleteConfirmModal
                isOpen={isDeleteThreadModalOpen}
                onClose={() => setIsDeleteThreadModalOpen(false)}
                onConfirm={handleConfirmThreadDelete}
                itemName={selectedThread?.title || ''}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => {
                    setIsReportModalOpen(false);
                    setReportTarget({});
                }}
                reportedThreadId={reportTarget.threadId}
                targetName={reportTarget.name}
            />

            {/* Main Forum Layout */}
            <div className="forum-layout">
                {/* Left Sidebar - Categories */}
                <aside className="forum-sidebar">
                    <div className="sidebar-header-modern">
                        <div className="sidebar-title-section">
                            <div className="sidebar-icon-wrapper">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 7C3 5.89543 3.89543 5 5 5H9C10.1046 5 11 5.89543 11 7V11C11 12.1046 10.1046 13 9 13H5C3.89543 13 3 12.1046 3 11V7Z" fill="url(#gradient1)"/>
                                    <path d="M13 7C13 5.89543 13.8954 5 15 5H19C20.1046 5 21 5.89543 21 7V11C21 12.1046 20.1046 13 19 13H15C13.8954 13 13 12.1046 13 11V7Z" fill="url(#gradient2)"/>
                                    <path d="M3 17C3 15.8954 3.89543 15 5 15H9C10.1046 15 11 15.8954 11 17V19C11 20.1046 10.1046 21 9 21H5C3.89543 21 3 20.1046 3 19V17Z" fill="url(#gradient3)"/>
                                    <defs>
                                        <linearGradient id="gradient1" x1="3" y1="5" x2="11" y2="13" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#667eea"/>
                                            <stop offset="1" stopColor="#764ba2"/>
                                        </linearGradient>
                                        <linearGradient id="gradient2" x1="13" y1="5" x2="21" y2="13" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#f093fb"/>
                                            <stop offset="1" stopColor="#f5576c"/>
                                        </linearGradient>
                                        <linearGradient id="gradient3" x1="3" y1="15" x2="11" y2="21" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#4facfe"/>
                                            <stop offset="1" stopColor="#00f2fe"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <h2>Kategoriler</h2>
                        </div>
                        <button
                            className="create-category-btn"
                            onClick={handleCreateCategory}
                            title="Yeni Kategori Oluştur"
                        >
                            <Plus size={18} />
                            <span>Yeni</span>
                        </button>
                    </div>
                    <div className="category-list">
                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <span>Kategoriler yükleniyor...</span>
                            </div>
                        ) : error ? (
                            <div className="error-state">{error}</div>
                        ) : categories.length === 0 ? (
                            <div className="empty-state">
                                <span>Henüz kategori eklenmemiş</span>
                            </div>
                        ) : (
                            categories.map(category => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onEdit={handleEditCategory}
                                    onDelete={handleDeleteCategory}
                                    onAddSubcategory={handleAddSubcategory}
                                />
                            ))
                        )}
                    </div>

                    {/* Pagination - Her zaman göster */}
                    {!loading && !error && (
                        <div className="category-pagination">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                                title="Önceki Sayfa"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>

                            <div className="pagination-info-center">
                                <span className="page-indicator">
                                    Sayfa <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
                                </span>
                                <span className="total-count">({totalCount} kategori)</span>
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                                title="Sonraki Sayfa"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    )}
                </aside>

                {/* Main Content - Threads */}
                <main className="forum-main">
                    <div className="feed-header">
                        <div className="flex justify-between items-center mb-4">
                            <h2>Son Aktiviteler</h2>
                            <button
                                className="btn-primary flex items-center gap-2"
                                onClick={handleCreateThread}
                                style={{ padding: '0.6rem 1.2rem', fontSize: '0.95rem' }}
                            >
                                <Plus size={18} />
                                Yeni Konu
                            </button>
                        </div>
                        <div className="feed-tabs">
                            <button className="feed-tab active">Hepsi</button>
                            <button className="feed-tab">Popüler</button>
                            <button className="feed-tab">Cevapsız</button>
                        </div>
                    </div>

                    <div className="thread-list">
                        {threadLoading ? (
                            <div className="loading-state">Konular yükleniyor...</div>
                        ) : threadError ? (
                            <div className="error-state">{threadError}</div>
                        ) : (
                            threads.map(thread => (
                                <ThreadItem
                                    key={thread.id}
                                    thread={thread}
                                    currentUserId={currentUserId}
                                    onEdit={handleEditThread}
                                    onDelete={handleDeleteThread}
                                    onReport={handleReportThread}
                                />
                            ))
                        )}
                        {threads.length === 0 && !threadLoading && (
                            <div className="empty-state">Henüz hiç konu açılmamış.</div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar - Clubs & Trending */}
                <aside className="forum-right-panel">
                    {/* Clubs Widget - All Clubs */}
                    <div className="widget-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building2 size={18} style={{ color: 'var(--accent-color)' }} />
                                Kulüpler
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {clubsTotalCount}
                            </span>
                        </div>
                        
                        {clubsLoading ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Yükleniyor...
                            </div>
                        ) : allClubs.length === 0 ? (
                            <div style={{ 
                                padding: '1.5rem', 
                                textAlign: 'center', 
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem'
                            }}>
                                <Building2 size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p style={{ margin: 0 }}>Henüz hiç kulüp oluşturulmamış</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '0.75rem',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    paddingRight: '0.5rem',
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'rgba(99, 102, 241, 0.3) transparent'
                                }} className="clubs-scroll-container">
                                    {allClubs.map((club) => (
                                        <div
                                            key={club.id}
                                            onClick={() => navigate(`/club/${club.id}`)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--navbar-border)',
                                                background: 'var(--bg-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                e.currentTarget.style.transform = 'translateX(4px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                                e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            {club.logoUrl ? (
                                                <img 
                                                    src={club.logoUrl} 
                                                    alt={club.name}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        objectFit: 'cover',
                                                        flexShrink: 0
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem',
                                                    flexShrink: 0
                                                }}>
                                                    {club.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontWeight: 600, 
                                                    fontSize: '0.9rem',
                                                    color: 'var(--text-primary)',
                                                    marginBottom: '0.25rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {club.name}
                                                </div>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    <Users size={12} />
                                                    <span>{club.memberCount} üye</span>
                                                    {club.isPublic ? (
                                                        <span style={{
                                                            padding: '0.15rem 0.5rem',
                                                            borderRadius: '4px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            color: '#10b981',
                                                            fontSize: '0.7rem'
                                                        }}>
                                                            Açık
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            padding: '0.15rem 0.5rem',
                                                            borderRadius: '4px',
                                                            background: 'rgba(245, 158, 11, 0.1)',
                                                            color: '#f59e0b',
                                                            fontSize: '0.7rem'
                                                        }}>
                                                            Özel
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                        </div>
                                    ))}
                                </div>
                                {clubsTotalCount > allClubs.length && (
                                    <button
                                        onClick={() => navigate('/clubs')}
                                        style={{
                                            marginTop: '0.75rem',
                                            width: '100%',
                                            padding: '0.5rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--navbar-border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-secondary)';
                                            e.currentTarget.style.borderColor = 'var(--navbar-border)';
                                        }}
                                    >
                                        Tümünü Gör ({clubsTotalCount} kulüp)
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Home;
