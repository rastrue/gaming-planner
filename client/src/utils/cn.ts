export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

const interactiveTransition = 'transition-all duration-200 ease-in-out';

export const uiStyles = {
  interactiveTransition,
  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
  disabled: 'disabled:cursor-not-allowed disabled:opacity-50',
};
