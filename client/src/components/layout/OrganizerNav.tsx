import { CalendarClock, ClipboardList } from 'lucide-react';
import SidebarNav, { type SidebarNavItem } from '../ui/SidebarNav';

export interface OrganizerNavProps {
  currentPath: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

function isNavItemActive(currentPath: string, href: string): boolean {
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
      label: 'Управление событиями',
      href: '/organizer/events',
      icon: <ClipboardList className="h-4 w-4" />,
      isActive:
        isNavItemActive(currentPath, '/organizer/events') ||
        /^\/organizer\/events\/\d+\/roster/.test(currentPath),
    },
    {
      label: 'Отчеты и экспорт',
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
