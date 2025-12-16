import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { renderMarkdown } from '@/lib/markdownRenderer';
import { getStampColors } from '@/lib/rubricConfig';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface ContentSection {
  level: number;
  title: string;
  content: string;
  tags: string[];
  children: ContentSection[];
  id: string;
}

interface HierarchicalContentDisplayProps {
  content: string;
  onSectionClick?: (sectionTitle: string) => void;
  activeNodeId?: string;
  currentSectionId?: string;
  documentPath?: string;
  documentTitle?: string;
  expandedSections?: Record<string, boolean>;
  defaultExpandDepth?: number;
  onToggleSection?: (sectionId: string, currentlyExpanded: boolean) => void;
  showDescriptions?: 'on' | 'off' | 'mixed';
  descriptionOverrides?: Record<string, boolean>;
  onToggleDescription?: (sectionId: string, currentlyVisible: boolean) => void;
}

// Helper function to extract full hierarchical content for a section
const extractSectionFullContent = (targetSection: ContentSection): string => {
  let fullContent = '';
  
  // Add the section's own content if it exists
  if (targetSection.content && targetSection.content.trim()) {
    fullContent += targetSection.content.trim() + '\n\n';
  }
  
  // Recursively extract all child content
  const extractChildrenContent = (section: ContentSection): string => {
    let childContent = '';
    for (const child of section.children) {
      const headerLevel = '#'.repeat(Math.max(1, child.level));
      childContent += `${headerLevel} ${child.title}\n\n`;
      
      if (child.content && child.content.trim()) {
        childContent += child.content.trim() + '\n\n';
      }
      
      // Recursively extract nested children
      childContent += extractChildrenContent(child);
    }
    return childContent;
  };
  
  fullContent += extractChildrenContent(targetSection);
  return fullContent.trim();
};

const parseHierarchicalContent = (content: string): { preContent: string; sections: ContentSection[] } => {
  const lines = content.split('\n');
  const sections: ContentSection[] = [];
  const stack: ContentSection[] = [];
  let currentContent = '';
  let preContent = '';
  let sectionId = 0;
  let hasSeenHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Support up to 30 levels of headers
    const headingMatch = line.match(/^(#{1,99})\s*(.+?)(?:\s*\[(.*?)\])?$/);
    
    if (headingMatch) {
      // Process any accumulated content
      if (currentContent.trim()) {
        if (!hasSeenHeader) {
          // This is content before the first header
          preContent = currentContent.trim();
        } else if (stack.length > 0) {
          // This is content for the previous section
          stack[stack.length - 1].content += currentContent;
        }
      }
      currentContent = '';
      hasSeenHeader = true;

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const tags = headingMatch[3] ? headingMatch[3].split(',').map(tag => tag.trim()) : [];
      
      const section: ContentSection = {
        level,
        title,
        content: '',
        tags,
        children: [],
        id: `section-${++sectionId}`
      };

      // Find the right parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        sections.push(section);
      } else {
        stack[stack.length - 1].children.push(section);
      }

      stack.push(section);
    } else {
      currentContent += line + '\n';
    }
  }

  // Add any remaining content
  if (currentContent.trim()) {
    if (!hasSeenHeader) {
      preContent = currentContent.trim();
    } else if (stack.length > 0) {
      stack[stack.length - 1].content += currentContent;
    }
  }

  return { preContent, sections };
};

const ContentSectionComponent: React.FC<{
  section: ContentSection;
  depth: number;
  onSectionClick?: (sectionTitle: string) => void;
  activeNodeId?: string;
  documentPath?: string;
  siblingIndex?: number;
  documentTitle?: string;
  expandedSections?: Record<string, boolean>;
  defaultExpandDepth?: number;
  onToggleSection?: (sectionId: string, currentlyExpanded: boolean) => void;
  showDescriptions?: 'on' | 'off' | 'mixed';
  descriptionOverrides?: Record<string, boolean>;
  onToggleDescription?: (sectionId: string, currentlyVisible: boolean) => void;
  parentWasManuallyExpanded?: boolean;
}> = ({ section, depth, onSectionClick, activeNodeId, documentPath, siblingIndex = 0, documentTitle, expandedSections, defaultExpandDepth, onToggleSection, showDescriptions = 'on', descriptionOverrides, onToggleDescription, parentWasManuallyExpanded = false }) => {
  // Determine initial expanded state
  const getInitialExpandedState = () => {
    // If parent was manually expanded, children start collapsed
    if (parentWasManuallyExpanded) {
      return false;
    }
    if (expandedSections && section.id in expandedSections) {
      return expandedSections[section.id];
    }
    if (defaultExpandDepth !== undefined) {
      return depth < defaultExpandDepth;
    }
    return true; // Default to expanded
  };
  
  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState);
  const [wasManuallyExpanded, setWasManuallyExpanded] = useState(false);
  
  // Update when external control changes
  React.useEffect(() => {
    if (expandedSections && section.id in expandedSections) {
      setIsExpanded(expandedSections[section.id]);
    } else if (defaultExpandDepth !== undefined) {
      setIsExpanded(depth < defaultExpandDepth);
    }
  }, [expandedSections, defaultExpandDepth, section.id, depth]);
  
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (onToggleSection) {
      onToggleSection(section.id, isExpanded);
    } else {
      setIsExpanded(newExpanded);
    }
    // Track that this was manually expanded so children stay collapsed
    if (newExpanded) {
      setWasManuallyExpanded(true);
    }
  };
  
  const hasChildren = section.children.length > 0;
  const hasContent = section.content.trim().length > 0;
  const isLeafNode = !hasChildren && !hasContent;
  // Check if this is the document title section (first section at depth 0)
  const isDocumentTitle = depth === 0 && siblingIndex === 0 && documentTitle && section.title === documentTitle;

  const getHeadingClass = () => {
    // Calculate font size based on depth: 3rem for depth 0, 2rem for depth 1, then 0.2rem smaller each level, minimum 1rem
    const getFontSizeClass = (currentDepth: number) => {
      if (currentDepth === 0) return 'text-xl font-semibold leading-relaxed'; // 1.25rem
      if (currentDepth === 1) return 'text-lg font-medium leading-relaxed'; // 1.125rem
      if (currentDepth === 2) return 'text-base font-medium leading-normal'; // 1rem
      if (currentDepth === 3) return 'text-sm font-medium leading-normal'; // 0.875rem
      return 'text-sm leading-normal'; // 0.875rem minimum for depth 4+
    };
    
    return `text-foreground ${getFontSizeClass(depth)}`;
  };

  // Helper to render title with rubric/slug styling as stamps
  const renderTitleWithRubric = (title: string) => {
    const colonIndex = title.indexOf(':');
    if (colonIndex === -1 || colonIndex > 20) {
      return <>{title}</>;
    }
    
    const rubric = title.substring(0, colonIndex);
    const rest = title.substring(colonIndex + 1).trim();
    const colors = getStampColors(rubric);
    
    return (
      <span className="inline">
        <span>{rest}</span>
        <span 
          className={`inline-flex items-center justify-center w-[90px] px-1.5 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wider align-middle ml-2 ${colors.bg} ${colors.text} ${colors.border}`}
        >
          {rubric}
        </span>
      </span>
    );
  };

  // Calculate indentation: children align with parent's text (after the chevron + gap)
  const chevronAndGapWidth = 25; // 16px chevron + 9px gap
  const indentationPx = depth === 0 ? 0 : depth * chevronAndGapWidth;
  const contentIndentationPx = indentationPx + chevronAndGapWidth + 3; // +3px for better alignment
  
  // Calculate color based on depth level (cycling through 6 colors)
  const getContentColorClass = (depth: number) => {
    const classes = ['content-level-1', 'content-level-2', 'content-level-3', 'content-level-4', 'content-level-5', 'content-level-6'];
    return classes[depth % 6];
  };
  
  const contentColorClass = getContentColorClass(depth);

  // Determine if content should be visible
  const getContentVisibility = () => {
    if (showDescriptions === 'off') return false;
    if (showDescriptions === 'on') return true;
    // mixed mode - check overrides
    if (descriptionOverrides && section.id in descriptionOverrides) {
      return descriptionOverrides[section.id];
    }
    return true; // Default to visible
  };

  const isContentVisible = getContentVisibility();

  // If this is the document title section, render as page title
  if (isDocumentTitle) {
    return (
      <div id={section.id}>
        <h1 className="text-3xl font-bold text-foreground mb-6">
          {renderTitleWithRubric(section.title)}
        </h1>
        
        {hasContent && (
          <div 
            className="prose prose-slate dark:prose-invert max-w-none mb-6"
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdown(section.content.trim()) 
            }}
          />
        )}
        
        {hasChildren && (
          <div className="space-y-2">
            {section.children.map((child, index) => (
              <ContentSectionComponent
                key={child.id}
                section={child}
                depth={depth + 1}
                onSectionClick={onSectionClick}
                activeNodeId={activeNodeId}
                documentPath={documentPath}
                documentTitle={documentTitle}
                siblingIndex={index}
                expandedSections={expandedSections}
                defaultExpandDepth={defaultExpandDepth}
                onToggleSection={onToggleSection}
                showDescriptions={showDescriptions}
                descriptionOverrides={descriptionOverrides}
                onToggleDescription={onToggleDescription}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${documentPath || ''}#${section.id}`;
    window.open(url, '_blank');
  };

  return (
    <div id={section.id}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div 
            className="flex items-center group"
            style={{ marginLeft: `${indentationPx}px`, gap: '9px' }}
          >
            <button
              onClick={handleToggle}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-start"
              aria-label={isExpanded ? "Collapse section" : "Expand section"}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <h1 className={`${getHeadingClass()} cursor-pointer hover:text-primary transition-colors`}
                  onClick={() => {
                    if (onSectionClick) {
                      onSectionClick(section.title);
                    }
                  }}>
                {renderTitleWithRubric(section.title)}
              </h1>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleOpenInNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in new tab
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Show content area when expanded OR when at boundary depth with descriptions on */}
      {(isExpanded || (defaultExpandDepth !== undefined && depth === defaultExpandDepth && isContentVisible && hasContent)) && (
        <div className="mt-2">
          {hasContent && isContentVisible && (
            <div 
              className={`prose prose-slate dark:prose-invert max-w-none prose-sm mb-4 py-[7px] px-[9px] rounded-md ${contentColorClass}`}
              style={{ marginLeft: `${contentIndentationPx}px` }}
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(section.content.trim()) 
              }}
            />
          )}
          
          {hasChildren && isExpanded && (
            <div className="space-y-2">
              {section.children.map((child, index) => (
                <ContentSectionComponent
                  key={child.id}
                  section={child}
                  depth={depth + 1}
                  onSectionClick={onSectionClick}
                  activeNodeId={activeNodeId}
                  documentPath={documentPath}
                  documentTitle={documentTitle}
                  siblingIndex={index}
                  expandedSections={expandedSections}
                  defaultExpandDepth={defaultExpandDepth}
                  onToggleSection={onToggleSection}
                  showDescriptions={showDescriptions}
                  descriptionOverrides={descriptionOverrides}
                  onToggleDescription={onToggleDescription}
                  parentWasManuallyExpanded={wasManuallyExpanded}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const HierarchicalContentDisplay: React.FC<HierarchicalContentDisplayProps> = ({ 
  content, 
  onSectionClick, 
  activeNodeId, 
  currentSectionId, 
  documentPath,
  documentTitle,
  expandedSections,
  defaultExpandDepth,
  onToggleSection,
  showDescriptions,
  descriptionOverrides,
  onToggleDescription
}) => {
  
  // Clean tag syntax from content before parsing
  const cleanedContent = content.replace(/^(#+\s*.+?)\s*\[.*?\](\s*$)/gm, '$1$2');
  const { preContent, sections } = parseHierarchicalContent(content); // Use original content with tags for parsing

  if (sections.length === 0) {
    return (
      <div 
        className="prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanedContent) }}
      />
    );
  }

    return (
      <div className="space-y-4">
        {preContent && (
          <div 
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(preContent) }}
          />
        )}
        {sections.map((section, index) => (
          <ContentSectionComponent
            key={section.id}
            section={section}
            depth={0}
            onSectionClick={onSectionClick}
            activeNodeId={activeNodeId}
            documentPath={documentPath}
            documentTitle={documentTitle}
            siblingIndex={index}
            expandedSections={expandedSections}
            defaultExpandDepth={defaultExpandDepth}
            onToggleSection={onToggleSection}
            showDescriptions={showDescriptions}
            descriptionOverrides={descriptionOverrides}
            onToggleDescription={onToggleDescription}
          />
        ))}
      </div>
    );
};