import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn, uiStyles } from '../../utils/cn';

type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: IconButtonSize;
  children: ReactNode;
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
};

export default function IconButton({
  label,
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700',
        uiStyles.interactiveTransition,
        uiStyles.focusRing,
        uiStyles.disabled,
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
