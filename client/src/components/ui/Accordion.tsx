import { ChevronDown } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { cn, uiStyles } from '../../utils/cn';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  className?: string;
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className,
}: AccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultOpenIds));

  const toggleItem = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (!allowMultiple) {
        next.clear();
      }
      next.add(id);
      return next;
    });
  };

  return (
    <div className={cn('divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800', className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;

        return (
          <section key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900 dark:active:bg-slate-800',
                  uiStyles.interactiveTransition,
                  uiStyles.focusRing,
                )}
              >
                <span>{item.title}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn('h-4 w-4 shrink-0 text-slate-500', uiStyles.interactiveTransition, isOpen && 'rotate-180')}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400"
            >
              {item.content}
            </div>
          </section>
        );
      })}
    </div>
  );
}
