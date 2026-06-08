import { useAuth } from '../../hooks/useAuth';
import OrganizerDashboard from './OrganizerDashboard';
import PlayerDashboard from './PlayerDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role.name === 'ORGANIZER') {
    return <OrganizerDashboard />;
  }

  return <PlayerDashboard />;
}
