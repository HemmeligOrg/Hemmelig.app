import React from 'react';
import { X } from 'lucide-react';

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
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-dark-800 shadow-xl p-5 w-full max-w-md">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-slate-300 text-sm mb-4">{children}</div>
                <div className="flex justify-end space-x-3">
                    {cancelText && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-dark-700 text-white hover:bg-dark-600 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    {onConfirm && confirmText && (
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-white transition-colors ${confirmButtonClass}`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
