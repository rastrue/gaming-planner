import { Navigate, Outlet } from 'react-router-dom';
import Card from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import type { UserRoleName } from '../../types/index';

export interface RoleRouteProps {
  allowedRoles: UserRoleName[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role.name)) {
    return (
      <Card title="Access denied" description="You do not have permission to view this page.">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This area is restricted to {allowedRoles.join(' or ').toLowerCase()} accounts.
        </p>
      </Card>
    );
  }

  return <Outlet />;
}
