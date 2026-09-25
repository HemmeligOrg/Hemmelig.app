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

const pageButton =
    'min-w-7 h-7 px-1.5 grid place-items-center rounded-sm font-mono text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

/**
 * Shows the item range and the page count. Shows page buttons when the
 * list has more than one page.
 */
export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
}: PaginationProps) {
    const { t } = useTranslation();

    if (totalItems === 0) return null;

    const pages = Math.max(1, totalPages);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    const visiblePages = getVisiblePages(currentPage, pages);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-faint">
                {t('pagination.summary', {
                    start: startItem,
                    end: endItem,
                    total: totalItems,
                    page: currentPage,
                    pages,
                })}
            </span>

            {pages > 1 && (
                <nav aria-label={t('pagination.label')} className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${pageButton} text-muted hover:text-fg`}
                        aria-label={t('pagination.previous_page')}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {visiblePages.map((page, i) =>
                        page === null ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-xs text-faint">
                                …
                            </span>
                        ) : (
                            <button
                                type="button"
                                key={page}
                                onClick={() => onPageChange(page)}
                                aria-current={page === currentPage ? 'page' : undefined}
                                className={`${pageButton} ${
                                    page === currentPage
                                        ? 'bg-line text-fg'
                                        : 'text-muted hover:text-fg'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === pages}
                        className={`${pageButton} text-muted hover:text-fg`}
                        aria-label={t('pagination.next_page')}
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </nav>
            )}
        </div>
    );
}
