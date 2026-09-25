import { X } from 'lucide-react';
import React from 'react';
import { Button, type ButtonVariant } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    /** The style of the confirm button. The default is `danger-solid`. */
    confirmVariant?: ButtonVariant;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText,
    cancelText,
    confirmVariant = 'danger-solid',
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="bg-surface border border-line rounded-md shadow-2xl w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center gap-3 px-4.5 py-3.5 border-b border-line-soft">
                    <h2 className="m-0 text-sm font-medium">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1 text-muted hover:text-fg transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-4.5 py-4 text-ui text-fg-3">{children}</div>
                {(cancelText || (onConfirm && confirmText)) && (
                    <div className="flex justify-end gap-2 px-4.5 pb-4">
                        {cancelText && (
                            <Button variant="secondary" size="sm" onClick={onClose}>
                                {cancelText}
                            </Button>
                        )}
                        {onConfirm && confirmText && (
                            <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
                                {confirmText}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
