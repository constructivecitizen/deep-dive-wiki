import { useState, useRef } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  ExternalLink, 
  Plus, 
  Edit2, 
  Check, 
  X, 
  Trash2,
  GripVertical
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavigationNode, ContentNode, ContentService } from "@/services/contentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EditableNavigationSidebarProps {
  structure: NavigationNode[];
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  currentPath?: string;
  onStructureUpdate: () => void;
}

interface TreeNodeProps {
  node: NavigationNode;
  level: number;
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  currentPath?: string;
  onStructureUpdate: () => void;
  onDragStart?: (e: React.DragEvent, nodeId: string) => void;
  onDrop?: (e: React.DragEvent, targetNodeId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
}

const TreeNode = ({ 
  node, 
  level, 
  contentNodes, 
  onContentNodeClick, 
  activeNodeId, 
  currentPath,
  onStructureUpdate,
  onDragStart,
  onDrop,
  onDragOver
}: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(level < 2);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.title);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const hasChildren = node.children && node.children.length > 0;
  const isActive = currentPath === node.path;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (node.type === 'folder') {
      navigate(node.path);
      setExpanded(!expanded);
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

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(e, node.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    onDrop?.(e, node.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    onDragOver?.(e);
  };

  const indentationStyle = {
    paddingLeft: `${level * 16 + 8}px`
  };

  return (
    <>
      <div
        className={`flex items-center gap-2 py-2 px-2 cursor-pointer rounded-md group transition-colors ${
          isActive 
            ? 'bg-primary/10 text-primary border-l-2 border-primary' 
            : 'hover:bg-accent/50'
        }`}
        style={indentationStyle}
        onClick={handleNodeClick}
        draggable={node.type === 'folder'}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Drag handle */}
        {node.type === 'folder' && (
          <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        )}

        {/* Expansion toggle for folders with children */}
        {hasChildren && (
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
        )}

        {/* Spacer for items without expansion toggle */}
        {!hasChildren && <div className="w-4" />}

        {/* Icon */}
        <div className="flex-shrink-0">
          {node.type === 'folder' ? (
            <Folder className="w-4 h-4 text-muted-foreground" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Title - editable for folders */}
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

        {/* Action buttons - only for folders */}
        {node.type === 'folder' && !isEditing && (
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

        {/* External link icon for documents */}
        {node.type === 'document' && (
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              contentNodes={contentNodes}
              onContentNodeClick={onContentNodeClick}
              activeNodeId={activeNodeId}
              currentPath={currentPath}
              onStructureUpdate={onStructureUpdate}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onDragOver={onDragOver}
            />
          ))}
        </div>
      )}
    </>
  );
};

export const EditableNavigationSidebar = ({ 
  structure, 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId,
  currentPath,
  onStructureUpdate
}: EditableNavigationSidebarProps) => {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();
    
    if (!draggedNodeId || draggedNodeId === targetNodeId) {
      setDraggedNodeId(null);
      return;
    }

    // Simple reordering - move draggedNode to be a child of targetNode
    const success = await ContentService.reorderNavigationNodes(draggedNodeId, targetNodeId, 0);
    
    if (success) {
      toast.success("Folder moved successfully");
      onStructureUpdate();
    } else {
      toast.error("Failed to move folder");
    }
    
    setDraggedNodeId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

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

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {structure.length > 0 ? (
          structure.map((item) => (
            <TreeNode
              key={item.id}
              node={item}
              level={0}
              contentNodes={contentNodes}
              onContentNodeClick={onContentNodeClick}
              activeNodeId={activeNodeId}
              currentPath={currentPath}
              onStructureUpdate={onStructureUpdate}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No navigation structure found</p>
          </div>
        )}
      </div>

      {/* Compact New Folder Button at Bottom */}
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

        {/* New folder input */}
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