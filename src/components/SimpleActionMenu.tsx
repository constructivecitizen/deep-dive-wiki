import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, Filter } from 'lucide-react';

interface SimpleActionMenuProps {
  onToggleFilter: () => void;
}

export const SimpleActionMenu = ({
  onToggleFilter
}: SimpleActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Menu className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg z-50">
        <DropdownMenuItem onClick={onToggleFilter}>
          <Filter className="w-4 h-4 mr-2" />
          Filter Content
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
