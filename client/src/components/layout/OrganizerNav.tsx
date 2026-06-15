import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import SidebarNav, { type SidebarNavItem } from '../ui/SidebarNav';

export interface OrganizerNavProps {
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

export default function OrganizerNav({
  currentPath,
  collapsed,
  onToggleCollapse,
  className,
}: OrganizerNavProps) {
  const items: SidebarNavItem[] = [
    {
      label: 'Панель организатора',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/dashboard'),
    },
    {
      label: 'Управление событиями',
      href: '/organizer/events',
      icon: <ClipboardList className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/organizer/events'),
    },
    {
      label: 'Управление составом',
      href: '/organizer/roster',
      icon: <Users className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/organizer/roster'),
    },
    {
      label: 'Отчёты и экспорт',
      href: '/reports',
      icon: <CalendarClock className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/reports'),
    },
  ];

  return (
    <SidebarNav
      items={items}
      ariaLabel="Навигация организатора"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      className={className}
    />
  );
}
