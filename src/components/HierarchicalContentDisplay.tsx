import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
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
}

const parseHierarchicalContent = (content: string): ContentSection[] => {
  const lines = content.split('\n');
  const sections: ContentSection[] = [];
  const stack: ContentSection[] = [];
  let currentContent = '';
  let sectionId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,10})\s*(.+?)(?:\s*\[(.*?)\])?$/);
    
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
}> = ({ section, depth }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = section.children.length > 0;
  const hasContent = section.content.trim().length > 0;

  const getHeadingClass = (level: number) => {
    const baseClasses = "font-semibold text-foreground";
    switch (level) {
      case 1: return `${baseClasses} text-2xl`;
      case 2: return `${baseClasses} text-xl`;
      case 3: return `${baseClasses} text-lg`;
      case 4: return `${baseClasses} text-base`;
      default: return `${baseClasses} text-sm`;
    }
  };

  const getIndentClass = (depth: number) => {
    return `ml-${Math.min(depth * 4, 20)}`; // Cap indentation at ml-20
  };

  return (
    <div className={`${depth > 0 ? getIndentClass(depth) : ''}`}>
      <div className="flex items-start gap-2 group">
        {(hasChildren || hasContent) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-1 p-1 hover:bg-accent rounded transition-colors"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className={`${getHeadingClass(section.level)} cursor-pointer`}
              onClick={() => (hasChildren || hasContent) && setIsExpanded(!isExpanded)}>
            {section.title}
          </h1>
          
          {section.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {section.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2">
          {hasContent && (
            <div 
              className="prose prose-slate dark:prose-invert max-w-none prose-sm mb-4"
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
  content 
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
        />
      ))}
    </div>
  );
};