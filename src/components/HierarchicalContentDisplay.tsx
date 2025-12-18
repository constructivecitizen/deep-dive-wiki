import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { renderMarkdown } from '@/lib/markdownRenderer';
import { getStampColors, getRubricOrderIndex } from '@/lib/rubricConfig';
import { SourcesIndicator } from './SourcesIndicator';
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
  sources?: string[];
}

interface HierarchicalContentDisplayProps {
  content: string;
  onSectionClick?: (sectionTitle: string) => void;
  onInternalLinkClick?: (target: string) => void;
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

// Helper to parse title and extract rubric if present
const parseRubric = (title: string): { rubric: string | null; text: string } => {
  const colonIndex = title.indexOf(':');
  if (colonIndex === -1 || colonIndex > 20) {
    return { rubric: null, text: title };
  }
  return {
    rubric: title.substring(0, colonIndex),
    text: title.substring(colonIndex + 1).trim()
  };
};

// Group children by rubric and sort by rubric order
interface RubricGroup {
  rubric: string | null;
  items: ContentSection[];
}

const groupChildrenByRubric = (children: ContentSection[]): RubricGroup[] => {
  const groups: Map<string | null, ContentSection[]> = new Map();
  
  // Group items by their rubric
  for (const child of children) {
    const { rubric } = parseRubric(child.title);
    const normalizedRubric = rubric?.toLowerCase().trim() || null;
    
    if (!groups.has(normalizedRubric)) {
      groups.set(normalizedRubric, []);
    }
    groups.get(normalizedRubric)!.push(child);
  }
  
  // Convert to array and sort by rubric order
  const result: RubricGroup[] = [];
  for (const [rubric, items] of groups.entries()) {
    result.push({ rubric, items });
  }
  
  result.sort((a, b) => getRubricOrderIndex(a.rubric) - getRubricOrderIndex(b.rubric));
  
  return result;
};

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

// Helper to extract sources from content
const extractSources = (content: string): { cleanContent: string; sources: string[] } => {
  const sourcesRegex = /<!--\s*sources:\s*(.+?)\s*-->/gi;
  const sources: string[] = [];
  
  let cleanContent = content.replace(sourcesRegex, (match, urlList) => {
    // Split by comma and clean up each URL
    const urls = urlList.split(',').map((url: string) => url.trim()).filter(Boolean);
    sources.push(...urls);
    return ''; // Remove the comment from content
  });
  
  return { cleanContent: cleanContent.trim(), sources };
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
          // This is content for the previous section - extract sources
          const { cleanContent, sources } = extractSources(currentContent);
          stack[stack.length - 1].content += cleanContent;
          if (sources.length > 0) {
            stack[stack.length - 1].sources = [
              ...(stack[stack.length - 1].sources || []),
              ...sources
            ];
          }
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
        id: `section-${++sectionId}`,
        sources: []
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
      const { cleanContent, sources } = extractSources(currentContent);
      stack[stack.length - 1].content += cleanContent;
      if (sources.length > 0) {
        stack[stack.length - 1].sources = [
          ...(stack[stack.length - 1].sources || []),
          ...sources
        ];
      }
    }
  }

  return { preContent, sections };
};

// Render a rubric slug header
const RubricSlug: React.FC<{ rubric: string; linePositionPx: number }> = ({ rubric, linePositionPx }) => {
  const colors = getStampColors(rubric);
  return (
    <div 
      className={`inline-flex items-center px-1.5 py-0.5 rounded-t-md border-b-2 text-[10px] font-semibold uppercase tracking-wider mb-2.5 ${colors.bg} ${colors.text} ${colors.border}`}
      style={{ marginLeft: `${linePositionPx}px` }}
    >
      {rubric}
    </div>
  );
};

const ContentSectionComponent: React.FC<{
  section: ContentSection;
  depth: number;
  onSectionClick?: (sectionTitle: string) => void;
  onInternalLinkClick?: (target: string) => void;
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
  showRubricVisuals?: boolean;
}> = ({ section, depth, onSectionClick, onInternalLinkClick, activeNodeId, documentPath, siblingIndex = 0, documentTitle, expandedSections, defaultExpandDepth, onToggleSection, showDescriptions = 'on', descriptionOverrides, onToggleDescription, parentWasManuallyExpanded = false, showRubricVisuals = true }) => {
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
      if (currentDepth === 0) return 'text-xl font-semibold leading-relaxed underline decoration-1 underline-offset-4'; // 1.25rem - underlined
      if (currentDepth === 1) return 'text-lg font-medium leading-relaxed'; // 1.125rem
      if (currentDepth === 2) return 'text-base font-medium leading-normal'; // 1rem
      if (currentDepth === 3) return 'text-sm font-medium leading-normal'; // 0.875rem
      return 'text-sm leading-normal'; // 0.875rem minimum for depth 4+
    };
    
    return `text-foreground ${getFontSizeClass(depth)}`;
  };

  // Legacy helper for document title
  const renderTitleWithRubric = (title: string) => {
    const { rubric, text } = parseRubric(title);
    if (!rubric) {
      return <>{title}</>;
    }
    const colors = getStampColors(rubric);
    return (
      <span className="inline-flex items-center gap-2">
        <span>{text}</span>
        <span 
          className={`inline-flex items-center justify-center w-[90px] px-1.5 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
        >
          {rubric}
        </span>
      </span>
    );
  };

  // Calculate indentation: children align with parent's text (after the chevron + gap)
  const chevronAndGapWidth = 17; // 16px chevron + 1px gap
  const indentationPx = depth === 0 ? 0 : depth * chevronAndGapWidth;
  const contentIndentationPx = indentationPx + chevronAndGapWidth + 3; // Reduced gap between line and content
  
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

  // Handle clicks on internal links within content
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[data-internal-link]');
    
    if (link) {
      e.preventDefault();
      const linkTarget = link.getAttribute('data-internal-link');
      if (linkTarget && onInternalLinkClick) {
        onInternalLinkClick(linkTarget);
      }
    }
  };

  // If this is the document title section, render as page title
  if (isDocumentTitle) {
    return (
      <div id={section.id}>
        <h1 className="text-3xl font-bold text-foreground mb-6">
          {renderTitleWithRubric(section.title)}
        </h1>
        
        {hasContent && (
          <div className="mb-6 py-4 border-b-2 border-border/50">
            <span 
              className="prose prose-slate dark:prose-invert max-w-none text-base text-muted-foreground italic [&>p]:inline"
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(section.content.trim()) 
              }}
            />
            {section.sources && section.sources.length > 0 && (
              <SourcesIndicator sources={section.sources} />
            )}
          </div>
        )}
        
        {hasChildren && (
          <div className="space-y-4">
            {renderGroupedChildren(
              section.children, 
              depth + 1, 
              onSectionClick, 
              onInternalLinkClick,
              activeNodeId, 
              documentPath, 
              documentTitle, 
              expandedSections, 
              defaultExpandDepth, 
              onToggleSection, 
              showDescriptions, 
              descriptionOverrides, 
              onToggleDescription, 
              false,
              true // Document title's children ARE the top level, so always show rubric visuals
            )}
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
            className="flex items-start group"
            style={{ marginLeft: `${indentationPx}px`, gap: '9px' }}
          >
            <button
              onClick={handleToggle}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-start mt-[6px]"
              aria-label={isExpanded ? "Collapse section" : "Expand section"}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <h1 className={`${getHeadingClass()} cursor-pointer`}
                  onClick={() => {
                    if (onSectionClick) {
                      onSectionClick(section.title);
                    }
                  }}>
                {parseRubric(section.title).text}
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

      {/* Show content area when expanded OR when content is visible (descriptions on) and has content */}
      {(isExpanded || (isContentVisible && hasContent)) && (
        <div className="mt-2">
          {hasContent && isContentVisible && (
            <div 
              className={`mb-4 py-[7px] px-[9px] rounded-md ${contentColorClass}`}
              style={{ marginLeft: `${contentIndentationPx}px` }}
            >
              <span 
                className="prose prose-slate dark:prose-invert max-w-none prose-sm [&>p]:inline"
                onClick={handleContentClick}
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(section.content.trim()) 
                }}
              />
              {section.sources && section.sources.length > 0 && (
                <SourcesIndicator sources={section.sources} />
              )}
            </div>
          )}
          
          {hasChildren && isExpanded && (
            <div className="space-y-4 pb-3">
              {renderGroupedChildren(
                section.children, 
                depth + 1, 
                onSectionClick, 
                onInternalLinkClick,
                activeNodeId, 
                documentPath, 
                documentTitle, 
                expandedSections, 
                defaultExpandDepth, 
                onToggleSection, 
                showDescriptions, 
                descriptionOverrides, 
                onToggleDescription, 
                wasManuallyExpanded,
                showRubricVisuals // Pass through - will be false if already shown at higher level
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to render children grouped by rubric
const renderGroupedChildren = (
  children: ContentSection[],
  depth: number,
  onSectionClick?: (sectionTitle: string) => void,
  onInternalLinkClick?: (target: string) => void,
  activeNodeId?: string,
  documentPath?: string,
  documentTitle?: string,
  expandedSections?: Record<string, boolean>,
  defaultExpandDepth?: number,
  onToggleSection?: (sectionId: string, currentlyExpanded: boolean) => void,
  showDescriptions?: 'on' | 'off' | 'mixed',
  descriptionOverrides?: Record<string, boolean>,
  onToggleDescription?: (sectionId: string, currentlyVisible: boolean) => void,
  parentWasManuallyExpanded?: boolean,
  showRubricVisuals: boolean = true // Only show slugs/lines at the topmost level
) => {
  const groups = groupChildrenByRubric(children);
  const chevronAndGapWidth = 17;
  // Align slug with the chevrons of items at this depth
  const indentationPx = depth === 0 ? 0 : depth * chevronAndGapWidth;
  // Vertical line positioned to abut the left edge of content bubbles
  const linePositionPx = indentationPx + chevronAndGapWidth - 10; // 1px from chevron tip
  
  return groups.map((group, groupIndex) => {
    // Show rubric visuals only at the topmost level where they appear
    if (group.rubric && showRubricVisuals) {
      const colors = getStampColors(group.rubric);
      return (
        <div key={`group-${groupIndex}-${group.rubric}`} className="relative">
          {/* Render rubric slug header */}
          <RubricSlug rubric={group.rubric} linePositionPx={linePositionPx} />
          
          {/* Vertical line container */}
          <div className="relative">
            {/* Subtle vertical line matching rubric color */}
            <div 
              className={`absolute -top-2.5 bottom-1 w-[2px] rounded-b-full opacity-50 ${colors.line}`}
              style={{ left: `${linePositionPx}px` }}
            />
            
            {/* Render all items in this group */}
            {group.items.map((child, index) => (
              <ContentSectionComponent
                key={child.id}
                section={child}
                depth={depth}
                onSectionClick={onSectionClick}
                onInternalLinkClick={onInternalLinkClick}
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
                parentWasManuallyExpanded={parentWasManuallyExpanded}
                showRubricVisuals={false} // Disable rubric visuals for nested levels
              />
            ))}
          </div>
        </div>
      );
    }
    
    // No rubric OR rubric visuals disabled - render items directly without wrapper
    // (ordering by rubric is still maintained from groupChildrenByRubric)
    return (
      <div key={`group-${groupIndex}-${group.rubric || 'none'}`}>
        {group.items.map((child, index) => (
          <ContentSectionComponent
            key={child.id}
            section={child}
            depth={depth}
            onSectionClick={onSectionClick}
            onInternalLinkClick={onInternalLinkClick}
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
            parentWasManuallyExpanded={parentWasManuallyExpanded}
            showRubricVisuals={showRubricVisuals} // Pass through for non-rubric groups
          />
        ))}
      </div>
    );
  });
};
export const HierarchicalContentDisplay: React.FC<HierarchicalContentDisplayProps> = ({ 
  content, 
  onSectionClick,
  onInternalLinkClick,
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

  // Handle clicks on internal links within pre-content
  const handlePreContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[data-internal-link]');
    
    if (link) {
      e.preventDefault();
      const linkTarget = link.getAttribute('data-internal-link');
      if (linkTarget && onInternalLinkClick) {
        onInternalLinkClick(linkTarget);
      }
    }
  };

  if (sections.length === 0) {
    return (
      <div 
        className="prose prose-slate dark:prose-invert max-w-none"
        onClick={handlePreContentClick}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanedContent) }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {preContent && (
        <div className="mb-6 py-4 border-b-2 border-border/50">
          <span 
            className="prose prose-slate dark:prose-invert max-w-none text-base text-muted-foreground italic [&>p]:inline"
            onClick={handlePreContentClick}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(preContent) }}
          />
        </div>
      )}
      {renderGroupedChildren(
        sections,
        0,
        onSectionClick,
        onInternalLinkClick,
        activeNodeId,
        documentPath,
        documentTitle,
        expandedSections,
        defaultExpandDepth,
        onToggleSection,
        showDescriptions,
        descriptionOverrides,
        onToggleDescription,
        false,
        true // Top level always shows rubric visuals
      )}
    </div>
  );
};