import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    noPadding?: boolean;
}

export function Card({ children, className = '', hover = false, noPadding = false }: CardProps) {
    const hoverStyles = hover ? 'transition-shadow duration-300 hover:shadow-xl' : '';
    const paddingStyles = noPadding ? '' : 'p-5 sm:p-8';

    return (
        <div
            className={`relative bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-sm ${paddingStyles} ${hoverStyles} ${className}`}
        >
            {children}
        </div>
    );
}
