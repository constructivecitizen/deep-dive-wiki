import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { WikiDocument } from "@/services/contentService";

interface ContentNavigationSidebarProps {
  contentNodes: WikiDocument[];
  onNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
}

interface ContentItemProps {
  document: WikiDocument;
  onNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
}

const ContentItem = ({ document, onNodeClick, activeNodeId }: ContentItemProps) => {
  const handleShowInMain = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNodeClick) {
      onNodeClick(document.id);
    }
  };

  // Get first section content for preview
  const firstSection = document.content_json?.[0];
  const displayContent = firstSection?.content || firstSection?.title || document.title;
  const truncatedContent = displayContent.length > 60 
    ? `${displayContent.substring(0, 60)}...`
    : displayContent;

  const isActive = activeNodeId === document.id;

  return (
    <div className="animate-fade-in">
      <div 
        className={`flex items-center gap-2 py-2 px-3 hover:bg-secondary/50 cursor-pointer wiki-transition group ${
          isActive ? 'bg-primary/10 border-r-2 border-primary' : ''
        }`}
        onClick={handleShowInMain}
      >
        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-40 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium leading-relaxed ${
            isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
          } wiki-transition`}>
            {document.title}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {truncatedContent}
          </div>
        </div>
        
        {/* Clickout button to show in main display */}
        <button
          onClick={handleShowInMain}
          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded wiki-transition flex-shrink-0"
          aria-label="Show in main display"
          title="Show in main display"
        >
          <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
        </button>
      </div>
    </div>
  );
};

export const ContentNavigationSidebar = ({ 
  contentNodes, 
  onNodeClick, 
  activeNodeId 
}: ContentNavigationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter documents based on search query
  const filteredDocuments = contentNodes.filter(doc => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const titleMatch = doc.title.toLowerCase().includes(query);
    const contentMatch = JSON.stringify(doc.content_json).toLowerCase().includes(query);
    const tagsMatch = doc.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return titleMatch || contentMatch || tagsMatch;
  });

  return (
    <div className="h-full bg-card border-r border-border overflow-y-auto animate-fade-in">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg text-foreground mb-2">Content Navigation</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Document Explorer
        </p>
        
        {/* Search functionality */}
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>
      
      <div className="py-2">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((document) => (
            <ContentItem 
              key={document.id} 
              document={document}
              onNodeClick={onNodeClick}
              activeNodeId={activeNodeId}
            />
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {searchQuery ? 'No matching documents found' : 'No documents available'}
          </div>
        )}
      </div>
    </div>
  );
};