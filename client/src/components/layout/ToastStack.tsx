import Toast from '../ui/Toast';
import type { ToastItem } from '../../hooks/useToast';

export interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
}
