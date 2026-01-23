import React from 'react';
import type { Category } from '../../data/mockData';

interface CategoryCardProps {
    category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
    return (
        <div className="category-card">
            <div className="category-header">
                <div className={`category-icon ${category.color}`}>
                    {category.icon}
                </div>
                <div className="category-info">
                    <h3 className="category-title">{category.title}</h3>
                    <p className="category-description">{category.description}</p>
                </div>
            </div>
            <div className="category-stats">
                <span className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                    {category.topicCount} Konu
                </span>
                <span className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                    {category.postCount} Mesaj
                </span>
            </div>
        </div>
    );
};
