import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText,
    cancelText,
    confirmButtonClass = 'bg-red-500 hover:bg-red-600',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-xl p-4 w-full max-w-sm">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-gray-600 dark:text-slate-300 text-xs mb-4">{children}</div>
                <div className="flex justify-end gap-2">
                    {cancelText && (
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    {onConfirm && confirmText && (
                        <button
                            onClick={onConfirm}
                            className={`px-3 py-1.5 text-xs font-medium text-white transition-colors ${confirmButtonClass}`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
