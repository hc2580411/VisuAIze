import React, { useEffect, useState, memo, useCallback } from 'react';
import './Toast.css';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Move icons outside component to prevent recreation on every render
const TOAST_ICONS = {
    error: <AlertCircle size={20} color="#ef4444" />,
    success: <CheckCircle size={20} color="#10b981" />,
    info: <Info size={20} color="#6366f1" />,
    warning: <AlertCircle size={20} color="#f59e0b" />
};

const Toast = memo(({ id, message, type = 'info', onClose, duration = 4000 }) => {
    const [isExiting, setIsExiting] = useState(false);

    // Handle the exit animation before closing
    const handleClose = useCallback(() => {
        setIsExiting(true);
        // Wait for animation to complete before actually removing
        setTimeout(() => {
            onClose(id);
        }, 300); // Match animation duration
    }, [id, onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, handleClose]);

    return (
        <div className={`toast toast-${type} ${isExiting ? 'slide-out' : 'slide-in'}`}>
            <div className="toast-icon">{TOAST_ICONS[type] || TOAST_ICONS.info}</div>
            <p className="toast-message">{message}</p>
            <button className="toast-close" onClick={handleClose} aria-label="Close notification">
                <X size={16} />
            </button>
        </div>
    );
});

Toast.displayName = 'Toast';

export default Toast;
