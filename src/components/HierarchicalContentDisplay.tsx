import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { renderMarkdown } from '@/lib/markdownRenderer';

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
  testProp?: string;
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
}> = ({ section, depth, onSectionClick, activeNodeId }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded by default
  const navigate = useNavigate();
  const location = useLocation();
  const hasChildren = section.children.length > 0;
  const hasContent = section.content.trim().length > 0;
  const isLeafNode = !hasChildren && !hasContent;
  const isActive = activeNodeId === section.id;

  const getHeadingClass = (level: number) => {
    // All text should be normal weight and size - no bold headers
    return `text-foreground font-normal text-base ${isActive ? 'bg-accent/20 rounded px-2 py-1' : ''}`;
  };

  // Calculate indentation: children align with parent's text (after the 24px button)
  const indentationPx = depth === 0 ? 0 : depth * 24; // 24px per level for child alignment
  const contentIndentationPx = indentationPx + 32; // 24px for button + 8px for gap to align with parent label text

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
            <h1 className={`${getHeadingClass(section.level)} ${hasChildren ? 'cursor-pointer' : ''} flex-1`}
                onClick={() => {
                  if (onSectionClick) onSectionClick(section.id);
                  if (hasChildren) setIsExpanded(!isExpanded);
                }}>
              {section.title}
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Create a URL-safe section ID from the title
                const sectionId = section.title.toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '');
                
                // Navigate to the same page with the section hash
                const newPath = `${location.pathname}#${sectionId}`;
                navigate(newPath);
                
                // Scroll to the section
                setTimeout(() => {
                  const element = document.getElementById(sectionId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
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
              className="prose prose-slate dark:prose-invert max-w-none prose-sm mb-4"
              style={{ marginLeft: `${contentIndentationPx}px` }}
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(section.content.trim()) 
              }}
            />
          )}
          
          {hasChildren && (
            <div className="space-y-2">
              {section.children.map((child) => (
            <ContentSectionComponent
              key={child.id}
              section={child}
              depth={depth + 1}
              onSectionClick={onSectionClick}
              activeNodeId={activeNodeId}
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
  testProp
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
        {sections.map((section) => (
        <ContentSectionComponent
          key={section.id}
          section={section}
          depth={0}
          onSectionClick={onSectionClick}
          activeNodeId={activeNodeId}
        />
        ))}
      </div>
  );
};