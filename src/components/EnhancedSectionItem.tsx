import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { HierarchicalDocumentSection } from '../lib/sectionHierarchy';
import { useNavigate } from 'react-router-dom';

interface EnhancedSectionItemProps {
  section: HierarchicalDocumentSection;
  depth: number;
  folderPath: string;
  sectionPosition: number;
  flatSections: any[];
  currentPath?: string;
  onSectionNavigate?: (sectionTitle: string) => void;
  activeSectionId?: string | null;
}

export const EnhancedSectionItem: React.FC<EnhancedSectionItemProps> = ({
  section,
  depth,
  folderPath,
  sectionPosition,
  flatSections,
  currentPath,
  onSectionNavigate,
  activeSectionId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Navigate to the document first if not already there
    const currentPathOnly = currentPath?.split('#')[0];
    if (currentPathOnly !== folderPath) {
      navigate(folderPath);
    }
    
    // Call the section navigate callback with the section title
    if (onSectionNavigate) {
      onSectionNavigate(section.title);
    }
  };

  const hasChildren = section.children && section.children.length > 0;
  const indentationPx = (depth + 2) * 16;
  
  // Check if this section is currently active using the section ID
  const isActive = activeSectionId === section.id;

  return (
    <div className="text-sm">
      <div 
        className={`flex items-center gap-2 py-0.5 px-3 rounded cursor-pointer transition-colors ${
          isActive
            ? 'bg-primary/10 border-l-2 border-l-primary text-primary' 
            : 'hover:bg-accent text-muted-foreground hover:text-foreground'
        }`}
        style={{ marginLeft: `${indentationPx}px` }}
        onClick={handleSectionClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded(!isExpanded);
          }}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded transition-colors"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-2 h-2 border border-muted-foreground transform rotate-45"></div>
          )}
        </button>
        
        <span className="truncate flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={section.title}>
          {section.title}
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1">
          {section.children.map((child, index) => (
            <EnhancedSectionItem
              key={`${child.title}-${index}`}
              section={child}
              depth={depth + 1}
              folderPath={folderPath}
              sectionPosition={sectionPosition + index + 1}
              flatSections={flatSections}
              currentPath={currentPath}
              onSectionNavigate={onSectionNavigate}
              activeSectionId={activeSectionId}
            />
          ))}
        </div>
      )}
    </div>
  );
};