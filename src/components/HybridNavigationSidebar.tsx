import React, { useState, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Check, 
  X, 
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationNode, ContentNode, ContentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DocumentSection {
  id: string;
  level: number;
  title: string;
  tags: string[];
  children: DocumentSection[];
}

interface HybridNavigationSidebarProps {
  structure: NavigationNode[];
  contentNodes?: ContentNode[];
  onSectionClick?: (sectionId: string, folderPath: string) => void;
  activeSectionId?: string;
  currentPath?: string;
  onStructureUpdate: () => void;
}

const parseDocumentSections = (content: string): DocumentSection[] => {
  const lines = content.split('\n');
  const sections: DocumentSection[] = [];
  const stack: DocumentSection[] = [];
  let sectionId = 0;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,30})\s*(.+?)(?:\s*\[(.*?)\])?$/);
    
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const tags = headingMatch[3] ? headingMatch[3].split(',').map(tag => tag.trim()) : [];
      
      const section: DocumentSection = {
        id: `section-${++sectionId}`,
        level,
        title,
        tags,
        children: []
      };

      // Find the right parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        sections.push(section);
      } else {
        stack[stack.length - 1].children.push(section);
      }

      stack.push(section);
    }
  }

  return sections;
};

const SectionItem: React.FC<{
  section: DocumentSection;
  depth: number;
  folderPath: string;
  onSectionClick?: (sectionId: string, folderPath: string) => void;
  activeSectionId?: string;
}> = ({ section, depth, folderPath, onSectionClick, activeSectionId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const hasChildren = section.children.length > 0;
  const isActive = activeSectionId === section.id;

  // Filter children to only show those that have children
  const filteredChildren = section.children.filter(child => child.children.length > 0);

  // Start indentation from the folder level, properly nested under parent labels
  const indentationPx = (depth + 2) * 16;

  return (
    <div className="text-sm">
      <div 
        className={`flex items-center gap-2 py-1 px-3 rounded cursor-pointer hover:bg-accent transition-colors ${
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        style={{ marginLeft: `${indentationPx}px` }}
        onClick={() => {
          // Navigate to dedicated node page instead of just scrolling
          navigate(`/node/${section.id}`);
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
          </div>
        )}
        
        <span className="truncate flex-1" title={section.title}>
          {section.title}
        </span>
        
        {section.tags.length > 0 && (
          <span className="text-xs bg-secondary text-secondary-foreground px-1 py-0.5 rounded flex-shrink-0">
            {section.tags.length}
          </span>
        )}
      </div>

      {isExpanded && filteredChildren.length > 0 && (
        <div className="mt-1">
          {filteredChildren.map((child) => (
            <SectionItem
              key={child.id}
              section={child}
              depth={depth + 1}
              folderPath={folderPath}
              onSectionClick={onSectionClick}
              activeSectionId={activeSectionId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderNode: React.FC<{
  node: NavigationNode;
  contentNodes?: ContentNode[];
  onSectionClick?: (sectionId: string, folderPath: string) => void;
  activeSectionId?: string;
  currentPath?: string;
  onStructureUpdate: () => void;
}> = ({ 
  node, 
  contentNodes, 
  onSectionClick, 
  activeSectionId, 
  currentPath,
  onStructureUpdate
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.title);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isActive = currentPath === node.path;

  // Find the associated content for this folder
  const associatedContent = contentNodes?.find(content => content.path === node.path);
  const documentSections = associatedContent ? parseDocumentSections(associatedContent.content || '') : [];

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(node.path);
    setExpanded(!expanded);
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(node.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleEditSave = async () => {
    if (editValue.trim() && editValue !== node.title) {
      const success = await ContentService.updateNavigationNode(node.id, { 
        title: editValue.trim() 
      });
      
      if (success) {
        toast.success("Folder renamed successfully");
        onStructureUpdate();
      } else {
        toast.error("Failed to rename folder");
      }
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(node.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${node.title}"? This action cannot be undone.`)) {
      const success = await ContentService.deleteNavigationNode(node.id);
      
      if (success) {
        toast.success("Folder deleted successfully");
        onStructureUpdate();
      } else {
        toast.error("Failed to delete folder");
      }
    }
  };

  return (
    <>
      <div
        className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded-md group transition-colors ${
          isActive 
            ? 'bg-primary/10 text-primary border-l-2 border-primary' 
            : 'hover:bg-accent/50'
        }`}
        onClick={handleNodeClick}
      >
        {/* Expansion toggle */}
        <button
          onClick={toggleExpanded}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* Title - editable */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleEditSave}
                className="h-6 px-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSave();
                }}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCancel();
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span className={`text-sm truncate ${
              isActive ? 'text-primary font-medium' : 'text-foreground group-hover:text-foreground/80'
            }`}>
              {node.title}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleEditStart}
              title="Edit folder name"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={handleDelete}
              title="Delete folder"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Document sections only - no nested folders */}
      {expanded && documentSections.length > 0 && (
        <div>
          {documentSections
            .filter(section => section.children.length > 0)
            .map((section) => (
              <SectionItem
                key={section.id}
                section={section}
                depth={0}
                folderPath={node.path}
                onSectionClick={onSectionClick}
                activeSectionId={activeSectionId}
              />
            ))}
        </div>
      )}
    </>
  );
};

export const HybridNavigationSidebar: React.FC<HybridNavigationSidebarProps> = ({ 
  structure, 
  contentNodes = [],
  onSectionClick,
  activeSectionId,
  currentPath,
  onStructureUpdate
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      const folder = await ContentService.createNavigationFolder(newFolderName.trim());
      
      if (folder) {
        toast.success("Folder created successfully");
        onStructureUpdate();
        setIsCreating(false);
        setNewFolderName("");
      } else {
        toast.error("Failed to create folder");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewFolderName("");
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewFolderName("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Only show top-level nodes, no nested structure
  const topLevelNodes = structure.filter(node => !node.parent_id);

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Navigation
        </div>
        {topLevelNodes.length > 0 ? (
          topLevelNodes.map((item) => (
            <FolderNode
              key={item.id}
              node={item}
              contentNodes={contentNodes}
              onSectionClick={onSectionClick}
              activeSectionId={activeSectionId}
              currentPath={currentPath}
              onStructureUpdate={onStructureUpdate}
            />
          ))
        ) : (
          <div className="p-3 text-center text-muted-foreground">
            <p className="text-sm">No folders found</p>
          </div>
        )}
      </div>

      {/* New Folder Button */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={startCreating}
          className="w-8 h-8 p-0 mx-auto block"
          title="Add new folder"
        >
          <Plus className="w-4 h-4" />
        </Button>

        {isCreating && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Folder name..."
              className="text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="h-6 w-6 p-0"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName("");
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};