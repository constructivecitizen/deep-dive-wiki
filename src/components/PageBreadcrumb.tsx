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

  // Don't show breadcrumb if we're at the folder level (no section hierarchy and no page content beyond folder)
  if (hierarchicalTrail.length === 0 || (hierarchicalTrail.length === 1 && !sectionHierarchy.length && !sectionTitle)) {
    return null;
  }

  const handleNavigationClick = (item: ContentItem) => {
    // Navigate to the clicked item
    navigate(item.path);
    // Clear section view
    if (onSectionBack) {
      onSectionBack();
    }
  };

  return (
    <div className="animate-fade-in mb-2">
      <div className="flex items-center gap-2 text-base text-muted-foreground flex-wrap">
        {hierarchicalTrail.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span 
              className={`text-xs font-medium cursor-pointer hover:text-foreground transition-colors ${
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
              className="text-xs font-medium cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSectionNavigate?.(section.title)}
            >
              {section.title}
            </span>
          </div>
        ))}
        
      </div>
    </div>
  );
};