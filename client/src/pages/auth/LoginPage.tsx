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

      const from = (location.state as { from?: string } | null)?.from;
      const defaultPath = getDefaultAuthenticatedPath(user.role.name);
      const redirectPath =
        !from || (from === '/dashboard' && user.role.name === 'PLAYER') ? defaultPath : from;
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setFieldErrors(mapFieldErrors(error.errors));
      } else {
        setFormError('Не удалось войти. Попробуйте снова.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section
        aria-labelledby="login-heading"
        className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="space-y-1 text-center">
          <h1 id="login-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Вход в QuestSync
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Используйте email или имя пользователя для доступа к аккаунту.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <TextInput
            label="Email или имя пользователя"
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            error={fieldErrors.identifier ?? fieldErrors.body}
            required
          />
          <TextInput
            label="Пароль"
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
            {isSubmitting ? 'Вход...' : 'Войти'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Нет аккаунта?{' '}
          <Link
            to="/register"
            className="cursor-pointer font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Создать
          </Link>
        </p>
      </section>
    </main>
  );
}
