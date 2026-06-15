import { ChevronRight } from 'lucide-react';
import { cn, uiStyles } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Навигационная цепочка" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
              ) : null}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'truncate',
                    isLast ? 'font-medium text-slate-900 dark:text-slate-100' : undefined,
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    'cursor-pointer truncate hover:text-primary-600 active:text-primary-700 dark:hover:text-primary-400',
                    uiStyles.interactiveTransition,
                    uiStyles.focusRing,
                  )}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
