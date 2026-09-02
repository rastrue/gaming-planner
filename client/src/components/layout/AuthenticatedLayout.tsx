import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppShell from './AppShell';

function getPageMeta(pathname: string): { title: string; description?: string } {
  if (/^\/events\/\d+/.test(pathname)) {
    return { title: 'Event details' };
  }

  if (pathname === '/events') {
    return { title: 'Events' };
  }

  if (pathname === '/availability') {
    return { title: 'Availability planner' };
  }

  if (pathname === '/my-registrations') {
    return { title: 'My registrations' };
  }

  if (pathname === '/reports') {
    return { title: 'Reports & export' };
  }

  if (pathname === '/organizer/events/new') {
    return { title: 'Create event' };
  }

  if (/^\/organizer\/events\/\d+\/edit/.test(pathname)) {
    return { title: 'Edit event' };
  }

  if (pathname === '/organizer/events') {
    return { title: 'Event management' };
  }

  if (/^\/organizer\/events\/\d+\/roster/.test(pathname)) {
    return { title: 'Roster board', description: 'Slots, registrations, and player assignments.' };
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
