import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentItem } from '@/services/contentService';
import { useNavigate } from 'react-router-dom';

interface PageBreadcrumbProps {
  currentPath: string;
  navigationStructure: ContentItem[];
  pageTitle?: string;
  sectionTitle?: string;
  onSectionBack?: () => void;
}

export const PageBreadcrumb = ({ 
  currentPath, 
  navigationStructure, 
  pageTitle,
  sectionTitle,
  onSectionBack
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
            <Badge 
              variant="outline" 
              className={`text-xs font-medium cursor-pointer hover:bg-accent transition-colors ${
                index === hierarchicalTrail.length - 1 && !sectionTitle ? 'bg-primary/10 text-primary border-primary/20' : ''
              }`}
              onClick={() => handleNavigationClick(item)}
            >
              {item.title}
            </Badge>
            {(index < hierarchicalTrail.length - 1 || sectionTitle) && (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
        ))}
        
        {sectionTitle && (
          <span className="font-medium text-foreground bg-primary/10 text-primary px-2 py-1 rounded text-xs border border-primary/20">
            {sectionTitle}
          </span>
        )}
      </div>
      <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent w-full"></div>
    </div>
  );
};