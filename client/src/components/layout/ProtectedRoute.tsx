import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '../ui/Spinner';
import { useAuth } from '../../hooks/useAuth';

export interface ProtectedRouteProps {
  isBootstrapped: boolean;
}

export default function ProtectedRoute({ isBootstrapped }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isBootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Checking session" size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
