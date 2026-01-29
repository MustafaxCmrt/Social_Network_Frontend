import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import type { CreateCategoryDto, UpdateCategoryDto, Category } from '../../types/category';
import '../../styles/Auth.css'; // Using existing form styles

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
    editCategory?: Category | null;
    categories?: Category[];
    parentCategoryId?: number | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    editCategory, 
    categories = [],
    parentCategoryId = null 
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editCategory) {
            setTitle(editCategory.title);
            setDescription(editCategory.description || '');
            setSelectedParentId(editCategory.parentCategoryId || null);
        } else {
            setTitle('');
            setDescription('');
            setSelectedParentId(parentCategoryId);
        }
        setError(null);
    }, [editCategory, isOpen, parentCategoryId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!title.trim()) {
            setError('Kategori başlığı zorunludur.');
            return;
        }
        if (title.length < 3) {
            setError('Kategori başlığı en az 3 karakter olmalıdır.');
            return;
        }
        if (title.length > 100) {
            setError('Kategori başlığı en fazla 100 karakter olabilir.');
            return;
        }
        if (description.length > 500) {
            setError('Açıklama en fazla 500 karakter olabilir.');
            return;
        }

        setLoading(true);
        try {
            const data = editCategory
                ? { 
                    id: editCategory.id, 
                    title, 
                    description,
                    parentCategoryId: selectedParentId || undefined
                } as UpdateCategoryDto
                : { 
                    title, 
                    description,
                    parentCategoryId: selectedParentId || undefined
                } as CreateCategoryDto;

            await onSubmit(data);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Ana kategorileri filtrele (edit edilen kategori hariç)
    const rootCategories = categories.filter(cat => 
        !cat.parentCategoryId && (!editCategory || cat.id !== editCategory.id)
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                parentCategoryId 
                    ? 'Yeni Alt Kategori Ekle' 
                    : editCategory 
                        ? 'Kategoriyi Düzenle' 
                        : 'Yeni Kategori Ekle'
            }
        >
            <form onSubmit={handleSubmit} className="modal-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label htmlFor="parentCategory">Kategori Tipi</label>
                    <div className="input-wrapper">
                        <select
                            className="modal-input"
                            id="parentCategory"
                            value={selectedParentId || ''}
                            onChange={(e) => setSelectedParentId(e.target.value ? Number(e.target.value) : null)}
                            disabled={loading || !!parentCategoryId}
                        >
                            <option value="">🏠 Ana Kategori</option>
                            {rootCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    📁 {cat.title} altına ekle
                                </option>
                            ))}
                        </select>
                    </div>
                    <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                        {selectedParentId ? 'Bu, seçilen kategorinin alt kategorisi olacak' : 'Bu, ana düzey bir kategori olacak'}
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="title">Başlık</label>
                    <div className="input-wrapper">
                        <input
                            className="modal-input"
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Kategori adı..."
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Açıklama</label>
                    <div className="input-wrapper">
                        <textarea
                            className="modal-textarea"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Kategori açıklaması (opsiyonel)..."
                            rows={4}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Kaydediliyor...' : (editCategory ? 'Güncelle' : 'Oluştur')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
