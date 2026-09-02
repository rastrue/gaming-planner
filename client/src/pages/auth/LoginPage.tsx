import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import * as authService from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import type { ApiFieldError } from '../../types/index';
import { getDefaultAuthenticatedPath } from '../../utils/routes';

function mapFieldErrors(errors?: ApiFieldError[]): Record<string, string> {
  const mapped: Record<string, string> = {};

  errors?.forEach((error) => {
    mapped[error.field] = error.message;
  });

  return mapped;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const locationState = location.state as { from?: string; sessionExpired?: boolean } | null;
  const sessionExpired = locationState?.sessionExpired === true;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const user = await authService.login({ identifier, password });
      setUser(user);

      const from = locationState?.from;
      const defaultPath = getDefaultAuthenticatedPath(user.role.name);
      const redirectPath = from ?? defaultPath;
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setFieldErrors(mapFieldErrors(error.errors));
      } else {
        setFormError('Unable to sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="h-dvh overflow-y-auto overscroll-y-contain px-4 py-8">
      <div className="flex min-h-full items-center justify-center">
      <section
        aria-labelledby="login-heading"
        className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="text-center">
          <h1 id="login-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Sign in to QuestSync
          </h1>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {sessionExpired ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Your session has expired. Sign in again to continue.
            </p>
          ) : null}
          <TextInput
            label="Email or username"
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            error={fieldErrors.identifier ?? fieldErrors.body}
            required
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            required
          />

          {formError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="cursor-pointer font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Create one
          </Link>
        </p>
      </section>
      </div>
    </main>
  );
}
