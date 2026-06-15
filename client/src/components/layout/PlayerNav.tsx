import {
  CalendarRange,
  Compass,
  LayoutDashboard,
  ScrollText,
} from 'lucide-react';
import SidebarNav, { type SidebarNavItem } from '../ui/SidebarNav';

export interface PlayerNavProps {
  currentPath: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

function isNavItemActive(currentPath: string, href: string): boolean {
  if (href === '/dashboard') {
    return currentPath === '/dashboard';
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function PlayerNav({
  currentPath,
  collapsed,
  onToggleCollapse,
  className,
}: PlayerNavProps) {
  const items: SidebarNavItem[] = [
    {
      label: 'Панель игрока',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/dashboard'),
    },
    {
      label: 'События',
      href: '/events',
      icon: <Compass className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/events'),
    },
    {
      label: 'Планировщик доступности',
      href: '/availability',
      icon: <CalendarRange className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/availability'),
    },
    {
      label: 'Мои регистрации',
      href: '/my-registrations',
      icon: <ScrollText className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/my-registrations'),
    },
  ];

  return (
    <SidebarNav
      items={items}
      ariaLabel="Навигация игрока"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      className={className}
    />
  );
}
