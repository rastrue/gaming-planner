import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ModalDialog from '../../components/ui/ModalDialog';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import Tooltip from '../../components/ui/Tooltip';
import ToastStack from '../../components/layout/ToastStack';
import { resetApplicationSettings } from '../../hooks/useLocalStorageSync';
import { useToast } from '../../hooks/useToast';
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
  const { toasts, showToast, dismissToast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  const handleReset = async () => {
    resetApplicationSettings(dispatch);

    try {
      const user = await authService.getCurrentUser();
      dispatch(setCurrentUser(user));
    } catch {
      // Session cookie may have expired; ProtectedRoute will handle redirect.
    }

    setResetOpen(false);
    showToast({
      title: 'Настройки сброшены',
      message: 'Предпочтения QuestSync восстановлены по умолчанию.',
      variant: 'success',
    });
  };

  return (
    <>
      <div className="space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Управление внешним видом и параметрами интерфейса. Настройки сохраняются локально с префиксом{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{STORAGE_PREFIX}</code>.
        </p>

        <Card title="Внешний вид" description="Настройте отображение QuestSync на этом устройстве.">
          <ToggleSwitch
            label="Тёмная тема"
            description="Переключение между светлой и тёмной темой."
            checked={themeMode === 'dark'}
            onChange={(checked) => dispatch(setThemeMode(checked ? 'dark' : 'light'))}
          />
        </Card>

        <Card title="Интерфейс" description="Настройка поведения макета на страницах приложения.">
          <ToggleSwitch
            label="Свернуть боковую панель"
            description="На десктопе боковая панель изначально свёрнута."
            checked={sidebarCollapsed}
            onChange={(checked) => dispatch(setSidebarCollapsed(checked))}
          />
        </Card>

        <Card title="Фильтры каталога событий" description="Сброс сохранённых параметров поиска и фильтрации.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Восстановить фильтры каталога событий по умолчанию.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                dispatch(resetEventsFilters());
                showToast({
                  title: 'Фильтры сброшены',
                  message: 'Фильтры каталога событий восстановлены по умолчанию.',
                  variant: 'info',
                });
              }}
            >
              Сбросить фильтры каталога
            </Button>
          </div>
        </Card>

        <Card
          title="Сброс настроек приложения"
          description="Удаление всех локальных предпочтений QuestSync и кэшированных данных клиента."
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Будут удалены все ключи{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{STORAGE_PREFIX}</code>{' '}
              из <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">localStorage</code>,
              восстановлены тема и параметры интерфейса, очищены кэшированные списки. Сессия входа сохранится.
            </p>
            <Tooltip content="Очищаются только предпочтения QuestSync; другие сайты не затрагиваются.">
              <Button type="button" variant="danger" onClick={() => setResetOpen(true)}>
                Сбросить настройки приложения
              </Button>
            </Tooltip>
          </div>
        </Card>

        <ModalDialog
          open={resetOpen}
          title="Сброс настроек приложения"
          onClose={() => setResetOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setResetOpen(false)}>
                Отмена
              </Button>
              <Button type="button" variant="danger" onClick={() => void handleReset()}>
                Сбросить настройки
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Вы уверены, что хотите сбросить предпочтения QuestSync на этом устройстве? Данные других
            сайтов в браузере не будут затронуты.
          </p>
        </ModalDialog>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
