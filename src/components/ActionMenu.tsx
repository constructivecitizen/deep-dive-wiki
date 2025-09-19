import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, Edit3, FileEdit, Filter } from 'lucide-react';

interface ActionMenuProps {
  editMode: boolean;
  onToggleEdit: (enabled: boolean) => void;
  onDocumentEdit: () => void;
  onToggleFilter: () => void;
}

export const ActionMenu = ({
  editMode,
  onToggleEdit,
  onDocumentEdit,
  onToggleFilter
}: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="animate-fade-in">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 animate-scale-in">
        <DropdownMenuItem
          onClick={() => handleItemClick(() => onToggleEdit(!editMode))}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Edit3 className="h-4 w-4" />
          {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleItemClick(onDocumentEdit)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileEdit className="h-4 w-4" />
          Document Editor
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleItemClick(onToggleFilter)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Filter className="h-4 w-4" />
          Toggle Filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};