import React, { useState } from 'react';
import { MessageSquare, Edit2, Trash2, ChevronDown, ChevronRight, Plus, Layers } from 'lucide-react';
import type { Category } from '../../types/category';

interface CategoryCardProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    onAddSubcategory?: (parentCategory: Category) => void;
    level?: number;
}

// Gradient renkler kategoriye göre
const categoryColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
    category, 
    onEdit, 
    onDelete, 
    onAddSubcategory,
    level = 0 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasSubcategories = category.subCategories && category.subCategories.length > 0;
    
    // Kategori ID'sine göre renk seç
    const colorIndex = category.id % categoryColors.length;
    const gradient = categoryColors[colorIndex];

    return (
        <div className="category-card-wrapper" style={{ marginLeft: `${level * 1.2}rem` }}>
            <div className={`category-card-modern ${level > 0 ? 'subcategory' : ''}`}>
                {/* Sol Gradient Bar */}
                <div className="category-gradient-bar" style={{ background: gradient }} />
                
                {/* İçerik */}
                <div className="category-card-body">
                    <div className="category-header-row">
                        <div className="category-title-section">
                            {hasSubcategories && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                    className="expand-toggle"
                                    title={isExpanded ? 'Daralt' : 'Genişlet'}
                                >
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                            )}
                            <div className="title-with-badge">
                                <h3 className="category-title-text">{category.title}</h3>
                                {hasSubcategories && (
                                    <span className="subcategory-badge">
                                        <Layers size={12} />
                                        {category.subCategoryCount}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="category-actions">
                            {level === 0 && onAddSubcategory && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddSubcategory(category); }}
                                    className="action-btn add-btn"
                                    title="Alt Kategori Ekle"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
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

                    {category.description && (
                        <p className="category-description-text">{category.description}</p>
                    )}

                    <div className="category-footer">
                        <div className="thread-count-badge">
                            <MessageSquare size={14} />
                            <span>{category.threadCount} Konu</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alt Kategoriler */}
            {isExpanded && hasSubcategories && (
                <div className="subcategories-list">
                    {category.subCategories!.map(subcat => (
                        <CategoryCard
                            key={subcat.id}
                            category={subcat}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
