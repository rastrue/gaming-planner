import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Settings,
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
      label: 'Organizer Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/dashboard'),
    },
    {
      label: 'Manage Events',
      href: '/organizer/events',
      icon: <ClipboardList className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/organizer/events'),
    },
    {
      label: 'Roster Management',
      href: '/organizer/roster',
      icon: <Users className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/organizer/roster'),
    },
    {
      label: 'Reports & Exports',
      href: '/reports',
      icon: <CalendarClock className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/reports'),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/settings'),
    },
  ];

  return (
    <SidebarNav
      items={items}
      ariaLabel="Organizer navigation"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      className={className}
    />
  );
}
