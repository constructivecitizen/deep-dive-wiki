import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, FileEdit, Filter } from 'lucide-react';

interface SimpleActionMenuProps {
  onToggleDocumentEditor: () => void;
  onToggleFilter: () => void;
}

export const SimpleActionMenu = ({
  onToggleDocumentEditor,
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
        <DropdownMenuItem onClick={onToggleDocumentEditor}>
          <FileEdit className="w-4 h-4 mr-2" />
          Document Editor
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleFilter}>
          <Filter className="w-4 h-4 mr-2" />
          Filter Content
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};