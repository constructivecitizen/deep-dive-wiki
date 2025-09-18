import { ChevronRight } from 'lucide-react';

interface SimpleBreadcrumbProps {
  path: string;
}

export const SimpleBreadcrumb = ({ path }: SimpleBreadcrumbProps) => {
  // Parse the path into breadcrumb segments
  const segments = path.split('/').filter(Boolean);
  
  // Create breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const title = segment.split('-').map(word => 
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
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          {item.isLast ? (
            <span className="text-foreground font-medium">{item.title}</span>
          ) : (
            <a 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.title}
            </a>
          )}
        </div>
      ))}
    </nav>
  );
};