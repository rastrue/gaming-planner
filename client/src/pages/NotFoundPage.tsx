import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import * as authService from '../services/authService';
import { clearCurrentUser, setCurrentUser } from '../store/authSlice';
import type { AppDispatch } from '../store/store';
import type { PublicUser } from '../types/index';
import { getDefaultAuthenticatedPath } from '../utils/routes';

export interface NotFoundPageProps {
  isBootstrapped: boolean;
}

interface NotFoundContentProps {
  sessionUser: PublicUser | null;
}

function NotFoundContent({ sessionUser }: NotFoundContentProps) {
  const location = useLocation();

  const homePath = sessionUser
    ? getDefaultAuthenticatedPath(sessionUser.role.name)
    : '/login';

  return (
    <section
      aria-labelledby="not-found-heading"
      className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <p
        className="text-7xl font-bold tabular-nums tracking-tight text-slate-300 dark:text-slate-700"
        aria-hidden="true"
      >
        404
      </p>
      <div className="space-y-3">
        <h1 id="not-found-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Page not found
        </h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          The address{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {location.pathname}
          </code>{' '}
          does not exist or has been moved.
        </p>
      </div>
      <nav aria-label="404 page actions">
        <Link to={homePath}>
          <Button className="w-full">{sessionUser ? 'Go home' : 'Go to login'}</Button>
        </Link>
      </nav>
    </section>
  );
}

export default function NotFoundPage({ isBootstrapped }: NotFoundPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [sessionUser, setSessionUser] = useState<PublicUser | null | undefined>(undefined);

  useEffect(() => {
    document.title = '404 — Page not found · QuestSync';
  }, []);

  useEffect(() => {
    if (!isBootstrapped) {
      return;
    }

    let active = true;

    void authService
      .probeSession()
      .then((user) => {
        if (!active) {
          return;
        }

        if (user) {
          dispatch(setCurrentUser(user));
        } else {
          dispatch(clearCurrentUser());
        }

        setSessionUser(user);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        dispatch(clearCurrentUser());
        setSessionUser(null);
      });

    return () => {
      active = false;
    };
  }, [dispatch, isBootstrapped]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      {!isBootstrapped || sessionUser === undefined ? (
        <Spinner label="Loading" size="lg" />
      ) : (
        <NotFoundContent sessionUser={sessionUser} />
      )}
    </main>
  );
}
