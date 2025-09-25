import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavigationNode } from '@/services/contentService';

interface SimpleBreadcrumbProps {
  path: string;
  navigationStructure?: NavigationNode[];
}

export const SimpleBreadcrumb = ({ path, navigationStructure = [] }: SimpleBreadcrumbProps) => {
  // Create a flat map of path to navigation node for quick lookup
  const createPathMap = (nodes: NavigationNode[]): Map<string, NavigationNode> => {
    const pathMap = new Map<string, NavigationNode>();
    
    const traverse = (items: NavigationNode[]) => {
      items.forEach(item => {
        pathMap.set(item.path, item);
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    
    traverse(nodes);
    return pathMap;
  };

  const pathMap = createPathMap(navigationStructure);
  
  // Parse the path into breadcrumb segments
  const segments = path.split('/').filter(Boolean);
  
  // Create breadcrumb items using actual navigation titles when available
  const breadcrumbItems = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    
    // Try to get title from navigation structure first
    const navNode = pathMap.get(href);
    const title = navNode?.title || segment.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return { href, title, isLast: index === segments.length - 1 };
  });

  // Add home if not root
  if (path !== '/') {
    breadcrumbItems.unshift({ href: '/', title: 'Home', isLast: false });
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />}
          {item.isLast ? (
            <span className="text-foreground font-medium">{item.title}</span>
          ) : (
            <Link 
              to={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};