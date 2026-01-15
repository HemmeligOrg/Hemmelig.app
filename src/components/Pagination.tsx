import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

function getVisiblePages(current: number, total: number): (number | null)[] {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) return [1, 2, 3, 4, null, total];
    if (current >= total - 2) return [1, null, total - 3, total - 2, total - 1, total];

    return [1, null, current - 1, current, current + 1, null, total];
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
}: PaginationProps) {
    const { t } = useTranslation();

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    const pages = getVisiblePages(currentPage, totalPages);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <span className="text-xs text-gray-500 dark:text-slate-400">
                {t('pagination.showing', { start: startItem, end: endItem, total: totalItems })}
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('pagination.previous_page')}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {pages.map((page, i) =>
                    page === null ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[28px] p-1.5 text-xs transition-colors ${
                                page === currentPage
                                    ? 'bg-teal-500 text-white'
                                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('pagination.next_page')}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
