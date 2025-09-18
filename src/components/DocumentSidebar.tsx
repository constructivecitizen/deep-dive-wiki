import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from "lucide-react";
import { NavLink } from "react-router-dom";

export interface DocumentStructure {
  id: string;
  title: string;
  type: "document" | "folder";
  path: string;
  children?: DocumentStructure[];
}

interface DocumentSidebarProps {
  structure: DocumentStructure[];
}

interface TreeNodeProps {
  node: DocumentStructure;
  level: number;
}

const TreeNode = ({ node, level }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first two levels
  const hasChildren = node.children && node.children.length > 0;
  
  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
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
        className="flex items-center gap-2 py-2 px-3 hover:bg-secondary/50 cursor-pointer wiki-transition group"
        style={{ paddingLeft }}
        onClick={toggleExpanded}
      >
        {hasChildren && (
          <button className="p-0.5 hover:bg-primary/10 rounded wiki-transition">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        
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
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DocumentSidebar = ({ structure }: DocumentSidebarProps) => {
  return (
    <div className="h-full bg-card border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg text-foreground">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground mt-1">Hierarchical Documentation</p>
      </div>
      
      <div className="py-2">
        {structure.map((node) => (
          <TreeNode key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
};