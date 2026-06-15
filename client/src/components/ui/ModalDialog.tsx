import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import IconButton from './IconButton';
import { cn, uiStyles } from '../../utils/cn';

export interface ModalDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export default function ModalDialog({
  open,
  title,
  children,
  onClose,
  footer,
  size = 'md',
  className,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={cn(
        'w-[calc(100%-2rem)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
        uiStyles.interactiveTransition,
        sizeClasses[size],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <IconButton label="Закрыть диалог" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="px-6 py-4">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
