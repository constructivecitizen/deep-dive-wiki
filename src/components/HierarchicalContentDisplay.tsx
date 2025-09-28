import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { renderMarkdown } from '@/lib/markdownRenderer';
import { generateSectionId } from '@/lib/sectionUtils';

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
  onSectionClick?: (sectionId: string) => void;
  activeNodeId?: string;
  currentSectionId?: string;
  documentPath?: string;
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

const parseHierarchicalContent = (content: string): ContentSection[] => {
  const lines = content.split('\n');
  const sections: ContentSection[] = [];
  const stack: ContentSection[] = [];
  let currentContent = '';
  let sectionId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Support up to 30 levels of headers
    const headingMatch = line.match(/^(#{1,30})\s*(.+?)(?:\s*\[(.*?)\])?$/);
    
    if (headingMatch) {
      // Process any accumulated content for the previous section
      if (currentContent.trim() && stack.length > 0) {
        stack[stack.length - 1].content += currentContent;
      }
      currentContent = '';

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

  // Add any remaining content to the last section
  if (currentContent.trim() && stack.length > 0) {
    stack[stack.length - 1].content += currentContent;
  }

  return sections;
};

const ContentSectionComponent: React.FC<{
  section: ContentSection;
  depth: number;
  onSectionClick?: (sectionId: string) => void;
  activeNodeId?: string;
  documentPath?: string;
  siblingIndex?: number;
}> = ({ section, depth, onSectionClick, activeNodeId, documentPath, siblingIndex = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded by default
  const navigate = useNavigate();
  const location = useLocation();
  const hasChildren = section.children.length > 0;
  const hasContent = section.content.trim().length > 0;
  const isLeafNode = !hasChildren && !hasContent;
  // Check if this section is active based on the current hash
  const sectionHash = generateSectionId(section.title);
  const isActive = activeNodeId === sectionHash;

  const getHeadingClass = () => {
    // Calculate font size based on depth: 3rem for depth 0, 2rem for depth 1, then 0.2rem smaller each level, minimum 1rem
    const getFontSizeClass = (currentDepth: number) => {
      if (currentDepth === 0) return 'text-[2rem] leading-tight';
      if (currentDepth === 1) return 'text-[1.8rem] leading-snug';
      if (currentDepth === 2) return 'text-[1.6rem] leading-snug';
      if (currentDepth === 3) return 'text-[1.4rem] leading-normal';
      if (currentDepth === 4) return 'text-[1.2rem] leading-normal';
      if (currentDepth === 5) return 'text-base leading-normal';
      return 'text-base leading-normal'; // 1rem minimum for depth 6+
    };
    
    return `text-foreground font-medium ${getFontSizeClass(depth)} ${isActive ? 'bg-accent/20 rounded px-2 py-1' : ''}`;
  };

  // Calculate indentation: children align with parent's text (after the 24px button)
  const indentationPx = depth === 0 ? 0 : depth * 24; // 24px per level for child alignment
  const contentIndentationPx = indentationPx + 32; // 24px for button + 8px for gap to align with parent label text
  
  // Calculate color based on depth level (cycling through 6 colors)
  const getContentColorClass = (depth: number) => {
    const classes = ['content-level-1', 'content-level-2', 'content-level-3', 'content-level-4', 'content-level-5', 'content-level-6'];
    return classes[depth % 6];
  };
  
  const contentColorClass = getContentColorClass(depth);

  return (
    <div id={section.id}>
      <div 
        className="flex items-start gap-2 group"
        style={{ marginLeft: `${indentationPx}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-1 hover:bg-accent rounded transition-colors w-6 h-6 flex items-center justify-center"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          // Diamond bullet for leaf nodes with titles
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            <div className="w-2 h-2 border border-muted-foreground transform rotate-45"></div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className={`${getHeadingClass()} ${hasChildren ? 'cursor-pointer' : ''} flex-1`}
                onClick={() => {
                  if (onSectionClick) onSectionClick(section.id);
                  if (hasChildren) setIsExpanded(!isExpanded);
                }}>
              {section.title}
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Generate URL-safe section ID using the new utility
                const sectionId = generateSectionId(section.title);
                
                // Navigate to the section using the document path if provided
                const basePath = documentPath || location.pathname;
                const newPath = `${basePath}#${sectionId}`;
                navigate(newPath);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
              aria-label={`Navigate to ${section.title} section`}
            >
              <FileText size={16} />
            </button>
          </div>
          
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2">
          {hasContent && (
            <div 
              className={`prose prose-slate dark:prose-invert max-w-none prose-sm mb-4 p-3 rounded-md ${contentColorClass}`}
              style={{ marginLeft: `${contentIndentationPx}px` }}
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
                  siblingIndex={index}
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
  documentPath
}) => {
  
  // Clean tag syntax from content before parsing
  const cleanedContent = content.replace(/^(#+\s*.+?)\s*\[.*?\](\s*$)/gm, '$1$2');
  const sections = parseHierarchicalContent(content); // Use original content with tags for parsing

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
        {sections.map((section, index) => (
          <ContentSectionComponent
            key={section.id}
            section={section}
            depth={0}
            onSectionClick={onSectionClick}
            activeNodeId={activeNodeId}
            documentPath={documentPath}
            siblingIndex={index}
          />
        ))}
      </div>
    );
};