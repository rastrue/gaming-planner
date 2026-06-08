import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppShell from './AppShell';

function getPageMeta(pathname: string): { title: string; description?: string } {
  if (pathname === '/dashboard') {
    return { title: 'Dashboard', description: 'Role-specific overview and quick actions.' };
  }

  if (/^\/events\/\d+/.test(pathname)) {
    return { title: 'Event Details', description: 'Event metadata, roster summary, and registration actions.' };
  }

  if (pathname === '/events') {
    return { title: 'Discover Events', description: 'Browse upcoming multiplayer sessions.' };
  }

  if (pathname === '/availability') {
    return { title: 'Availability Planner', description: 'Manage weekly availability windows.' };
  }

  if (pathname === '/my-registrations') {
    return { title: 'My Registrations', description: 'Track registration history and statuses.' };
  }

  if (pathname === '/reports') {
    return { title: 'Reports', description: 'Generate, export, and email participation reports.' };
  }

  if (pathname === '/settings') {
    return { title: 'Settings', description: 'Theme, preferences, and application reset.' };
  }

  if (pathname === '/organizer/events/new') {
    return { title: 'Create Event', description: 'Publish a new multiplayer event.' };
  }

  if (/^\/organizer\/events\/\d+\/edit/.test(pathname)) {
    return { title: 'Edit Event', description: 'Update event details and scheduling.' };
  }

  if (pathname === '/organizer/events') {
    return { title: 'Manage Events', description: 'Organizer event management workspace.' };
  }

  if (/^\/organizer\/roster\/\d+/.test(pathname)) {
    return { title: 'Roster Board', description: 'Assign approved players to roster slots.' };
  }

  if (pathname === '/organizer/roster') {
    return { title: 'Roster Management', description: 'Select an event to manage its roster.' };
  }

  return { title: 'QuestSync', description: 'QuestSync application page.' };
}

export default function AuthenticatedLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const meta = getPageMeta(location.pathname);

  if (!user) {
    return null;
  }

  return (
    <AppShell
      role={user.role.name}
      currentPath={location.pathname}
      title={meta.title}
      description={meta.description}
      userDisplayName={user.displayName}
    >
      <Outlet />
    </AppShell>
  );
}
