import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import '../styles/Home.css';
import { CategoryCard, ThreadItem } from './Forum';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/category';
import { categoryService } from '../services/categoryService';
import { CategoryModal } from './Forum/CategoryModal';
import { ThreadModal } from './Forum/ThreadModal';
import { DeleteConfirmModal } from './Forum/DeleteConfirmModal';
import type { Thread, CreateThreadDto, UpdateThreadDto } from '../types/thread';
import { threadService } from '../services/threadService';
const Home: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
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
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
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
        await fetchCategories();
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
            await fetchCategories();
        }
    };

    return (
        <div className="home-container">
            {/* Modals */}
            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSubmit={handleModalSubmit}
                editCategory={selectedCategory}
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

            {/* Forum Hero Section */}
            {/* Forum Hero Section */}
            <section className="forum-hero">
                <div className="forum-hero-content">
                    <h1 className="forum-title">Topluluk Forumu</h1>
                    <p className="forum-subtitle">
                        Bilgi paylaşın, sorular sorun ve toplulukla etkileşime geçin.
                    </p>

                </div>
            </section>

            {/* Main Forum Layout */}
            <div className="forum-layout">
                {/* Left Sidebar - Categories */}
                <aside className="forum-sidebar">
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Kategoriler</h2>
                        <button
                            className="btn-icon-primary"
                            onClick={handleCreateCategory}
                            title="Yeni Kategori"
                            style={{
                                padding: '0.5rem',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="category-list">
                        {loading ? (
                            <div className="loading-state">Yükleniyor...</div>
                        ) : error ? (
                            <div className="error-state">{error}</div>
                        ) : (
                            categories.map(category => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onEdit={handleEditCategory}
                                    onDelete={handleDeleteCategory}
                                />
                            ))
                        )}
                    </div>

                    <div className="sidebar-widget mt-6">
                        <h3>İstatistikler</h3>
                        <div className="stat-row">
                            <span>Üyeler</span>
                            <strong>1,204</strong>
                        </div>
                        <div className="stat-row">
                            <span>Konular</span>
                            <strong>3,540</strong>
                        </div>
                        <div className="stat-row">
                            <span>Mesajlar</span>
                            <strong>12,402</strong>
                        </div>
                    </div>
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
                                    onEdit={handleEditThread}
                                    onDelete={handleDeleteThread}
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
