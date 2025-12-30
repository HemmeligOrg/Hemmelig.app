import { ReactNode } from 'react';

type GradientVariant = 'teal' | 'green' | 'purple' | 'amber' | 'none';

interface CardProps {
    children: ReactNode;
    gradient?: GradientVariant;
    className?: string;
    hover?: boolean;
    noPadding?: boolean;
}

const gradientStyles: Record<GradientVariant, string> = {
    teal: 'bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500',
    green: 'bg-gradient-to-r from-green-500 via-teal-500 to-green-500',
    purple: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500',
    amber: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500',
    none: '',
};

export function Card({
    children,
    gradient = 'none',
    className = '',
    hover = false,
    noPadding = false,
}: CardProps) {
    const hoverStyles = hover
        ? 'transition-shadow duration-300 hover:shadow-xl hover:shadow-gray-300/50 dark:hover:shadow-dark-900/70'
        : '';
    const paddingStyles = noPadding ? '' : 'p-5 sm:p-8';

    return (
        <div
            className={`relative bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-lg shadow-gray-200/50 dark:shadow-dark-900/50 ${paddingStyles} ${hoverStyles} ${className}`}
        >
            {gradient !== 'none' && (
                <div className={`absolute inset-x-0 top-0 h-1 ${gradientStyles[gradient]}`} />
            )}
            {children}
        </div>
    );
}
