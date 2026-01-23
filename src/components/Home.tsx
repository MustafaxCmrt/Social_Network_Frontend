import React from 'react';
import { Search } from 'lucide-react';
import '../styles/Home.css';
import { CategoryCard, ThreadItem } from './Forum';
import { mockCategories, mockThreads } from '../data/mockData';

const Home: React.FC = () => {
    return (
        <div className="home-container">
            {/* Forum Hero Section */}
            <section className="forum-hero">
                <div className="forum-hero-content">
                    <h1 className="forum-title">Topluluk Forumu</h1>
                    <p className="forum-subtitle">
                        Bilgi paylaşın, sorular sorun ve toplulukla etkileşime geçin.
                    </p>
                    <div className="forum-search">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Konu veya mesaj ara..."
                            className="search-input"
                        />
                    </div>
                </div>
            </section>

            {/* Main Forum Layout */}
            <div className="forum-layout">
                {/* Left Sidebar - Categories */}
                <aside className="forum-sidebar">
                    <div className="sidebar-header">
                        <h2>Kategoriler</h2>
                    </div>
                    <div className="category-list">
                        {mockCategories.map(category => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
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
                        <h2>Son Aktiviteler</h2>
                        <div className="feed-tabs">
                            <button className="feed-tab active">Hepsi</button>
                            <button className="feed-tab">Popüler</button>
                            <button className="feed-tab">Cevapsız</button>
                        </div>
                    </div>

                    <div className="thread-list">
                        {mockThreads.map(thread => (
                            <ThreadItem key={thread.id} thread={thread} />
                        ))}
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
