import { useState } from "react";
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Tag } from "./Tag";
import { ContentEditor } from "./ContentEditor";

export interface ContentNode {
  id: string;
  content: string;
  children?: ContentNode[];
  tags?: string[];
  depth: number;
  path?: string; // For drill-down pages
}

interface HierarchicalContentProps {
  node: ContentNode;
  showTags?: boolean;
  editMode?: boolean;
  onNodeUpdate?: (updatedNode: ContentNode) => void;
}

interface ContentItemProps {
  node: ContentNode;
  showTags?: boolean;
  editMode?: boolean;
  onNodeUpdate?: (updatedNode: ContentNode) => void;
}

const ContentItem = ({ node, showTags = true, editMode = false, onNodeUpdate }: ContentItemProps) => {
  const [isExpanded, setIsExpanded] = useState(node.depth < 3); // Auto-expand first 3 levels
  const hasChildren = node.children && node.children.length > 0;

  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const getDepthStyling = (depth: number) => {
    const baseClasses = "wiki-transition border-l-2 pl-4 ml-2";
    if (depth === 1) return `${baseClasses} depth-1`;
    if (depth === 2) return `${baseClasses} depth-2`;
    if (depth >= 3) return `${baseClasses} depth-3`;
    return baseClasses;
  };

  return (
    <div className={node.depth > 0 ? getDepthStyling(node.depth) : ""}>
      <div className="group py-3">
        <div className="flex items-start gap-3">
          {hasChildren && (
            <button
              onClick={toggleExpanded}
              className="mt-1 p-1 hover:bg-primary/10 rounded wiki-transition flex-shrink-0"
              aria-label={isExpanded ? "Collapse content" : "Expand content"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-hierarchy-hover" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-foreground leading-relaxed">{node.content}</p>
                
                {showTags && node.tags && node.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {node.tags.map((tag, index) => (
                      <Tag key={index} text={tag} />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {editMode && (
                  <ContentEditor
                    node={node}
                    onSave={(updatedNode) => onNodeUpdate?.(updatedNode)}
                  />
                )}
                {node.path && (
                  <Link
                    to={node.path}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 rounded wiki-transition flex-shrink-0"
                    title="Open dedicated page"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="hidden sm:inline">View</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2 space-y-1">
            {node.children!.map((child) => (
              <ContentItem key={child.id} node={child} showTags={showTags} editMode={editMode} onNodeUpdate={onNodeUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const HierarchicalContent = ({ node, showTags = true, editMode = false, onNodeUpdate }: HierarchicalContentProps) => {
  return (
    <div className="space-y-2">
      <ContentItem node={node} showTags={showTags} editMode={editMode} onNodeUpdate={onNodeUpdate} />
    </div>
  );
};