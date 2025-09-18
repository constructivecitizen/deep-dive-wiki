import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, ExternalLink } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ContentNode } from "@/components/HierarchicalContent";

export interface DocumentStructure {
  id: string;
  title: string;
  type: "document" | "folder";
  path: string;
  children?: DocumentStructure[];
}

interface DocumentSidebarProps {
  structure: DocumentStructure[];
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
}

interface TreeNodeProps {
  node: DocumentStructure;
  level: number;
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
}

const TreeNode = ({ node, level, contentNodes, onContentNodeClick, activeNodeId }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first two levels
  const hasChildren = node.children && node.children.length > 0;
  
  // Find if this document has corresponding content nodes
  const hasContentNodes = contentNodes && contentNodes.length > 0 && 
    (node.path === "/tagging-strategies" || node.path === "/hierarchy-systems");
  
  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleShowContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onContentNodeClick && contentNodes && contentNodes.length > 0) {
      // For now, show the root content node when clicking the page
      onContentNodeClick(contentNodes[0].id);
    }
  };

  const getIcon = () => {
    if (node.type === "folder") {
      return isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const paddingLeft = `${level * 12}px`;

  return (
    <div className="wiki-transition">
      <div 
        className="flex items-center gap-2 py-2 px-3 hover:bg-secondary/50 wiki-transition group"
        style={{ paddingLeft }}
      >
        <button 
          className="p-0.5 hover:bg-primary/10 rounded wiki-transition flex-shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              toggleExpanded();
            }
          }}
          aria-label={hasChildren ? (isExpanded ? "Collapse" : "Expand") : "No children"}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-40" />
          )}
        </button>
        
        <div className="text-muted-foreground group-hover:text-primary wiki-transition">
          {getIcon()}
        </div>
        
        {node.type === "document" ? (
          <NavLink 
            to={node.path}
            className={({ isActive }) => `
              flex-1 text-sm font-medium wiki-transition
              ${isActive 
                ? "text-primary font-semibold" 
                : "text-foreground hover:text-primary"
              }
            `}
            onClick={(e) => {
              if (hasContentNodes && onContentNodeClick && contentNodes) {
                e.preventDefault();
                onContentNodeClick(contentNodes[0].id);
              }
            }}
          >
            {node.title}
          </NavLink>
        ) : (
          <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary wiki-transition">
            {node.title}
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="wiki-transition">
          {node.children!.map((child) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              contentNodes={contentNodes}
              onContentNodeClick={onContentNodeClick}
              activeNodeId={activeNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DocumentSidebar = ({ 
  structure, 
  contentNodes, 
  onContentNodeClick, 
  activeNodeId 
}: DocumentSidebarProps) => {
  return (
    <div className="h-full bg-card border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg text-foreground">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground mt-1">Hierarchical Documentation</p>
      </div>
      
      <div className="py-2">
        {structure.map((node) => (
          <TreeNode 
            key={node.id} 
            node={node} 
            level={0} 
            contentNodes={contentNodes}
            onContentNodeClick={onContentNodeClick}
            activeNodeId={activeNodeId}
          />
        ))}
      </div>
    </div>
  );
};