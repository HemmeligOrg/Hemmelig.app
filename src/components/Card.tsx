import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    noPadding?: boolean;
}

export function Card({ children, className = '', hover = false, noPadding = false }: CardProps) {
    const hoverStyles = hover
        ? 'transition-shadow duration-300 hover:shadow-xl hover:shadow-gray-300/50 dark:hover:shadow-dark-900/70'
        : '';
    const paddingStyles = noPadding ? '' : 'p-5 sm:p-8';

    return (
        <div
            className={`relative bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-lg shadow-gray-200/50 dark:shadow-dark-900/50 ${paddingStyles} ${hoverStyles} ${className}`}
        >
            {children}
        </div>
    );
}
