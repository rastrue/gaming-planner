import {
  CalendarRange,
  Compass,
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
      label: 'Events',
      href: '/events',
      icon: <Compass className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/events'),
    },
    {
      label: 'Availability planner',
      href: '/availability',
      icon: <CalendarRange className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/availability'),
    },
    {
      label: 'My registrations',
      href: '/my-registrations',
      icon: <ScrollText className="h-4 w-4" />,
      isActive: isNavItemActive(currentPath, '/my-registrations'),
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
