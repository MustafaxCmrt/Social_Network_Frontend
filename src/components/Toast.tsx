import React from 'react';
import { useToast, type Toast as ToastType } from '../context/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import '../styles/Toast.css';

const ToastIcon: React.FC<{ type: ToastType['type'] }> = ({ type }) => {
    switch (type) {
        case 'success':
            return <CheckCircle size={20} />;
        case 'error':
            return <XCircle size={20} />;
        case 'warning':
            return <AlertTriangle size={20} />;
        case 'info':
            return <Info size={20} />;
    }
};

const ToastItem: React.FC<{ toast: ToastType; onClose: () => void }> = ({ toast, onClose }) => {
    return (
        <div className={`toast-item toast-${toast.type}`}>
            <div className="toast-icon">
                <ToastIcon type={toast.type} />
            </div>
            <div className="toast-content">
                <h4 className="toast-title">{toast.title}</h4>
                {toast.message && <p className="toast-message">{toast.message}</p>}
            </div>
            <button className="toast-close" onClick={onClose}>
                <X size={16} />
            </button>
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
