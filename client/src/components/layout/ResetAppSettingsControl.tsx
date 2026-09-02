import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { resetApplicationSettingsAndRestoreSession } from '../../hooks/useLocalStorageSync';
import type { AppDispatch } from '../../store/store';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import ModalDialog from '../ui/ModalDialog';

export interface ResetAppSettingsControlProps {
  onSuccess?: () => void;
}

export default function ResetAppSettingsControl({ onSuccess }: ResetAppSettingsControlProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (isResetting) {
      return;
    }

    setIsResetting(true);
    try {
      await resetApplicationSettingsAndRestoreSession(dispatch);
      setOpen(false);
      onSuccess?.();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <IconButton
        label="Reset app settings"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-4 w-4" />
      </IconButton>
      <ModalDialog
        open={open}
        title="Reset app settings"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" disabled={isResetting} onClick={() => void handleReset()}>
              {isResetting ? 'Resetting…' : 'Reset settings'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to reset QuestSync preferences on this device? Data from other
          websites in your browser will not be affected.
        </p>
      </ModalDialog>
    </>
  );
}
