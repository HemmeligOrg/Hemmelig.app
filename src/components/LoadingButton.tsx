import { type ReactNode } from 'react';
import { Button } from './Button';

interface LoadingButtonProps {
    type?: 'button' | 'submit';
    isLoading: boolean;
    disabled?: boolean;
    loadingText: string;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

/** A full-width primary button that shows a spinner and a text while it loads. */
export function LoadingButton({
    type = 'submit',
    isLoading,
    disabled = false,
    loadingText,
    children,
    onClick,
    className = '',
}: LoadingButtonProps) {
    return (
        <Button
            type={type}
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={disabled}
            onClick={onClick}
            className={`w-full ${className}`}
        >
            {isLoading ? loadingText : children}
        </Button>
    );
}
