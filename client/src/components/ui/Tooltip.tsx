import { type ReactNode, useId, useState } from 'react';
import { cn, uiStyles } from '../../utils/cn';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  placement?: 'top' | 'bottom';
  className?: string;
}

export default function Tooltip({ content, children, placement = 'top', className }: TooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>{children}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-20 max-w-xs -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900',
          uiStyles.interactiveTransition,
          placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
