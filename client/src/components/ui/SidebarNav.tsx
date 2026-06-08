import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import IconButton from './IconButton';
import { cn, uiStyles } from '../../utils/cn';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  isActive?: boolean;
}

export interface SidebarNavProps {
  items: SidebarNavItem[];
  ariaLabel?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export default function SidebarNav({
  items,
  ariaLabel = 'Main navigation',
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarNavProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        collapsed ? 'w-16' : 'w-64',
        uiStyles.interactiveTransition,
        className,
      )}
    >
      {onToggleCollapse ? (
        <div className="flex justify-end border-b border-slate-200 p-2 dark:border-slate-800">
          <IconButton
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            size="sm"
            onClick={onToggleCollapse}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </IconButton>
        </div>
      ) : null}
      <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={item.isActive ? 'page' : undefined}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  uiStyles.interactiveTransition,
                  uiStyles.focusRing,
                  item.isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-900 dark:active:bg-slate-800',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon ? (
                  <span aria-hidden="true" className="shrink-0">
                    {item.icon}
                  </span>
                ) : null}
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
