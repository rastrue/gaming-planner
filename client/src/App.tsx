import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import { useLocalStorageSync } from './hooks/useLocalStorageSync';
import EventFormPage from './pages/organizer/EventFormPage';
import RosterBoardPage from './pages/organizer/RosterBoardPage';
import OrganizerEventsPage from './pages/organizer/OrganizerEventsPage';
import MyRegistrationsPage from './pages/registrations/MyRegistrationsPage';
import AvailabilityPage from './pages/availability/AvailabilityPage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotFoundPage from './pages/NotFoundPage';
import SessionExpiryHandler from './components/layout/SessionExpiryHandler';
import * as authService from './services/authService';
import { clearCurrentUser, setCurrentUser } from './store/authSlice';
import type { AppDispatch } from './store/store';
import { useAuth } from './hooks/useAuth';
import { getDefaultAuthenticatedPath } from './utils/routes';

function GuestRoute({ isBootstrapped }: { isBootstrapped: boolean }) {
  const { isAuthenticated, user } = useAuth();

  if (!isBootstrapped) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Загрузка...</p>
      </main>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultAuthenticatedPath(user.role.name)} replace />;
  }

  return <Outlet />;
}

function HomeRedirect({ isBootstrapped }: { isBootstrapped: boolean }) {
  const { isAuthenticated, user } = useAuth();

  if (!isBootstrapped) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Загрузка...</p>
      </main>
    );
  }

  return (
    <Navigate
      to={isAuthenticated && user ? getDefaultAuthenticatedPath(user.role.name) : '/login'}
      replace
    />
  );
}

export default function App() {
  useLocalStorageSync();
  const dispatch = useDispatch<AppDispatch>();
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;

    void authService
      .probeSession()
      .then((user) => {
        if (active) {
          if (user) {
            dispatch(setCurrentUser(user));
          } else {
            dispatch(clearCurrentUser());
          }
        }
      })
      .catch(() => {
        if (active) {
          dispatch(clearCurrentUser());
        }
      })
      .finally(() => {
        if (active) {
          setIsBootstrapped(true);
        }
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <SessionExpiryHandler />
      <Routes>
        <Route element={<GuestRoute isBootstrapped={isBootstrapped} />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute isBootstrapped={isBootstrapped} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/availability" element={<AvailabilityPage />} />
            <Route path="/my-registrations" element={<MyRegistrationsPage />} />

            <Route element={<RoleRoute allowedRoles={['ORGANIZER']} />}>
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/organizer/events" element={<OrganizerEventsPage />} />
              <Route path="/organizer/events/new" element={<EventFormPage />} />
              <Route path="/organizer/events/:id/edit" element={<EventFormPage />} />
              <Route path="/organizer/events/:id/roster" element={<RosterBoardPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect isBootstrapped={isBootstrapped} />} />
        <Route path="*" element={<NotFoundPage isBootstrapped={isBootstrapped} />} />
      </Routes>
    </BrowserRouter>
  );
}
