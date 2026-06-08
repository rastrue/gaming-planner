import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import { useLocalStorageSync } from './hooks/useLocalStorageSync';
import PlaceholderPage from './pages/PlaceholderPage';
import * as authService from './services/authService';
import { clearCurrentUser, setCurrentUser } from './store/authSlice';
import type { AppDispatch } from './store/store';
import { useAuth } from './hooks/useAuth';

function GuestRoute({ isBootstrapped }: { isBootstrapped: boolean }) {
  const { isAuthenticated } = useAuth();

  if (!isBootstrapped) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function PublicAuthPage({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md">
        <PlaceholderPage
          title={title}
          description="Authentication page wiring placeholder. Full forms arrive in the next task."
        />
      </section>
    </main>
  );
}

function HomeRedirect({ isBootstrapped }: { isBootstrapped: boolean }) {
  const { isAuthenticated } = useAuth();

  if (!isBootstrapped) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </main>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  useLocalStorageSync();
  const dispatch = useDispatch<AppDispatch>();
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;

    void authService
      .getCurrentUser()
      .then((user) => {
        if (active) {
          dispatch(setCurrentUser(user));
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
      <Routes>
        <Route element={<GuestRoute isBootstrapped={isBootstrapped} />}>
          <Route path="/login" element={<PublicAuthPage title="Login" />} />
          <Route path="/register" element={<PublicAuthPage title="Register" />} />
        </Route>

        <Route element={<ProtectedRoute isBootstrapped={isBootstrapped} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
            <Route path="/events" element={<PlaceholderPage title="Discover Events" />} />
            <Route path="/events/:id" element={<PlaceholderPage title="Event Details" />} />
            <Route path="/availability" element={<PlaceholderPage title="Availability Planner" />} />
            <Route path="/my-registrations" element={<PlaceholderPage title="My Registrations" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />

            <Route element={<RoleRoute allowedRoles={['ORGANIZER']} />}>
              <Route path="/organizer/events" element={<PlaceholderPage title="Manage Events" />} />
              <Route path="/organizer/events/new" element={<PlaceholderPage title="Create Event" />} />
              <Route
                path="/organizer/events/:id/edit"
                element={<PlaceholderPage title="Edit Event" />}
              />
              <Route path="/organizer/roster" element={<PlaceholderPage title="Roster Management" />} />
              <Route
                path="/organizer/roster/:eventId"
                element={<PlaceholderPage title="Roster Board" />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect isBootstrapped={isBootstrapped} />} />
        <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}
