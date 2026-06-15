import { Menu, X } from 'lucide-react';
import IconButton from '../ui/IconButton';
import { cn, uiStyles } from '../../utils/cn';

export interface MobileNavToggleProps {
  open: boolean;
  onToggle: () => void;
  className?: string;
}

export default function MobileNavToggle({ open, onToggle, className }: MobileNavToggleProps) {
  return (
    <IconButton
      label={open ? 'Закрыть меню навигации' : 'Открыть меню навигации'}
      size="md"
      onClick={onToggle}
      className={cn('md:hidden', uiStyles.interactiveTransition, className)}
    >
      {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </IconButton>
  );
}
