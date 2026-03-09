import { type ReactNode } from 'react';

interface LoadingButtonProps {
    type?: 'button' | 'submit';
    isLoading: boolean;
    disabled?: boolean;
    loadingText: string;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function LoadingButton({
    type = 'submit',
    isLoading,
    disabled = false,
    loadingText,
    children,
    onClick,
    className = '',
}: LoadingButtonProps) {
    const isDisabled = isLoading || disabled;

    return (
        <button
            type={type}
            disabled={isDisabled}
            onClick={onClick}
            className={`
                w-full flex items-center justify-center space-x-3 py-3 px-4 font-semibold transition-all duration-200
                ${
                    isDisabled
                        ? 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-teal-500 hover:bg-teal-600 text-white'
                }
                focus:outline-none focus:ring-4 focus:ring-teal-500/30
                ${className}
            `}
        >
            {isLoading ? (
                <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>{loadingText}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
