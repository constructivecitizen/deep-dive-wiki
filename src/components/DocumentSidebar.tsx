import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { buildSectionHierarchy, HierarchicalDocumentSection } from '../lib/sectionHierarchy';

interface DocumentSidebarProps {
  document: {
    content_json?: {
      sections?: Array<{
        id?: string;
        level?: number;
        title?: string;
        content?: string;
        tags?: string[];
      }>;
    };
  };
  onSectionClick?: (sectionId: string) => void;
  activeSectionId?: string;
}


const SectionItem: React.FC<{
  section: HierarchicalDocumentSection;
  depth: number;
  onSectionClick?: (sectionId: string) => void;
  activeSectionId?: string;
}> = ({ section, depth, onSectionClick, activeSectionId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = section.children.length > 0;
  const isActive = activeSectionId === section.id;

  const indentationPx = depth * 20; // Increased for better visual hierarchy

  return (
    <div className="text-sm">
      <div 
        className={`flex items-center gap-2 py-1 px-3 rounded cursor-pointer hover:bg-accent transition-colors ${
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        style={{ marginLeft: `${indentationPx}px` }}
        onClick={() => {
          if (onSectionClick) onSectionClick(section.id);
          if (hasChildren) setIsExpanded(!isExpanded);
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
          </div>
        )}
        
        <span className="truncate flex-1" title={section.title}>
          {section.title}
        </span>
        
        {section.tags.length > 0 && (
          <span className="text-xs bg-secondary text-secondary-foreground px-1 py-0.5 rounded flex-shrink-0">
            {section.tags.length}
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1">
          {section.children.map((child) => (
            <SectionItem
              key={child.id}
              section={child}
              depth={depth + 1}
              onSectionClick={onSectionClick}
              activeSectionId={activeSectionId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  document,
  onSectionClick,
  activeSectionId
}) => {
  // Build hierarchical sections from document content
  const rawSections = document.content_json?.sections || [];
  const flatSections = rawSections.map((section, index) => ({
    id: section.id || `section-${index}`,
    level: section.level || 1,
    title: section.title || '',
    content: section.content || '',
    tags: section.tags || []
  }));
  
  const hierarchicalSections = buildSectionHierarchy(flatSections);

  if (hierarchicalSections.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        No hierarchical sections found
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">
        Document Outline
      </div>
      {hierarchicalSections.map((section) => (
        <SectionItem
          key={section.id}
          section={section}
          depth={0}
          onSectionClick={onSectionClick}
          activeSectionId={activeSectionId}
        />
      ))}
    </div>
  );
};