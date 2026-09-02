import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import RadioGroup from '../../components/ui/RadioGroup';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import * as authService from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import type { ApiFieldError, UserRoleName } from '../../types/index';
import { getDefaultAuthenticatedPath } from '../../utils/routes';

function mapFieldErrors(errors?: ApiFieldError[]): Record<string, string> {
  const mapped: Record<string, string> = {};

  errors?.forEach((error) => {
    mapped[error.field] = error.message;
  });

  return mapped;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState<UserRoleName>('PLAYER');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const user = await authService.register({
        username,
        email,
        displayName,
        password,
        roleName,
      });
      setUser(user);
      navigate(getDefaultAuthenticatedPath(user.role.name), { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setFieldErrors(mapFieldErrors(error.errors));
      } else {
        setFormError('Unable to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section
        aria-labelledby="register-heading"
        className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="text-center">
          <h1 id="register-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Create a QuestSync account
          </h1>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <TextInput
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={fieldErrors.username}
            hint="Letters, numbers, and underscores only."
            required
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            required
          />
          <TextInput
            label="Display name"
            name="displayName"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            error={fieldErrors.displayName}
            required
          />
          <RadioGroup
            legend="Account role"
            name="roleName"
            value={roleName}
            onChange={(value) => setRoleName(value as UserRoleName)}
            error={fieldErrors.roleName}
            options={[
              {
                value: 'PLAYER',
                label: 'Player',
                description: 'Browse events, set availability, and join events.',
              },
              {
                value: 'ORGANIZER',
                label: 'Organizer',
                description: 'Manage events, rosters, and attendance.',
              },
            ]}
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            hint="At least 8 characters."
            required
          />

          {formError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="cursor-pointer font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
