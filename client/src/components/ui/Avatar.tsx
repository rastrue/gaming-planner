import { cn } from '../../utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Avatar({ name, src, alt, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const imageAlt = alt ?? `${name} avatar`;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300',
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={imageAlt} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={imageAlt}>{initials}</span>
      )}
    </span>
  );
}
