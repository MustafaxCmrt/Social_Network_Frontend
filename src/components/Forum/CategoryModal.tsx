import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import type { CreateCategoryDto, UpdateCategoryDto, Category } from '../../types/category';
import '../../styles/Auth.css'; // Using existing form styles

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
    editCategory?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSubmit, editCategory }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editCategory) {
            setTitle(editCategory.title);
            setDescription(editCategory.description || '');
        } else {
            setTitle('');
            setDescription('');
        }
        setError(null);
    }, [editCategory, isOpen]);

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
                ? { id: editCategory.id, title, description } as UpdateCategoryDto
                : { title, description } as CreateCategoryDto;

            await onSubmit(data);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
        >
            <form onSubmit={handleSubmit} className="modal-form">
                {error && <div className="error-message">{error}</div>}

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
