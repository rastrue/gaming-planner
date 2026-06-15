import { Navigate, Outlet } from 'react-router-dom';
import Card from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import type { UserRoleName } from '../../types/index';

const roleLabels: Record<UserRoleName, string> = {
  ORGANIZER: 'организатор',
  PLAYER: 'игрок',
};

export interface RoleRouteProps {
  allowedRoles: UserRoleName[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role.name)) {
    const roleList = allowedRoles.map((role) => roleLabels[role]).join(' или ');

    return (
      <Card title="Доступ запрещён" description="У вас нет прав для просмотра этой страницы.">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Этот раздел доступен только аккаунтам {roleList}.
        </p>
      </Card>
    );
  }

  return <Outlet />;
}
