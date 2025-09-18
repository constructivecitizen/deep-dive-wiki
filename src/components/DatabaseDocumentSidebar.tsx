import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavigationNode, ContentNode } from "@/services/contentService";

interface DatabaseDocumentSidebarProps {
  structure: NavigationNode[];
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  currentPath?: string;
}

interface TreeNodeProps {
  node: NavigationNode;
  level: number;
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  currentPath?: string;
}

const TreeNode = ({ node, level, contentNodes, onContentNodeClick, activeNodeId, currentPath }: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(level < 2);
  const navigate = useNavigate();
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
      // For folders, navigate to the folder page and toggle expansion
      navigate(node.path);
      setExpanded(!expanded);
    } else {
      // For documents, navigate to the path
      navigate(node.path);
    }
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
      >
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

        {/* Title */}
        <span className={`flex-1 text-sm truncate ${
          isActive ? 'text-primary font-medium' : 'text-foreground group-hover:text-foreground/80'
        }`}>
          {node.title}
        </span>

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
            />
          ))}
        </div>
      )}
    </>
  );
};

export const DatabaseDocumentSidebar = ({ 
  structure, 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId,
  currentPath
}: DatabaseDocumentSidebarProps) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Navigation</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Browse through the documentation structure
        </p>
      </div>

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
            />
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No navigation structure found</p>
          </div>
        )}
      </div>

    </div>
  );
};