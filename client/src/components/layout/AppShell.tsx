import { Moon, Sun } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebarCollapsed } from '../../store/uiSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { toggleThemeMode } from '../../store/themeSlice';
import type { UserRoleName } from '../../types/index';
import IconButton from '../ui/IconButton';
import type { BreadcrumbItem } from '../ui/Breadcrumbs';
import MobileNavToggle from './MobileNavToggle';
import OrganizerNav from './OrganizerNav';
import PageHeader from './PageHeader';
import PlayerNav from './PlayerNav';

export interface AppShellProps {
  role: UserRoleName;
  currentPath: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  headerActions?: ReactNode;
  children: ReactNode;
  userDisplayName?: string;
}

export default function AppShell({
  role,
  currentPath,
  title,
  description,
  breadcrumbs,
  headerActions,
  children,
  userDisplayName,
}: AppShellProps) {
  const dispatch = useDispatch<AppDispatch>();
  const sidebarCollapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const roleLabel = role === 'ORGANIZER' ? 'Organizer Workspace' : 'Player Workspace';

  const navigation = role === 'ORGANIZER' ? (
    <OrganizerNav
      currentPath={currentPath}
      collapsed={sidebarCollapsed}
      onToggleCollapse={() => dispatch(toggleSidebarCollapsed())}
    />
  ) : (
    <PlayerNav
      currentPath={currentPath}
      collapsed={sidebarCollapsed}
      onToggleCollapse={() => dispatch(toggleSidebarCollapsed())}
    />
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNavToggle
              open={mobileNavOpen}
              onToggle={() => setMobileNavOpen((open) => !open)}
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-primary-600 dark:text-primary-400">QuestSync</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userDisplayName ? (
              <span className="hidden max-w-[10rem] truncate text-sm text-slate-600 sm:inline dark:text-slate-300">
                {userDisplayName}
              </span>
            ) : null}
            <IconButton
              label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              size="sm"
              onClick={() => dispatch(toggleThemeMode())}
            >
              {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </IconButton>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden shrink-0 md:flex">{navigation}</div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              className="absolute inset-0 cursor-pointer bg-slate-950/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative h-full w-64 max-w-[85vw] shadow-xl">
              {role === 'ORGANIZER' ? (
                <OrganizerNav currentPath={currentPath} collapsed={false} />
              ) : (
                <PlayerNav currentPath={currentPath} collapsed={false} />
              )}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <PageHeader
            title={title}
            description={description}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
          />
          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
