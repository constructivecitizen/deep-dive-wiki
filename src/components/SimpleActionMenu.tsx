import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, Edit3, FileEdit, Filter } from 'lucide-react';

interface SimpleActionMenuProps {
  editMode: boolean;
  onToggleEdit: () => void;
  onToggleDocumentEditor: () => void;
  onToggleFilter: () => void;
}

export const SimpleActionMenu = ({
  editMode,
  onToggleEdit,
  onToggleDocumentEditor,
  onToggleFilter
}: SimpleActionMenuProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="w-4 h-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onToggleEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </DropdownMenuItem>
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
      </div>
    </div>
  );
};