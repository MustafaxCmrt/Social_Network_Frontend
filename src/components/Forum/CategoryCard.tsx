import React from 'react';
import { MessageSquare, Folder, Edit2, Trash2 } from 'lucide-react';
import type { Category } from '../../types/category';

interface CategoryCardProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit, onDelete }) => {
    return (
        <div className="category-card group">
            <div className="category-icon">
                <Folder size={24} />
            </div>
            <div className="category-content">
                <div className="flex justify-between items-start">
                    <h3>{category.title}</h3>
                    <div className="category-actions">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
                            className="action-btn edit-btn"
                            title="Düzenle"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(category); }}
                            className="action-btn delete-btn"
                            title="Sil"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {category.description && <p>{category.description}</p>}
                <div className="category-stats">
                    <div className="stat-item">
                        <MessageSquare size={14} />
                        <span>{category.threadCount} Konu</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
