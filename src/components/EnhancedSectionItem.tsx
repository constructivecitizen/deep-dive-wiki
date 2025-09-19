import React, { useState } from 'react';
import { HierarchicalDocumentSection } from '../lib/sectionHierarchy';
import { extractSectionFullContent } from '../lib/sectionContentExtractor';
import { DocumentSection } from '../services/contentService';

interface EnhancedSectionItemProps {
  section: HierarchicalDocumentSection;
  depth: number;
  folderPath: string;
  onSectionView?: (sectionData: { 
    content: string; 
    title: string; 
    level: number; 
    parentPath: string;
    sectionHierarchy?: Array<{
      title: string;
      level: number;
    }>;
  }) => void;
  sectionPosition: number;
  flatSections: DocumentSection[];
}

export const EnhancedSectionItem: React.FC<EnhancedSectionItemProps> = ({ 
  section, 
  depth, 
  folderPath, 
  onSectionView, 
  sectionPosition,
  flatSections 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = section.children.length > 0;
  const indentationPx = (depth + 2) * 16;

  const handleSectionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSectionView) {
      // Extract full content including all nested sections
      const sectionData = extractSectionFullContent(section, flatSections);
      
      onSectionView({
        ...sectionData,
        parentPath: folderPath
      });
    }
  };

  return (
    <div className="text-sm">
      <div 
        className="flex items-center gap-2 py-1 px-3 rounded cursor-pointer hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        style={{ marginLeft: `${indentationPx}px` }}
        onClick={handleSectionClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded(!isExpanded);
          }}
          className="flex-shrink-0"
        >
          <span className={`text-muted-foreground transform transition-transform duration-200 text-2xl origin-center ${
            isExpanded && hasChildren ? 'rotate-90' : ''
          }`}>
            ‣
          </span>
        </button>
        
        <span className="truncate flex-1" title={section.title}>
          {section.title}
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1">
          {section.children.map((child, index) => (
            <EnhancedSectionItem
              key={child.id}
              section={child}
              depth={depth + 1}
              folderPath={folderPath}
              onSectionView={onSectionView}
              sectionPosition={sectionPosition + index + 1}
              flatSections={flatSections}
            />
          ))}
        </div>
      )}
    </div>
  );
};