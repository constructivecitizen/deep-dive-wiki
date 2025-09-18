import { useState } from "react";
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { ContentNode } from "@/components/HierarchicalContent";

interface ContentNavigationSidebarProps {
  contentNodes: ContentNode[];
  onNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
}

interface ContentTreeNodeProps {
  node: ContentNode;
  level: number;
  onNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
}

const ContentTreeNode = ({ node, level, onNodeClick, activeNodeId }: ContentTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;
  
  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleContentClick = () => {
    if (hasChildren) {
      toggleExpanded();
    }
  };

  const handleShowInMain = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  const paddingLeft = `${level * 12 + 8}px`;

  // Truncate content for display
  const displayContent = node.content.length > 60 
    ? `${node.content.substring(0, 60)}...`
    : node.content;

  const isActive = activeNodeId === node.id;

  return (
    <div className="animate-fade-in">
      <div 
        className={`flex items-center gap-2 py-2 px-3 hover:bg-secondary/50 cursor-pointer wiki-transition group ${
          isActive ? 'bg-primary/10 border-r-2 border-primary' : ''
        }`}
        style={{ paddingLeft }}
        onClick={handleContentClick}
      >
        <button 
          className="p-0.5 hover:bg-primary/10 rounded wiki-transition flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              toggleExpanded();
            }
          }}
          aria-label={hasChildren ? (isExpanded ? "Collapse content" : "Expand content") : "Content item"}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-hierarchy-hover" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-40" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className={`text-sm leading-relaxed ${
            isActive ? 'font-medium text-primary' : 'text-foreground group-hover:text-primary'
          } wiki-transition`}>
            {displayContent}
          </div>
          
          {/* Show depth indicator for very nested items */}
          {level > 2 && (
            <div className="text-xs text-muted-foreground mt-1">
              Level {level + 1}
            </div>
          )}
        </div>
        
        {/* Clickout button to show in main display */}
        <button
          onClick={handleShowInMain}
          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded wiki-transition flex-shrink-0"
          aria-label="Show in main display"
          title="Show in main display"
        >
          <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
        </button>
      </div>

      {isExpanded && hasChildren && (
        <div className="wiki-transition">
          {node.children!.map((child) => (
            <ContentTreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onNodeClick={onNodeClick}
              activeNodeId={activeNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ContentNavigationSidebar = ({ 
  contentNodes, 
  onNodeClick, 
  activeNodeId 
}: ContentNavigationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter nodes based on search query
  const filterNodes = (nodes: ContentNode[], query: string): ContentNode[] => {
    if (!query.trim()) return nodes;
    
    return nodes.filter(node => {
      const matchesContent = node.content.toLowerCase().includes(query.toLowerCase());
      const hasMatchingChildren = node.children && 
        filterNodes(node.children, query).length > 0;
      
      return matchesContent || hasMatchingChildren;
    });
  };

  const filteredNodes = filterNodes(contentNodes, searchQuery);

  return (
    <div className="h-full bg-card border-r border-border overflow-y-auto animate-fade-in">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg text-foreground mb-2">Content Navigation</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Hierarchical Content Explorer
        </p>
        
        {/* Search functionality */}
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>
      
      <div className="py-2">
        {filteredNodes.length > 0 ? (
          filteredNodes.map((node) => (
            <ContentTreeNode 
              key={node.id} 
              node={node} 
              level={0}
              onNodeClick={onNodeClick}
              activeNodeId={activeNodeId}
            />
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {searchQuery ? 'No matching content found' : 'No content available'}
          </div>
        )}
      </div>
    </div>
  );
};