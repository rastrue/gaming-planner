import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MouseEvent } from 'react';
import { cn, uiStyles } from '../../utils/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];

  if (page > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

function scrollMainToTop() {
  const scrollRoot = document.querySelector('main');
  if (scrollRoot) {
    scrollRoot.scrollTop = 0;
    return;
  }

  window.scrollTo(0, 0);
}

function handlePaginationClick(onPageChange: (page: number) => void, nextPage: number) {
  onPageChange(nextPage);
  requestAnimationFrame(scrollMainToTop);
}

const paginationButtonHandlers = {
  onMouseDown: (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  },
};

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-center gap-1', className)}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => handlePaginationClick(onPageChange, page - 1)}
        {...paginationButtonHandlers}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-700',
          uiStyles.interactiveTransition,
          uiStyles.focusRing,
          uiStyles.disabled,
        )}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <ul className="flex flex-wrap items-center gap-1">
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} className="px-2 text-sm text-slate-500" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => handlePaginationClick(onPageChange, item)}
                {...paginationButtonHandlers}
                className={cn(
                  'min-h-10 min-w-10 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium',
                  uiStyles.interactiveTransition,
                  uiStyles.focusRing,
                  item === page
                    ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700'
                    : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => handlePaginationClick(onPageChange, page + 1)}
        {...paginationButtonHandlers}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-700',
          uiStyles.interactiveTransition,
          uiStyles.focusRing,
          uiStyles.disabled,
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
