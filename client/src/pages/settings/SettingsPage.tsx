import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ModalDialog from '../../components/ui/ModalDialog';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { resetApplicationSettings } from '../../hooks/useLocalStorageSync';
import * as authService from '../../services/authService';
import { setCurrentUser } from '../../store/authSlice';
import { resetEventsFilters } from '../../store/filtersSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { setThemeMode } from '../../store/themeSlice';
import { setSidebarCollapsed } from '../../store/uiSlice';
import { STORAGE_PREFIX } from '../../utils/storageKeys';

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const sidebarCollapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
  const [resetOpen, setResetOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleReset = async () => {
    resetApplicationSettings(dispatch);

    try {
      const user = await authService.getCurrentUser();
      dispatch(setCurrentUser(user));
    } catch {
      // Session cookie may have expired; ProtectedRoute will handle redirect.
    }

    setResetOpen(false);
    setStatusMessage('Application settings were reset to defaults.');
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Manage appearance and interface preferences. Settings persist locally under the{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{STORAGE_PREFIX}</code>{' '}
        prefix.
      </p>

      {statusMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {statusMessage}
        </p>
      ) : null}

      <Card title="Appearance" description="Choose how QuestSync looks on this device.">
        <ToggleSwitch
          label="Dark mode"
          description="Switch between light and dark themes."
          checked={themeMode === 'dark'}
          onChange={(checked) => dispatch(setThemeMode(checked ? 'dark' : 'light'))}
        />
      </Card>

      <Card title="Interface" description="Adjust layout behavior across authenticated pages.">
        <ToggleSwitch
          label="Collapse sidebar"
          description="Start with the navigation sidebar collapsed on desktop layouts."
          checked={sidebarCollapsed}
          onChange={(checked) => dispatch(setSidebarCollapsed(checked))}
        />
      </Card>

      <Card title="Event catalog filters" description="Reset saved search, sort, and filter preferences.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Restore the default event discovery filters on the catalog page.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              dispatch(resetEventsFilters());
              setStatusMessage('Event catalog filters were reset.');
            }}
          >
            Reset catalog filters
          </Button>
        </div>
      </Card>

      <Card
        title="Reset application settings"
        description="Remove all QuestSync local preferences and cached client state."
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This removes every <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{STORAGE_PREFIX}</code>{' '}
            key from <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">localStorage</code>,
            restores theme and UI defaults, clears cached lists, and keeps your signed-in session intact.
          </p>
          <Button type="button" variant="danger" onClick={() => setResetOpen(true)}>
            Reset application settings
          </Button>
        </div>
      </Card>

      <ModalDialog
        open={resetOpen}
        title="Reset application settings"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={() => void handleReset()}>
              Reset settings
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to reset QuestSync preferences on this device? Other websites stored in
          your browser will not be affected.
        </p>
      </ModalDialog>
    </div>
  );
}
