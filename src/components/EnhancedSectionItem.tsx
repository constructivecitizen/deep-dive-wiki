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
  activeDocumentPath?: string | null;
}

export const EnhancedSectionItem: React.FC<EnhancedSectionItemProps> = ({
  section,
  depth,
  folderPath,
  sectionPosition,
  flatSections,
  currentPath,
  onSectionNavigate,
  activeSectionId,
  activeDocumentPath
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('Section clicked:', section.title, 'Current path:', currentPath, 'Folder path:', folderPath);
    
    // Check if we're already on the correct document
    const currentPathOnly = currentPath?.split('#')[0];
    const isOnSameDocument = currentPathOnly === folderPath;
    
    console.log('Is on same document:', isOnSameDocument);
    
    if (isOnSameDocument) {
      // Already on the document, just navigate to the section
      console.log('Calling onSectionNavigate with:', section.title);
      if (onSectionNavigate) {
        onSectionNavigate(section.title);
      }
    } else {
      // Navigate to the document first, then the section will be handled by URL hash
      console.log('Navigating to document with hash:', `${folderPath}#${section.id}`);
      navigate(`${folderPath}#${section.id}`);
    }
  };

  const hasChildren = section.children && section.children.length > 0;
  // Align 2nd level chevron with 1st level text, reduce increment for deeper levels
  const indentationPx = depth === 0 ? 16 : depth === 1 ? 36 : 36 + (depth - 1) * 16;
  
  // Check if this section is currently active - must match BOTH section ID AND document path
  const isActive = activeSectionId === section.id && activeDocumentPath === folderPath;

  return (
    <div className="text-sm">
      <div 
        className={`flex items-center gap-1 py-0.5 px-3 rounded cursor-pointer transition-colors ${
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
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
              activeDocumentPath={activeDocumentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};