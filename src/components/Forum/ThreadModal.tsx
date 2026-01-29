import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import type { CreateThreadDto, UpdateThreadDto, Thread } from '../../types/thread';
import type { Category } from '../../types/category';
import { categoryService } from '../../services/categoryService';
import '../../styles/Auth.css';
import '../../styles/Modal.css';

interface ThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateThreadDto | UpdateThreadDto) => Promise<void>;
    editThread?: Thread | null;
}

interface FlatCategory extends Category {
    level: number; // Kategori seviyesi (0 = ana, 1 = alt, 2 = alt-alt)
}

// Tree yapısını düz listeye çevir
const flattenCategories = (categories: Category[], level: number = 0): FlatCategory[] => {
    let result: FlatCategory[] = [];
    
    categories.forEach(category => {
        result.push({ ...category, level });
        
        if (category.subCategories && category.subCategories.length > 0) {
            result = result.concat(flattenCategories(category.subCategories, level + 1));
        }
    });
    
    return result;
};

export const ThreadModal: React.FC<ThreadModalProps> = ({ isOpen, onClose, onSubmit, editThread }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState<number>(0);
    const [categories, setCategories] = useState<FlatCategory[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch tree and flatten for the select box
        const loadCategories = async () => {
            try {
                const treeData = await categoryService.getTree();
                const flatData = flattenCategories(treeData);
                setCategories(flatData);
                if (flatData.length > 0 && !editThread) {
                    setCategoryId(flatData[0].id);
                }
            } catch (err) {
                console.error("Kategoriler yüklenemedi", err);
            }
        };

        if (isOpen) {
            loadCategories();
        }
    }, [isOpen, editThread]);

    useEffect(() => {
        if (editThread) {
            setTitle(editThread.title);
            setContent(editThread.content);
            setCategoryId(editThread.categoryId);
        } else {
            setTitle('');
            setContent('');
            if (categories.length > 0) setCategoryId(categories[0].id);
        }
        setError(null);
    }, [editThread, isOpen, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (!title.trim()) {
            setError('Konu başlığı zorunludur.');
            return;
        }
        if (title.length < 3) {
            setError('Konu başlığı en az 3 karakter olmalıdır.');
            return;
        }
        if (title.length > 150) {
            setError('Konu başlığı en fazla 150 karakter olabilir.');
            return;
        }

        if (!content.trim()) {
            setError('İçerik zorunludur.');
            return;
        }
        if (content.length < 10) {
            setError('İçerik en az 10 karakter olmalıdır.');
            return;
        }

        if (categoryId <= 0) {
            setError('Lütfen geçerli bir kategori seçiniz.');
            return;
        }

        setLoading(true);
        try {
            const data = editThread
                ? { id: editThread.id, title, content, categoryId } as UpdateThreadDto
                : { title, content, categoryId } as CreateThreadDto;

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
            title={editThread ? 'Konuyu Düzenle' : 'Yeni Konu Aç'}
        >
            <form onSubmit={handleSubmit} className="modal-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label htmlFor="title">Konu Başlığı</label>
                    <div className="input-wrapper">
                        <input
                            className="modal-input"
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Konu başlığı..."
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="category">Kategori</label>
                    <div className="input-wrapper">
                        <select
                            className="modal-input"
                            id="category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(Number(e.target.value))}
                            disabled={loading}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value={0} disabled>Kategori Seçiniz</option>
                            {categories.map(cat => {
                                // Seviyeye göre girintili gösterim
                                const indent = '  '.repeat(cat.level) + (cat.level > 0 ? '└─ ' : '');
                                return (
                                    <option key={cat.id} value={cat.id}>
                                        {indent}{cat.title}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="content">İçerik</label>
                    <div className="input-wrapper">
                        <textarea
                            className="modal-textarea"
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Konu içeriği..."
                            rows={6}
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
                        {loading ? 'Kaydediliyor...' : (editThread ? 'Güncelle' : 'Oluştur')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
