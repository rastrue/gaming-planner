import { useCallback, useState } from 'react';
import type { ToastVariant } from '../components/ui/Toast';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : String(Date.now());

      setToasts((current) => [...current, { ...toast, id }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast],
  );

  return { toasts, showToast, dismissToast };
}
