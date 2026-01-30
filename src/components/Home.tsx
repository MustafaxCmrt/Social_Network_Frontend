import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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
    const currentUserId = user?.userId;

    const [categories, setCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
            setError('Kategoriler yüklenirken bir hata oluştu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

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
            const response = await threadService.getAll();
            setThreads(response.items);
            setThreadError(null);
        } catch (err) {
            setThreadError('Konular yüklenirken bir hata oluştu.');
            console.error(err);
        } finally {
            setThreadLoading(false);
        }
    };

    useEffect(() => {
        fetchThreads();
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
            await threadService.create(data as CreateThreadDto);
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

                {/* Right Sidebar - Trending (Optional/Desktop) */}
                <aside className="forum-right-panel">
                    <div className="widget-card">
                        <h3>Popüler Etiketler</h3>
                        <div className="tags-cloud">
                            <span className="tag">#yazılım</span>
                            <span className="tag">#tasarım</span>
                            <span className="tag">#react</span>
                            <span className="tag">#oyun</span>
                            <span className="tag">#donanım</span>
                            <span className="tag">#kariyer</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Home;
