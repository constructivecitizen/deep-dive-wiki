import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentItem } from '@/services/contentService';

interface PageBreadcrumbProps {
  currentPath: string;
  navigationStructure: ContentItem[];
  pageTitle?: string;
}

export const PageBreadcrumb = ({ 
  currentPath, 
  navigationStructure, 
  pageTitle 
}: PageBreadcrumbProps) => {
  // Find the parent topic for the current page
  const findParentTopic = (path: string, structure: ContentItem[]): ContentItem | null => {
    for (const item of structure) {
      if (item.children) {
        // Check if any child matches the current path
        const childMatch = item.children.find(child => child.path === path);
        if (childMatch) {
          return item;
        }
        // Recursively check nested children
        const nestedMatch = findParentTopic(path, item.children);
        if (nestedMatch) {
          return nestedMatch;
        }
      }
    }
    return null;
  };

  const parentTopic = findParentTopic(currentPath, navigationStructure);

  if (!parentTopic) {
    return null;
  }

  return (
    <div className="animate-fade-in mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Badge variant="outline" className="text-xs font-medium">
          {parentTopic.title}
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">
          {pageTitle || 'Current Page'}
        </span>
      </div>
      <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent w-full"></div>
    </div>
  );
};