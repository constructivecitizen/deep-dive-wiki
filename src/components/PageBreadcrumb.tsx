import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentItem } from '@/services/contentService';
import { useNavigate } from 'react-router-dom';

interface PageBreadcrumbProps {
  currentPath: string;
  navigationStructure: ContentItem[];
  pageTitle?: string;
  sectionTitle?: string;
  sectionHierarchy?: Array<{
    title: string;
    level: number;
  }>;
  onSectionBack?: () => void;
  onSectionNavigate?: (sectionTitle: string) => void;
}

export const PageBreadcrumb = ({ 
  currentPath, 
  navigationStructure, 
  pageTitle,
  sectionTitle,
  sectionHierarchy = [],
  onSectionBack,
  onSectionNavigate
}: PageBreadcrumbProps) => {
  const navigate = useNavigate();
  
  // Build the full hierarchical trail
  const buildHierarchicalTrail = (path: string, structure: ContentItem[]): ContentItem[] => {
    const trail: ContentItem[] = [];
    
    const findPathInStructure = (items: ContentItem[], targetPath: string, currentTrail: ContentItem[]): boolean => {
      for (const item of items) {
        const newTrail = [...currentTrail, item];
        
        if (item.path === targetPath) {
          trail.push(...newTrail);
          return true;
        }
        
        if (item.children && item.children.length > 0) {
          if (findPathInStructure(item.children, targetPath, newTrail)) {
            return true;
          }
        }
      }
      return false;
    };
    
    findPathInStructure(structure, path, []);
    return trail;
  };

  const hierarchicalTrail = buildHierarchicalTrail(currentPath, navigationStructure);

  if (hierarchicalTrail.length === 0) {
    return null;
  }

  const handleNavigationClick = (item: ContentItem) => {
    if (onSectionBack && sectionTitle) {
      // If we're viewing a section, first go back to the document
      onSectionBack();
    } else {
      // Navigate to the clicked item
      navigate(item.path);
    }
  };

  return (
    <div className="animate-fade-in mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
        {hierarchicalTrail.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span 
              className={`text-xs font-medium cursor-pointer hover:text-foreground transition-colors underline decoration-1 underline-offset-2 ${
                index === hierarchicalTrail.length - 1 && !sectionTitle ? 'text-primary' : ''
              }`}
              onClick={() => handleNavigationClick(item)}
            >
              {item.title}
            </span>
            {index < hierarchicalTrail.length - 1 && (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
        ))}
        
        {/* Show section hierarchy */}
        {sectionHierarchy.map((section, index) => (
          <div key={`section-${index}`} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3" />
            <span 
              className="text-xs font-medium cursor-pointer hover:text-foreground transition-colors underline decoration-1 underline-offset-2"
              onClick={() => onSectionNavigate?.(section.title)}
            >
              {section.title}
            </span>
          </div>
        ))}
        
      </div>
      <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent w-full"></div>
    </div>
  );
};