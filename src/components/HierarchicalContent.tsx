import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag } from '@/components/Tag';

export interface ContentNode {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  depth: number;
  path?: string;
}

interface HierarchicalContentProps {
  sections: Array<{
    id?: string;
    title?: string;
    content?: string;
    level?: number;
    tags?: string[];
  }>;
  showTags?: boolean;
  onSectionClick?: (sectionId: string) => void;
}

const ContentItem = ({ section, showTags = true, onSectionClick }: {
  section: {
    id?: string;
    title?: string;
    content?: string;
    level?: number;
    tags?: string[];
  };
  showTags?: boolean;
  onSectionClick?: (sectionId: string) => void;
}) => {
  return (
    <div className="py-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-foreground leading-relaxed">
                {section.content || section.title}
              </div>
              
              {showTags && section.tags && section.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {section.tags.map((tag, index) => (
                    <Tag key={index} text={tag} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HierarchicalContent = ({ sections, showTags = true, onSectionClick }: HierarchicalContentProps) => {
  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <ContentItem key={section.id || index} section={section} showTags={showTags} onSectionClick={onSectionClick} />
      ))}
    </div>
  );
};