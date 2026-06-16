const AUTH_PATHS_WITHOUT_SESSION_REDIRECT = ['/auth/me', '/auth/login', '/auth/register'];

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let sessionExpiryHandled = false;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;
  sessionExpiryHandled = false;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export function notifyUnauthorized(apiPath: string): void {
  const normalizedPath = apiPath.split('?')[0] ?? apiPath;

  if (AUTH_PATHS_WITHOUT_SESSION_REDIRECT.includes(normalizedPath)) {
    return;
  }

  if (sessionExpiryHandled) {
    return;
  }

  sessionExpiryHandled = true;
  unauthorizedHandler?.();
}
