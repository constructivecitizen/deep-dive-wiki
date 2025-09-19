import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Check, 
  X, 
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationNode, WikiDocument, ContentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { buildSectionHierarchy, HierarchicalDocumentSection } from '../lib/sectionHierarchy';
import { EnhancedSectionItem } from './EnhancedSectionItem';

interface HybridNavigationSidebarProps {
  structure: NavigationNode[];
  contentNodes?: WikiDocument[];
  onSectionView?: (sectionData: { content: string; title: string; level: number; parentPath: string }) => void;
  onStructureUpdate: () => void;
  onNavigationClick?: (navId: string, path: string) => void;
  currentNavId?: string | null;
}

  const FolderNode: React.FC<{
  node: NavigationNode;
  contentNodes?: WikiDocument[];
  onSectionView?: (sectionData: { content: string; title: string; level: number; parentPath: string }) => void;
  onStructureUpdate: () => void;
  onNavigationClick?: (navId: string, path: string) => void;  
  currentNavId?: string | null;
}> = ({ 
  node, 
  contentNodes, 
  onSectionView, 
  onStructureUpdate,
  onNavigationClick,
  currentNavId
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.title);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the associated content for this folder and build hierarchical sections
  const associatedContent = contentNodes?.find(content => content.path === node.path);
  const { hierarchicalSections, flatSections } = useMemo(() => {
    if (!associatedContent?.content_json) return { hierarchicalSections: [], flatSections: [] };
    
    // Convert JSON sections to flat format first
    const flatSections = associatedContent.content_json.map((section, index) => ({
      id: section.id || `section-${index}`,
      level: section.level || 1,
      title: section.title || '',
      content: section.content || '',
      tags: section.tags || []
    }));
    
    // Build hierarchical structure (only sections with children will be returned)
    const hierarchicalSections = buildSectionHierarchy(flatSections);
    
    return { hierarchicalSections, flatSections };
  }, [associatedContent?.content_json]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigationClick) {
      onNavigationClick(node.id, node.path);
    } else {
      navigate(node.path);
    }
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
      {/* Folder Header - Clickable to navigate */}
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-md group transition-colors cursor-pointer hover:bg-accent/50"
        onClick={handleNodeClick}
      >
        {/* Expansion toggle */}
        <button
          onClick={toggleExpanded}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded z-10"
        >
          <span className={`text-muted-foreground transform transition-transform duration-200 text-2xl origin-center ${expanded ? 'rotate-90' : ''}`}>
            ‣
          </span>
        </button>

        {/* Title - editable */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
            <span className="text-sm truncate text-foreground group-hover:text-foreground/80">
              {node.title}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div 
            className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Document sections - Show hierarchical sections */}
      {expanded && hierarchicalSections.length > 0 && (
        <div className="mt-1">
          {hierarchicalSections.map((section, index) => (
            <EnhancedSectionItem
              key={section.id}
              section={section}
              depth={0}
              folderPath={node.path}
              onSectionView={onSectionView}
              sectionPosition={index}
              flatSections={flatSections}
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
  onSectionView,
  onStructureUpdate,
  onNavigationClick,
  currentNavId
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
              onSectionView={onSectionView}
              onStructureUpdate={onStructureUpdate}
              onNavigationClick={onNavigationClick}
              currentNavId={currentNavId}
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