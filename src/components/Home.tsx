import React from 'react';
import { Search } from 'lucide-react';
import '../styles/Home.css';

const Home: React.FC = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Tüm yaratıcı projeleriniz için <br /> yüksek kaliteli kaynaklar</h1>
                    <p className="hero-subtitle">
                        Milyonlarca Vektör, Stok Fotoğraf, PSD, İkon ve daha fazlasını keşfedin.
                    </p>

                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Tüm kaynaklarda arayın..."
                                className="search-input"
                            />
                            <button className="search-button">
                                Ara
                            </button>
                        </div>

                        <div className="hero-tags">
                            <span className="tag-badge">Vektörler</span>
                            <span className="tag-badge">Fotoğraflar</span>
                            <span className="tag-badge">PSD</span>
                            <span className="tag-badge">İkonlar</span>
                            <span className="tag-badge">3D</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Example Content Section */}
            <section className="content-section">
                <div className="section-header">
                    <h2 className="section-title">Popüler Kategoriler</h2>
                </div>

                <div className="grid-container">
                    {/* Placeholders for content cards */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <div key={item} className="grid-item">
                            <span>İçerik #{item}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
