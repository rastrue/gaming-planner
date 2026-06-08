import {
  CalendarRange,
  Compass,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
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
      label: 'Player Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/dashboard'),
    },
    {
      label: 'Discover Events',
      href: '/events',
      icon: <Compass className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/events'),
    },
    {
      label: 'Availability Planner',
      href: '/availability',
      icon: <CalendarRange className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/availability'),
    },
    {
      label: 'My Registrations',
      href: '/my-registrations',
      icon: <ScrollText className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/my-registrations'),
    },
    {
      label: 'Reports & Exports',
      href: '/reports',
      icon: <FileText className="h-4 w-4" />,
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
      ariaLabel="Player navigation"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      className={className}
    />
  );
}
