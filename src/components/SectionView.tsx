import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContentNode } from '@/services/contentService';
import { extractSectionContent } from '@/lib/sectionExtractor';
import { HierarchicalContentDisplay } from '@/components/HierarchicalContentDisplay';

interface SectionViewProps {
  sectionId: string;
  allContentNodes: ContentNode[];
  onEdit: (sectionData: {
    content: string;
    title: string;
    level: number;
    position: number;
    parentPath: string;
  }) => void;
}

interface DocumentSection {
  id: string;
  level: number;
  title: string;
  tags: string[];
  children: DocumentSection[];
}

const parseDocumentSections = (content: string): DocumentSection[] => {
  const lines = content.split('\n');
  const sections: DocumentSection[] = [];
  const stack: DocumentSection[] = [];
  let sectionId = 0;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,30})\s*(.+?)(?:\s*\[(.*?)\])?$/);
    
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const tags = headingMatch[3] ? headingMatch[3].split(',').map(tag => tag.trim()) : [];
      
      const section: DocumentSection = {
        id: `section-${++sectionId}`,
        level,
        title,
        tags,
        children: []
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
    }
  }

  return sections;
};

export const SectionView: React.FC<SectionViewProps> = ({
  sectionId,
  allContentNodes,
  onEdit
}) => {
  const navigate = useNavigate();
  const [sectionData, setSectionData] = useState<{
    content: string;
    title: string;
    level: number;
    position: number;
    parentPath: string;
    parentContent: ContentNode;
  } | null>(null);

  useEffect(() => {
    // Find the section in all content nodes
    for (const contentNode of allContentNodes) {
      if (contentNode.content) {
        const sections = parseDocumentSections(contentNode.content);
        
        const findSection = (sections: DocumentSection[], targetId: string, position = 0): any => {
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (section.id === targetId) {
              const content = extractSectionContent(contentNode.content || '', section);
              return {
                content: content || '',
                title: section.title,
                level: section.level,
                position: position + i,
                parentPath: contentNode.path,
                parentContent: contentNode
              };
            }
            
            const found = findSection(section.children, targetId, position + i + 1);
            if (found) return found;
          }
          return null;
        };
        
        const found = findSection(sections, sectionId);
        if (found) {
          setSectionData(found);
          return;
        }
      }
    }
  }, [sectionId, allContentNodes]);

  if (!sectionData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Section not found</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(sectionData.parentPath)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {sectionData.parentContent.title}
          </Button>
          <h1 className="text-3xl font-bold">{sectionData.title}</h1>
        </div>
        <Button 
          onClick={() => onEdit({
            content: sectionData.content,
            title: sectionData.title,
            level: sectionData.level,
            position: sectionData.position,
            parentPath: sectionData.parentPath
          })}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Section
        </Button>
      </div>

      {/* Section Content */}
      <div className="prose prose-slate max-w-none">
        <HierarchicalContentDisplay content={sectionData.content} />
      </div>
    </div>
  );
};